class SpecificPulseSurveyData {

    static public var resourcesInfo = {};

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
     * @returns {Object} object where property is resourceId (question or dimension) and value is its type
     */
    static private function setResourcesInfoForCurrentPage (context, pageId) {

        var currentPage = pageId ? 'Page_'+pageId : 'Page_'+context.pageContext.Items['CurrentPageId'];
        var listOfResources = [];
        var resources = {};

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

        //remove duplicates and format
        for(i=0; i<listOfResources.length; i++) {
            var item = listOfResources[i];

            if(typeof item === 'string') {
                resources[item] = 'QuestionId';
            } else {
                resources[item.Code] = item.Type; //dimension
            }
        }

        resourcesInfo = resources;
    }

    /**
     * @param {Object} context
     * @param {string} pageId - not mandatory
     */
    static public function tablePulseProgramSpecificItems_Render(context, pageId) {

        var log = context.log;
        var report = context.report;
        var table = context.table;
        
        setResourcesInfoForCurrentPage(context, pageId);

        for(var resourceID in resourcesInfo) {

            var base: HeaderBase = new HeaderBase();
            var header;

            if(resources[resourceID] === 'Dimension') { //category;            
              
                header = new HeaderCategorization();
                header.CategorizationId = resourceID;
                header.DataSourceNodeId = DataSourceUtil.getDsId(context);
                header.Collapsed = true;
                header.Totals = true;
                table.RowHeaders.Add(header); // to avoid case when previous header is added if troubles 

            } else if (resources[resourceID] === 'QuestionId') {  // question id

                var questionInfo = QuestionUtil.getQuestionInfo(context, resourceID);
                var qe: QuestionnaireElement =  QuestionUtil.getQuestionnaireElement(context, resourceID);
                var questionType;

                //define question type to apply correct header properties later
                (questionInfo.hasOwnProperty('standardType')) ? questionType = questionInfo.standardType : questionType = questionInfo.type;

                if(questionType.indexOf('single')>=0) {

                    header = new HeaderQuestion(qe);
                    header.IsCollapsed = true;
                    header.ShowTotals = false;
                    table.RowHeaders.Add(header); 

                } else if(questionType.indexOf('multi')>=0) {

                    header = new HeaderQuestion(qe);

                    var mask : MaskFlat = new MaskFlat();
                    mask.IsInclusive = true;
                    header.AnswerMask = mask;
                    header.IsCollapsed = true;
                    header.ShowTotals = true;
                    table.RowHeaders.Add(header);
                  
                } else if(questionType.indexOf('open')>=0) {

                    header = new HeaderQuestion(qe);
                    header.IsCollapsed = true;
                    table.RowHeaders.Add(header);
                }                     
            }
            
        }

        table.ColumnHeaders.Add(base);
        table.Caching.Enabled = false;
    }

}