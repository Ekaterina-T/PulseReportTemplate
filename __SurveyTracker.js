class SurveyTracker {

    /**
    * Gets TrackerString property from Config
    * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
    * @return {Array} - tracker surveys related to the selected pulse survey
    */
    static function getTrackerStringFromConfig(context, trackerStringId) {
        var log = context.log;

        //only relevant for pulse programs
        if(DataSourceUtil.isProjectSelectorNotNeeded(context)) {
            return [];
        }

        //search for trackerStringId - pid, if nothing else specified explicitly
        if(!trackerStringId) {
            trackerStringId = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
        }

        var trackerStrings = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'TrackerStrings');

        if(trackerStrings.hasOwnProperty(trackerStringId)) {
            return trackerStrings[trackerStringId];
        } else {
            return [];
        }
    }

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
            if (allNames[i].Code == pid) {
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
     * @param {string} trackerId - contains id of the survey for which we look for previous surveys
     * @returns {object} survey descriptor {Code pid, Label: pname}
    */
    static function getOnePreviousSurvey(context, trackerId) {
        var allSurveys = getTrackerStringFromConfig(context);
        var currentTrackerIndex = -1;
        var previousSurveyId = '';

        for (var i = 0; i < allSurveys.length; i++) {
            if (allSurveys[i] == trackerId) {
                currentTrackerIndex = i;
                break;
            }
        }

        if(currentTrackerIndex != -1 && (currentTrackerIndex + 1) < allSurveys.length) {
            previousSurveyId = allSurveys[currentTrackerIndex+1];
        } else {
            return null; //previous survey is undefined
        }

        return getSurveyDescriptorByPid(context, previousSurveyId);
    }

    /**
    * Gets one previous survey to survey selected in report dropdown.
    * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
    */
    static function getPreviousSurveyToSelected(context) {
        var projectSelected = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
        return getOnePreviousSurvey(context, projectSelected[0]);
    }


    /**
    * Gets all previous surveys for survey with id = trackerId from TrackerString property in Config.
    * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
    * @param {string} trackerId - contains id of the survey for which we look for previous surveys
    */
    /*
    static function getAllPreviousSurveys(context, trackerId) {
    var allSurveys = getTrackerStringFromConfig(context);
    var currentTrackerIndex = -1;
    var previousSurveyIds = [];

    for (var i = 0; i < allSurveys.length; i++) {
    if (allSurveys[i] == trackerId) {
      currentTrackerIndex = i;
      break;
    }
    }

    var previousSurveys = [];
    if (currentTrackerIndex != -1) {
    for (var j = currentTrackerIndex + 1; j < allSurveys.length; j++) {
    if (allSurveys[j] != '') {
        previousSurveyIds.push(allSurveys[j]);
    }
    }
    for (var i = 0; i < previousSurveyIds.length; i++) {
    previousSurveys.push(getSurveyName(previousSurveyIds[i]));
    }
    }
    return previousSurveys;
    }
    */

    /**
    *  Gets all previous surveys to survey selected in report dropdown.
    * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
    */
    /*
    static function getAllPreviousSurveysToSelected(context) {
    var projectSelected = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
    return getAllPreviousSurveys(context, projectSelected[0]);
    }

    */

}
