class __SpecificPulseSurveyData {

    static var resourcesDependentOnSpecificSurvey = {

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
     *@param {Object} context
     * @returns {Array} array of strings and objects listing questions and dimensions used on the page and dependent on selected pulse survey
     */
    static function getListOfResourcesForCurrentPage (context) {

        var currentPage = 'Page_'+context.pageContext.Items['CurrentPageId'];
        var listOfResources = [];

        //var take survey level resources
        var surveyProperties = resourcesDependentOnSpecificSurvey['Survey'];
        var pageProperties = resourcesDependentOnSpecificSurvey[currentPage];

        var i;

        // push survey level variables
        for(i=0; i< surveyProperties.length; i++) {
            listOfResources=listOfResources.concat(DataSourceUtil.getSurveyPropertyValueFromConfig (context, surveyProperties[i]));
        }

        //push page level variables
        for(i=0; i< pageProperties.length; i++) {
            listOfResources=listOfResources.concat(DataSourceUtil.getPagePropertyValueFromConfig (context, currentPage, pageProperties[i]));
        }

        return listOfResources;

    }

}