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
    static function tableTrend_Render(context){

        var report = context.report;
        var state = context.state;
        var table = context.component;
        var log = context.log;

        // add rows (1 or more KPI questions)
        var Qs = ParamUtil.GetSelectedCodes (context, "p_TrendQs");

        for (var i=0; i<Qs.length; i++) {
            var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, Qs[i]);
            var row: HeaderQuestion = new HeaderQuestion(qe);
            row.IsCollapsed = true;
            row.DefaultStatistic = StatisticsType.Average;
            row.HideHeader = true;
            TableUtil.maskOutNA(context, row);
            table.RowHeaders.Add(row);
        }


        // add column (Date variable)

        var timeUnits = ParamUtil.GetSelectedOptions (context, 'p_TimeUnitWithDefault');
        if (timeUnits.length) {
            var dateQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'DateQuestion');
            qe = QuestionUtil.getQuestionnaireElement(context, dateQId);
            var timeQuestionCol: HeaderQuestion = new HeaderQuestion(qe);

            // though it can be multi-parameter, use only 1 option for trend
            var timeUnit = timeUnits[0];
            TableUtil.setTimeSeriesByTimeUnit(context, timeQuestionCol, timeUnit);

            // Set rolling if time unit count is specified in Config
            if (timeUnit.TimeUnitCount != null) {
                TableUtil.setRollingByTimeUnit(context, timeQuestionCol, timeUnit);
            }

            timeQuestionCol.ShowTotals = false;
            timeQuestionCol.TimeSeries.FlatLayout = true;
            table.ColumnHeaders.Add(timeQuestionCol);
        }


        // global table settings

        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Columns = true;
        SuppressUtil.setTableSuppress(table, 'row', 'hide', 'hide');


    }

    static function chartTrend_Hide(context){

        return SuppressUtil.isGloballyHidden(context);

    }

}