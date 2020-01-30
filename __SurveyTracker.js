class SurveyTracker {

    /**
     * Gets list of all pulse surveys from the allSurveys table in SystemPages -> PulseSurveyData -> AllSurveys table
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @returns {Answer[]} array of Answers like {Precode: pid, Text: pname}
     */
    static function getAllSurveyDescriptors(context) {

        var project : Project = DataSourceUtil.getProject(context);
        var source_projectid: Question = project.GetQuestion('source_projectid');
        return source_projectid.GetAnswers();
    }

    /**
     * Gets Code and Label from list of all surveys - in case we change object which getAllSurveyNames function returns
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @param {string} pid - contains id of the survey for which we get its name
     * @returns {object} {Code: pid, Text: pname}
     */
    static function getSurveyDescriptorByPid(context, pid) {

        var project : Project = DataSourceUtil.getProject(context);
        var source_projectid: Question = project.GetQuestion('source_projectid');
        var info: Answer = source_projectid.GetAnswer(pid);
        return {Code: info.Precode, Label: info.Text};
    }

    /**
     * Gets one previous survey for survey with id = trackerId from TrackerString property in Config.
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @param {string} pid - contains id of the survey for which we look for previous surveys
     * @returns {object} survey descriptor {Code pid, Label: pname}
     */
    static private function getComparisonTrackerBySurveyId(context, pid) {

        //only relevant for pulse programs
        if(DataSourceUtil.isProjectSelectorNotNeeded(context)) {
            return null;
        }

        var trackerStrings = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'Tracker_ComparisonSurvey');

        if(trackerStrings.hasOwnProperty(pid) && trackerStrings[pid]) {
            return getSurveyDescriptorByPid(context, trackerStrings[pid]);
        } else {
            return null;
        }
    }

    /**
     * Gets one previous survey to survey selected in report dropdown.
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @returns {object} survey descriptor {Code pid, Label: pname}
     */
    static public function getComparisonTrackerForSelectedPid(context) {
        var projectSelected = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
        return getComparisonTrackerBySurveyId(context, projectSelected[0]);
    }

    /**
     * Gets array of trackers (pids) from Trackers property of Config.
     * If passed pid exists in a tracker, then this tracker is returned.
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @param {string} pid - contains id of the survey for which we look for previous surveys
     * @returns {Array} - array of pids
     */
    static private function getTrackersBySurveyId(context, pid) {

        var log = context.log;

        log.LogDebug('pid='+pid);
        var trackerArrays = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'Trackers');

        log.LogDebug('trackerArrays='+JSON.stringify(trackerArrays));

        for(var trackerId in trackerArrays) {
            var trackers = trackerArrays[trackerId];
            var testStr = '&'+trackers.join('&')+'&';
            log.LogDebug('testStr='+testStr);
            log.LogDebug(testStr.indexOf('&'+pid+'&'));
            if(testStr.indexOf('&'+pid+'&')>-1) {
                return trackers;
            }
        }

        return [];
    }

    /**
     * Gets array of trackers (pids) from Trackers for survey selected in report dropdown.
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @returns {Array} - array of pids
     */
    static public function getTrackersForSelectedPid(context) {
        var projectSelected = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
        return getTrackersBySurveyId(context, projectSelected[0]);
    }

}
