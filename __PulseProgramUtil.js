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
    static public function setPulseSurveyContentInfo (context, pageId) {
              
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
        var state = context.state;
        log.LogDebug(JSON.stringify(pulseSurveyContentInfo));
        log.LogDebug('getPulseSurveyContentInfo1')
        var selectedProject : ParameterValueResponse = state.Parameters['p_projectSelector'];
        
        log.LogDebug('getPulseSurveyContentInfo2')
        
        log.LogDebug('getPulseSurveyContentInfo3'+selectedProject.StringKeyValue)
        var key = context.user.Email+'_'+pageId+'_'+selectedProject.StringKeyValue;
        log.LogDebug(JSON.stringify(pulseSurveyContentInfo));
        log.LogDebug('key='+key);
        return pulseSurveyContentInfo[key];
    }

    /**
     * 
     */
     static public function getPulseSurveyContentInfo_WithData (context, pageId) {

        var log = context.log;
        var resourcesBase : Datapoint[] = context.report.TableUtils.GetColumnValues('PulseSurveyData:PulseSurveyContentInfo', 1);
        var currentPage = (pageId) ? 'Page_'+pageId : 'Page_'+context.pageContext.Items['CurrentPageId'];
        log.LogDebug('getPulseSurveyContentInfo_WithData 3: '+currentPage);
        var resources = getPulseSurveyContentInfo(context, currentPage);
        log.LogDebug('getPulseSurveyContentInfo_WithData 4');
        var resourcesWithData = [];
        log.LogDebug('getPulseSurveyContentInfo_WithData 5');
        for(var i=0; i< resources.length; i++) {

            var baseVal: Datapoint = resourcesBase[i];
            if(baseVal.Value>0) {
                resourcesWithData.push(resources[i]);
            }
        }
        log.LogDebug('getPulseSurveyContentInfo_WithData 6');
        return resourcesWithData;
     }

}