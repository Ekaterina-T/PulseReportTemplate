class PulseProgramUtil {

    static public var pulseSurveyContentInfo = {};

    static public var pulseSurveyContentBaseValues = {};

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
        var key = getKeyForPulseSurveyContentInfo(context);

        delete pulseSurveyContentInfo.key;
        pulseSurveyContentInfo[key] = getResourcesList(context);
        
        log.LogDebug('setPulseSurveyContentInfo'+JSON.stringify(pulseSurveyContentInfo))

        return; 
    }

    /**
     * 
     */
    static public function setPulseSurveyContentBaseValues (context) {

        var log = context.log;
        var key = getKeyForPulseSurveyContentInfo(context);
        var report = context.report;

        var resourcesBase : Datapoint[] = report.TableUtils.GetColumnValues('PulseSurveyData:PulseSurveyContentInfo', 1);
        var baseValues = [];

        for(var i=0; i< resourcesBase.length; i++) {
            var baseVal: Datapoint = resourcesBase[i];
            baseValues.push(baseVal[i].Value);
        }

        delete pulseSurveyContentBaseValues.key;
        pulseSurveyContentBaseValues[key] = baseValues;
        
        log.LogDebug('setPulseSurveyContentBaseValues'+JSON.stringify(pulseSurveyContentBaseValues))

        return;
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
        var key = pageContext.Items['userEmail']+'_'+currentPage;//+'_'+DataSourceUtil.getDsId(context);

        return key;
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
        var resourcesBase = pulseSurveyContentBaseValues[key];
        var resourcesWithData = {};

        log.LogDebug('table col len = '+resourcesBase.length)

        for(var i=0; i< resources.length; i++) {
            var baseVal = resourcesBase[i];
            if(baseVal>0) {
                resourcesWithData[resources[i].Code] = { Type: resources[i].Type};
            }
        }

        return resourcesWithData;
     }

    /**
      * Recieves full list of options and exclude from it those without answers
     * @param {Object} context
     * @param {Array} list of options
     * @returns {Array} options with answers
      */
    static public function excludeItemsWithoutData(context, allOptions) {

        var log = context.log;
        var key = getKeyForPulseSurveyContentInfo(context);
        var resources = pulseSurveyContentInfo.hasOwnProperty(key) && pulseSurveyContentInfo[key];

        //not pulse program or there's nothing to exclude on this page
        if(DataSourceUtil.isProjectSelectorNeeded(context) || !resources || resources.length === 0) { 
            return allOptions;
        }

        var availableCodes = getPulseSurveyContentInfo_ItemsWithData(context);
        var optionsWithData = [];

        for(var i=0; i<allOptions.length; i++) {
            // options can be a list of objects with code property or just a list of codes
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

        log.LogDebug('printPulseSurveyContentInfoTable');
        log.LogDebug(JSON.stringify(pulseSurveyContentInfo[key]));

        if(pulseSurveyContentInfo.hasOwnProperty(key) && pulseSurveyContentInfo[key].length>0) {

            var resourcesBase = pulseSurveyContentBaseValues[key];
            var resources = pulseSurveyContentInfo[key];
            var resourcesData = {};

            log.LogDebug('resources.len='+resources.length);
            log.LogDebug('resourcesBase.len='+resourcesBase.length);

            for(var i=0; i< resources.length; i++) {
                var baseVal = resourcesBase[i];
                resourcesData[resources[i].Code] = { Value: baseVal.Value};
            }

            log.LogDebug('Data from PulseSurveyContentInfo table: '+JSON.stringify(resourcesData));
        } else {
            log.LogDebug('Data from PulseSurveyContentInfo table: no data');
        }

    }
}