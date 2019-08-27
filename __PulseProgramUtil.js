class PulseProgramUtil {

    static public var pulseSurveyContentInfo = {};

    static private var resourcesDependentOnSpecificSurvey = {

        Survey: ['FiltersFromSurveyData'],
        Page_KPI: ['KPI', 'KPIComment', 'KPIQuestionsToFilterVerbatim'],
        Page_Trends: ['TrendQuestions'],
        Page_Results: ['BreakVariables'],
        Page_Comments: ['Comments', 'ScoresForComments', 'TagsForComments', 'BreakVariables'],
        Page_Categorical_: ['ResultCategoricalQuestions', 'ResultMultiCategoricalQuestions'],
        Page_CategoricalDrilldown: ['BreakVariables'],
        Page_Response_Rate: []
    }

    /**
     * @param {Object} context
     * @param {string} pageId - not mandatory
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
     * 
     */
    static public function setPulseSurveyContentInfo (context) {

        var pageId = 'Page_'+ context.pageContext.Items['CurrentPageId'];
        var key = context.user.Email+'_'+pageId;//+'_'+selectedProject;

        pulseSurveyContentInfo[key] = {}; 
        pulseSurveyContentInfo[key] = getResourcesList(context);

        return pulseSurveyContentInfo[key]; //??? if correct
    }

    /**
     * 
     */
     static public function getPulseSurveyContentInfo_ItemsWithData (context, pulseSurveyContentInfoKey) {

        var log = context.log;
        var report = context.report;
        var user = context.user;
        var pageContext = context.pageContext;

        var resources = pulseSurveyContentInfo[pulseSurveyContentInfoKey];

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
      * 
      */
     static function excludeItemsWithoutData(context, allOptions) {

        var currentPage = 'Page_'+ context.pageContext.Items['CurrentPageId'];
        var key = context.user.Email+'_'+currentPage;//+'_'+selectedProject;

        log.LogDebug('key='+key);
        log.LogDebug(JSON.stringify(pulseSurveyContentInfo[key]));

        if(!pulseSurveyContentInfo[key] || pulseSurveyContentInfo[key].length === 0) {
            return allOptions; //there's nothing to exclude
        }

        var availableCodes = PulseProgramUtil.getPulseSurveyContentInfo_ItemsWithData(context, key);
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
     

}