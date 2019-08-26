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

        var state = context.state;
        //var pSelectedProject: ParameterValueResponse = state.Parameters['p_projectSelector'];
        //var selectedProject = pSelectedProject.StringKeyValue || pSelectedProject.StringValue;
        var key = context.user.Email+'_'+pageId;//+'_'+selectedProject;

        pulseSurveyContentInfo[key] = {}; 
        pulseSurveyContentInfo[key] = getResourcesList(context, pageId);

        return pulseSurveyContentInfo[key]; //??? if correct
    }

    /**
     * 
     */
     static public function getPulseSurveyContentInfo_ItemsWithData (context, pageId) {

        var log = context.log;

        var report = context.report;
        var pageContext = context.pageContext;
        var user = context.user;

        log.LogDebug('1')

        var resourcesBase : Datapoint[] = report.TableUtils.GetColumnValues('PulseSurveyData:PulseSurveyContentInfo', 1);
        var currentPage = (pageId) ? 'Page_'+pageId : 'Page_'+ pageContext.Items['CurrentPageId'];
        log.LogDebug('2')
        //var pSelectedProject: ParameterValueResponse = state.Parameters['p_projectSelector'];
        //var selectedProject = pSelectedProject.StringKeyValue || pSelectedProject.StringValue;
        var key = user.Email+'_'+pageId;//+'_'+selectedProject;
        var resources = pulseSurveyContentInfo[key];
        var resourcesWithData = {};
        log.LogDebug(JSON.stringify(pulseSurveyContentInfo));
        log.LogDebug(key)
        for(var i=0; i< resources.length; i++) {

            var baseVal: Datapoint = resourcesBase[i];
            if(baseVal.Value>0) {
                resourcesWithData[resources[i].Code] = { Type: resources[i].Type};
            }
        }
        log.LogDebug('4')
        log.LogDebug(JSON.stringify(resourcesWithData));

        return resourcesWithData;
     }

}