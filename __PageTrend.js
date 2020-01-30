class PageTrend {

    /**
     * @memberof PageTrend
     * @function Hide
     * @description function to hide the page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function Hide(context){
        // TO DO: hide page depending on suppress data settings ???
        return false;
    }

    /**
     * @memberof PageTrend
     * @function Render
     * @description function to render the page
     * @param {Object} context - {component: page, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */

    static function Render(context){

    }

    /**
     * @memberof PageTrend
     * @function htlComments_Hide
     * @description function to hide the hitlist
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableTrend_Hide(context){

        return SuppressUtil.isGloballyHidden(context);

    }

    /**
     * @memberof PageTrend
     * @function htlComments_Render
     * @description function to render the trend table
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableTrend_Render(context) {

        var state = context.state;
        var table = context.table;
        var suppressSettings = context.suppressSettings;
        var log = context.log;

        // add rows (1 or more KPI questions)
        var headers = ParamUtil.GetSelectedOptions(context, "p_TrendQs");

        for (var i = 0; i < headers.length; i++) {
            table.RowHeaders.Add(TableUtil.getTrendHeader(context, headers[i]));
        }

        // in pulse program Trend shows comparison between surveys
        if(!DataSourceUtil.isProjectSelectorNotNeeded(context)) {

            var pid: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, 'source_projectid');
            var pidHQ: HeaderQuestion = new HeaderQuestion(pid);

            //take values from config
            var projectsToShow = ParamUtil.GetSelectedCodes(context, 'p_Trends_trackerSurveys'); 
            var qMask : MaskFlat = new MaskFlat();
            qMask.IsInclusive = true;
            qMask.Codes.AddRange(projectsToShow);

            pidHQ.AnswerMask = qMask;
            pidHQ.FilterByMask = false;
            pidHQ.IsCollapsed = false;
            pidHQ.ShowTotals = false;
            pidHQ.HideHeader = true;

            table.ColumnHeaders.Add(pidHQ);
            table.RemoveEmptyHeaders.Rows = false;
            table.RemoveEmptyHeaders.Columns = false;

        } else {
            // add column - trending by Date variable
            var dateQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'DateQuestion');
            TableUtil.addTrending(context, dateQId);
            table.RemoveEmptyHeaders.Rows = true;
        }


        // global table settings
        table.Caching.Enabled = false;
        SuppressUtil.setTableSuppress(table, suppressSettings);
    }

    /**
     * @memberof PageKPI
     * @function chartTrend_Hide
     * @description function to hide the trend chart
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function chartTrend_Hide(context){

        return !DataSourceUtil.isProjectSelectorNotNeeded(context) || SuppressUtil.isGloballyHidden(context) || Export.isExcelExportMode(context);

    }

}