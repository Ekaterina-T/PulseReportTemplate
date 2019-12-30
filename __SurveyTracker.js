class SurveyTracker {
  
  /**
  * Gets TrackerString property from Config
  * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
  */
  static function getTrackerStringFromConfig(context) {
    var log = context.log;
    var pageContext = context.PageContext;
    if (DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'TrackerString')) {
        return DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'TrackerString');
    }
    else {
        throw new Error('TrackerString was not defined in Config!');
    }
  }
  
  /**
  * Gets one previous survey for survey with id = trackerId from TrackerString property in Config.
  * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
  * @param {string} trackerId - contains id of the survey for which we look for previous surveys
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

    if (currentTrackerIndex != -1) {
     for (var j = currentTrackerIndex + 1; j < allSurveys.length; j++) {
         if (allSurveys[j] != '') {
             previousSurveyId = allSurveys[j];
          	 break;
         }
     }
    }
    return getSurveyName(context, previousSurveyId);
  }
  
  /**
  * Gets all previous surveys for survey with id = trackerId from TrackerString property in Config.
  * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
  * @param {string} trackerId - contains id of the survey for which we look for previous surveys
  */
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

   /**
  * Gets one previous survey to survey selected in report dropdown.
  * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
  */
    static function getPreviousSurveyToSelected(context) {
      var projectSelected = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
      return getOnePreviousSurvey(context, projectSelected[0]);
    }

    /**
     *  Gets all previous surveys to survey selected in report dropdown.
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     */
    static function getAllPreviousSurveysToSelected(context) {
        var projectSelected = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
        return getAllPreviousSurveys(context, projectSelected[0]);
    }
  
  /**
  * Gets Code and Label from list of all surveys - in case we change object which getAllSurveyNames function returns
  * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
  * @param {string} pid - contains id of the survey for which we get its name
  */
  static function getSurveyName(context, pid) {
    var allNames = getAllSurveyNames(context);
    var filteredOption = {};
    
    for (var i = 0; i < allNames.length; i++) {
      if (allNames[i].Code == pid) {
        filteredOption.Label = allNames[i].Label;
        filteredOption.Code = allNames[i].Code;
        break;
      }
    }
    return filteredOption;
  }
  
  /**
  * Gets list of all pulse surveys from the allSurveys table in SystemPages -> PulseSurveyData -> AllSurveys table
  * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
  */
  static function getAllSurveyNames(context) {
    return PulseSurveysInfoFabric.getPulseSurveysInfo(context,  {
          type: 'ReportTable', 
          tableName:'PulseSurveyData:AllSurveys',
          isEmptyOptionNeeded: false, 
          additionalInfo: {'CreatedByEndUserName': false, 'Status': false}// order is important, do not delete anything
        }).getPulseSurveys(context);
  }
}
