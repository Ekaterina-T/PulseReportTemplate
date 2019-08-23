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

    /**
     * @param{Object} context
     */
    static function tablePulseProgramSpecificItems_Render(context) {

        var log = context.log;
        var report = context.report;
        var table = context.table;
        var items = getListOfResourcesForCurrentPage(context);
        var i;


        for(var i=0; i<items.length; i++) {

            var item = items[i];

            if(typeof item === 'object' and item.Type === 'Dimension') { //category id

            } else if (typeof item === 'string') {  // question id

                var questionInfo = QuestionUtil.getQuestionInfo(context, item);
                var qe: QuestionnaireElement =  QuestionUtil.getQuestionnaireElement(context, item);
                var header: Header;
                var questionType;

                //define question type to set correct header properties later
                (questionInfo.hasOwnProperty(standardType)) ? questionType = questionInfo.standardType : questionType = questionInfo.type;

                if(questionType.indexOf('single')>=0) {

                    header = new HeaderQuestion(qe);
                    header.IsCollapsed = true;
                    header.ShowTotals = false;

                } else if(questionType.indexOf('multi')>=0) {

                    header = new HeaderQuestion(qe);

                    var mask : MaskFlat = new MaskFlat();
                    mask.IsInclusive = true;
                    header.AnswerMask = mask;

                    header.IsCollapsed = true;
                    header.ShowTotals = true;
                } else if (questionType.indexOf('open')) {

                }
            }
        }


    }

}