class PulseProgramUtil {

    static public var pulseSurveyContentInfo = {};

    static private var resourcesDependentOnSpecificSurvey = {

        Survey: ['FiltersFromSurveyData'],
        Page_KPI: ['KPI', 'KPIQuestionsToFilterVerbatim'],
        Page_Trends: ['TrendQuestions'],
        Page_Results: ['BreakVariables'],
        Page_Comments: ['Comments', 'ScoresForComments', 'TagsForComments', 'BreakVariables'],
        Page_Categorical_: ['ResultCategoricalQuestions', 'ResultMultiCategoricalQuestions'],
        Page_CategoricalDrilldown: ['BreakVariables'],
        Page_Response_Rate: []
    }

    /**
     * creates array of qids and category ids that need to be checked against pulse
     * @param {Object} context
     * @returns {Array} object where property is resourceId (question or dimension) and value is its type
     */
    static private function getResourcesList (context) {

        var log = context.log;
        var listOfResources = [];
        var resources = [];
        var resourcesLog = {};
        var i;
        var surveyProperties = resourcesDependentOnSpecificSurvey['Survey'];
        var pageId = 'Page_'+ context.pageContext.Items['CurrentPageId'];
        var pageProperties = resourcesDependentOnSpecificSurvey[pageId];

        // keep property values in array
        for(i=0; i<surveyProperties.length; i++) {
            listOfResources=listOfResources.concat(DataSourceUtil.getSurveyPropertyValueFromConfig (context, surveyProperties[i]));
        }

        for(i=0; i<pageProperties.length; i++) {
            listOfResources=listOfResources.concat(DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, pageProperties[i]));
        }

        //remove duplicates and format
        for(i=0; i<listOfResources.length; i++) {
            var item = listOfResources[i];
            var code;
            var type;

            if(typeof item === 'string') {
                code = item;
                type = 'QuestionId';
            } else { //dimension
                code = item.Code;
                type = item.Type; 
            }

            if(code && !resourcesLog.hasOwnProperty(code)) {
                resources.push({Code: code, Type: type});
                resourcesLog[code] = true;
            }
        }

        return resources;        
    }

    /**
     * pushes resources list into 'cache' (static var) with key = enduserEmail_pageId (to avoid end user data conflicts)
     * @param {Object} context
     * @returns {Array} object where property is resourceId (question or dimension) and value is its type
     */
    static public function setPulseSurveyContentInfo (context) {

        var log = context.log;
        var pageId = 'Page_'+ context.pageContext.Items['CurrentPageId'];
        var key = getKeyForPulseSurveyContentInfo(context);

        pulseSurveyContentInfo[key] = {};
        pulseSurveyContentInfo[key] = getResourcesList(context);

        return pulseSurveyContentInfo[key]; //??? if correct
    }

    /**
     * @param {Object} context
     * @returns {Object} key - qid or category id that has >0 answers
     */
     static public function getPulseSurveyContentInfo_ItemsWithData (context) {

        var log = context.log;
        var report = context.report;

        var key = getKeyForPulseSurveyContentInfo(context);
        var resources = pulseSurveyContentInfo[key];
        var resourcesBase : Datapoint[] = report.TableUtils.GetColumnValues('PulseSurveyData:PulseSurveyContentInfo', 1);
        var resourcesWithData = {};

        for(var i=0; i< resources.length; i++) {

            var baseVal: Datapoint = resourcesBase[i];
            if(baseVal.Value>0) {
                resourcesWithData[resources[i].Code] = { Type: resources[i].Type};
            }
        }

        return resourcesWithData;
     }

    /**
     * create key for 'cache', need because static vars are shared among end users
     * @param {Object} context
     * @returns {string} key
     */
    static public function getKeyForPulseSurveyContentInfo(context) {

        var log = context.log;
        var currentPage = PageUtil.getCurrentPageIdInConfig (context);
        var pageContext = context.pageContext;
        var key = pageContext.Items['userEmail']+'_'+currentPage;//+'_'+selectedProject;

        return key;
    }

    /**
      * Recieves full list of options and exclude from it those without answers
     * @param {Object} context
     * @param {Array} list of options
     * @returns {Array} options with answers
      */
    static public function excludeItemsWithoutData(context, allOptions) {

        var log = context.log;

        var resources = setPulseSurveyContentInfo(context);

        if(DataSourceUtil.isProjectSelectorNeeded(context) || !resources || resources.length === 0) { //not pulse program or there's nothing to exclude on this page
            return allOptions;
        }

        var availableCodes = PulseProgramUtil.getPulseSurveyContentInfo_ItemsWithData(context);
        var optionsWithData = [];

        for(var i=0; i<allOptions.length; i++) {
            if(typeof allOptions[i] === 'object' && availableCodes.hasOwnProperty(allOptions[i].Code)) {
                optionsWithData.push(allOptions[i]);
            } else if (typeof allOptions[i] === 'string' && availableCodes.hasOwnProperty(allOptions[i])) {
                optionsWithData.push(allOptions[i]);
            }
        }

        return optionsWithData;
     }

    /**
     * Debug function that prints PulseSurveyContentInfo into log
     * @param {Object} context
     */
     static public function printPulseSurveyContentInfoTable (context) {

        var log = context.log;
        var report = context.report;
        var key = getKeyForPulseSurveyContentInfo(context);

        if(pulseSurveyContentInfo.hasOwnProperty(key) && pulseSurveyContentInfo[key].length>0) {

            var resourcesBase : Datapoint[] = report.TableUtils.GetColumnValues('PulseSurveyData:PulseSurveyContentInfo', 1);
            var resources = pulseSurveyContentInfo[key];
            var resourcesData = {};

            for(var i=0; i< resources.length; i++) {
                var baseVal: Datapoint = resourcesBase[i];
                resourcesData[resources[i].Code] = { Value: baseVal.Value};
            }

            log.LogDebug('Data from PulseSurveyContentInfo table: '+JSON.stringify(resourcesData));
        }
        
    }
}