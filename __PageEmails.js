class PageEmails {
    
        /**
         * @memberof PageEmails
         * @function Hide
         * @description function to hide the page
         * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
         * @returns {Boolean}
         */
        static function Hide(context) {
            return false;
        }
    
        /**
         * @memberof PageEmails
         * @function Render
         * @description function to render the page
         * @param {Object} context - {component: page, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
         */
        static function Render(context){
    
        }
    
        /**
         * @memberof PageEmails
         * @function hitlistComments_Hide
         * @description function to hide the hitlist
         * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
         * @returns {Boolean}
         */
        static function hitlistComments_Hide(context){
           var log = context.log;
          return Hitlist.hitlistComments_Hide(context, "Base");
        }
		
		/**
         * @memberof PageEmails
         * @function setDatasource
         * @description sets datasource for the Emails page from config setting 'Source' for this page
         * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
         */
        static function setDatasource(context) {
          var log = context.log;
          var pageId = context.page.CurrentPageId;
          var pageContext = context.pageContext;
          
          var emails_source = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'Source');
          if (!pageContext.Items['PageSource']) {
             pageContext.Items.Add('PageSource', emails_source);
          }
        }
    
        /**
         * @memberof PageEmails
         * @function hitlistComments_Render
         * @description function to render the hitlist
         * @param {Object} context - {component: hitlist, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
         */
        static function hitlistComments_Render(context){
    
            var log = context.log;
            var pageId = PageUtil.getCurrentPageIdInConfig(context);
    
            var staticCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns');
    
			context.isCustomSource = true;
            for (var i=0; i<staticCols.length; i++) {
                Hitlist.AddColumn(context, staticCols[i], {sortable: true, searchable: true});
            }
        }
    
         /**
         * @memberof PageEmails
         * @function tableBase_Render
         * @description function to render the Base table used to check required base for Hitlist
         * @param {Object} context - {component: hitlist, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}     
         */
          static function tableBase_Render (context) {
              var log = context.log;
              var open_Ids = ParamUtil.GetSelectedCodes (context, 'p_AllOpenTextQs');
              var tag_Ids = ParamUtil.GetSelectedCodes (context, 'p_TagQs');
              SuppressUtil.buildReportBaseTableForHitlist(context, open_Ids, tag_Ids);
          }
  
  
         /**
         * @memberof PageEmails
         * @function tableEmailStatusSummary_Render
         * @description function to render the Email Status table used to show short summary of email statuses
         * @param {Object} context - {component: hitlist, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}     
         */
          static function tableEmailStatusSummary_Render (context) {
            var log = context.log;
            var table = context.table;
            var suppressSettings = context.suppressSettings;
               
            var questionnaireElement: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, 'smtpstatus');
            var headerQuestion: HeaderQuestion = new HeaderQuestion(questionnaireElement);
            headerQuestion.IsCollapsed = false;
            TableUtil.maskOutNA(context, headerQuestion);
            table.Decimals = 0;
            table.RowHeaders.Add(headerQuestion);
            SuppressUtil.setTableSuppress(table, suppressSettings);
          }
  
    /**
    * @memberof PageEmails
    * @function tableEmailStatusSummary_Hide
    * @description function to hide the EmailStatusSummary table
    * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
    * @returns {Boolean}
    */
    static function tableEmailStatusSummary_Hide(context){

     return SuppressUtil.isGloballyHidden(context);

   }
}
