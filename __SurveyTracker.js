class SurveyTracker {

    /**
     * Gets list of all pulse surveys from the allSurveys table in SystemPages -> PulseSurveyData -> AllSurveys table
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @returns {Array} array of objects like {Code: pid, Label: pname}
     */
    static function getAllSurveyDescriptors(context) {
        return PulseSurveysInfoFabric.getPulseSurveysInfo(context,  {
            type: 'ReportTable',
            tableName:'PulseSurveyData:AllSurveys_PidPname',
            isEmptyOptionNeeded: false,
            additionalInfo: {'CreatedByEndUserName': false, 'Status': false}// order is important, do not delete anything
        }).getPulseSurveys(context);
    }

    /**
     * Gets Code and Label from list of all surveys - in case we change object which getAllSurveyNames function returns
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     * @param {string} pid - contains id of the survey for which we get its name
     * @returns {object} {Code: pid, Label: pname}
     */
    static function getSurveyDescriptorByPid(context, pid) {
        var allDescriptors = getAllSurveyDescriptors(context);
        var surveyDescriptor = {};

        for (var i = 0; i < allDescriptors.length; i++) {
            if (allDescriptors[i].Code == pid) {
                surveyDescriptor.Label = allDescriptors[i].Label;
                surveyDescriptor.Code = allDescriptors[i].Code;
                break;
            }
        }
        return surveyDescriptor;
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

        var trackerArrays = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'Trackers');

        for(var trackerId in trackerArrays) {
            var trackers = trackerArrays[trackerId];
            var testStr = '&'+trackers.join('&')+'&';
            if(testStr.indexOf('&'+pid+'&')>-1) {
                return trackers;
            }
        }
        return null;
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
