class SpecificPulseSurveyData {

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
  
        pageId = (pageId) ? 'Page_'+pageId : 'Page_'+context.pageContext.Items['CurrentPageId'];

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
                //code = item.Code;
                //type = item.Type; 
            }

            if(code && !resourcesLog.hasOwnProperty(code)) {
                resources.push({Code: code, Type: type});
                resourcesLog[code] = true;
            }
        }

        return resources;        
    }

    /**
     * @param {Object} context
     * @param {string} pageId - not mandatory
     */
    static public function tablePulseProgramSpecificItems_Render(context, pageId) {

        var log = context.log;
        var report = context.report;
        var table = context.table;
        log.LogDebug('0')
        var resources = getResourcesList(context, pageId);
log.LogDebug(JSON.stringify(resources))
        for(var i=0; i< resources.length; i++) {

            var resource = resources[i];
            var base: HeaderBase = new HeaderBase();
            var header;
            
            if(resource.Type === 'Dimension') { //category;            
              
                header = new HeaderCategorization();
                header.CategorizationId = resource.Code;
                header.DataSourceNodeId = DataSourceUtil.getDsId(context);
                header.Collapsed = true;
                header.Totals = true;
                table.RowHeaders.Add(header); // to avoid case when previous header is added if troubles 

            } else if (resource.Type === 'QuestionId') {  // question id
                
                var questionInfo = QuestionUtil.getQuestionInfo(context, resource.Code);
                var qe: QuestionnaireElement =  QuestionUtil.getQuestionnaireElement(context, resource.Code);
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