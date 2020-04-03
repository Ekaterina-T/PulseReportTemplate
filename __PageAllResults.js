class PageAllResults {

    /**
    * @memberof PageAllResults
    * @function tableAllResults_Hide
    * @description function to hide the AllResultsTable table
    * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
    * @returns {Boolean}
    */
    static function tableAllResults_Hide(context){

     return SuppressUtil.isGloballyHidden(context);

   }

   /**
  * @memberof PageAllResults
  * @function tableAllResults_Render
  * @description function to render the AllResultsTable table
  * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
  */
   static function tableAllResults_Render(context){
     
     var table = context.table;
     var log = context.log;
     var suppressSettings = context.suppressSettings;
     var pageId = PageUtil.getCurrentPageIdInConfig(context);

     var hierarchyQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');
     var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, hierarchyQId);
     var hh: HeaderQuestion = new HeaderQuestion(qe);
     hh.ShowTotals = false;
     hh.HierLayout = HierLayout.Flat;
     table.RowHeaders.Add(hh);
     
     var waveQid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
     var waveQe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, waveQid);
     var nestedHeader : HeaderQuestion = new HeaderQuestion(waveQe);
     var maskCodes = getLastNWavesFromSelected(3, context);

     var qmask : MaskFlat = new MaskFlat();
     qmask.IsInclusive = true;
     qmask.Codes.AddRange(maskCodes);
     nestedHeader.AnswerMask = qmask;
     nestedHeader.FilterByMask = true;
     nestedHeader.ShowTotals = false;
     
     var Qs = TableUtil.getActiveQuestionsListFromPageConfig (context, pageId, 'Questions', true);
     
     for (var i=0; i<Qs.length; i++) { 
       
       var header = TableUtil.getHeaderDescriptorObject(context, Qs[i]);
       var col;
       
       if(header.Type === 'Question') {        
         qe = QuestionUtil.getQuestionnaireElement(context, header.Code);
         col = new HeaderQuestion(qe);
         col.IsCollapsed = true;
         col.DefaultStatistic = StatisticsType.Average;
         
       } else if(header.Type === 'Dimension') {
         
         col = new HeaderCategorization();        
         col.CategorizationId = String(header.Code).replace(/[ ,&]/g, '');
         col.DataSourceNodeId = DataSourceUtil.getDsId(context);
         col.DefaultStatistic = StatisticsType.Average;
         col.CalculationRule = CategorizationType.AverageOfAggregates; // AvgOfIndividual affects performance
         col.Preaggregation = PreaggregationType.Average;
         col.SampleRule = SampleEvaluationRule.Max;// https://jiraosl.firmglobal.com/bcolse/TQA-4116
         col.Collapsed = false;
         col.Totals = true;
         
       }      
       
       TableUtil.maskOutNA(context, col);
       col.SubHeaders.Add(nestedHeader);
       table.ColumnHeaders.Add(col);
     }       
   
     // global table settings
     table.Caching.Enabled = false;
     table.RemoveEmptyHeaders.Rows = true;
     table.RemoveEmptyHeaders.Columns = true;
     table.Decimals = Config.Decimal;
     table.TotalsFirst = true;
     SuppressUtil.setTableSuppress(table, suppressSettings);

   }

   /**
  * @memberof PageAllResults
  * @function getLastNWavesFromSelected
  * @description gets last n waves from selected in dd parameter
  * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
  * @param {Number} N - number of last waves needed
  * @returns {Array} codes
  */	  
     static function getLastNWavesFromSelected(N, context) {
   
     var waveQid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
     var selectedWave = ParamUtil.GetSelectedCodes(context, 'p_Wave');
     var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, waveQid);
     var codes = [];
       
       for (var i = answers.length-1; i >=0; i--) {
         if (answers[i].Precode == selectedWave) {
             codes.push(answers[i].Precode);	
             for (var j=1; j<N; j++) {
               if (i-j >= 0) codes.push(answers[i-j].Precode);
             }
             break;
         }
         
       }
       return codes;
     }
}