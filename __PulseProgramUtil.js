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
    static private function getResourcesList (context, pageId) {

        var log = context.log;
        var listOfResources = [];
        var resources = [];
        var resourcesLog = {};
        var i;
        var surveyProperties = resourcesDependentOnSpecificSurvey['Survey'];
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
    static private function setPulseSurveyContentInfo (context, pageId) {
              
        var selectedProject : ParameterValueResponse = context.state.Parameters['p_projectSelector'];
        var key = context.user.Email+'_'+pageId+'_'+selectedProject.StringKeyValue;

        pulseSurveyContentInfo[key] = {}; 
        pulseSurveyContentInfo[key] = getResourcesList (context, pageId);      

        return pulseSurveyContentInfo[key]; //??? if correct
    }

    /**
     * 
     */
    static public function getPulseSurveyContentInfo(context, pageId) {

        var log = context.log;
        var selectedProject : ParameterValueResponse = context.state.Parameters['p_projectSelector'];
        var key = context.user.Email+'_'+pageId+'_'+selectedProject.StringKeyValue;

        return pulseSurveyContentInfo[key];
    }

    /**
     * 
     */
     static public function getPulseSurveyContentInfo_WithData (context, pageId) {

         var resourcesBase : Datapoint[] = report.TableUtils.GetColumnValues('PulseSurveyData:PulseSurveyContentInfo', 1);
         var currentPage = (pageId) ? 'Page_'+pageId : 'Page_'+context.pageContext.Items['CurrentPageId'];
         var resources = getPulseSurveyContentInfo(context, currentPage);
         var resourcesWithData = [];

         for(var i=0; i< resources.length; i++) {

            var baseVal: DataPoint = resourcesBase[i];
            if(baseVal.Value>0) {
                resourcesWithData.push(resources[i]);
            }
         }

         return resourcesWithData;
     }

}