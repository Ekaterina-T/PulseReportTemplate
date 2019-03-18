class PageResponseRate {



    /**
     * @memberof PageResponseRate
     * @function Hide
     * @description function to hide the page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function Hide(context){

        return false;
    }

    /**
     * @memberof PageResponseRate
     * @function Render
     * @description function to render the page
     * @param {Object} context - {component: page, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */

    static function Render(context){

    }

    /**
     * @memberof PageResponseRate
     * @function tableResponseRate_AddBanner
     * @description function to add standard set of headers for Response Rate calculation
     * @param {Object} context - {component: table, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param {String} placement - where to add headers - 'column' or 'row'
     */
    static function tableResponseRate_AddBanner(context, placement) {

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;
        var placement = (placement == 'column') ? table.ColumnHeaders : table.RowHeaders;

        // 1st row - the number of emails. Header Content and subheader are used for having possibility to change column title in Library
        var invitation  = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'Invitation');
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, invitation.qId);
        var hq: HeaderQuestion = new HeaderQuestion(qe);
        hq.IsCollapsed = true;
        hq.ShowTotals = false;
        hq.FilterByMask = true;
        if (invitation.codes.length) {
            var qmask: MaskFlat = new MaskFlat(true);
            qmask.Codes.AddRange(invitation.codes);
            hq.AnswerMask = qmask;
        }
        hq.Distributions.Enabled = true;
        hq.Distributions.Count = true;
        hq.HideHeader = true;
        var hc : HeaderSegment = new HeaderSegment(TextAndParameterUtil.getLabelByKey(context, 'Invitations'), '');
        hc.DataSourceNodeId = DataSourceUtil.getDsId (context);
        hc.SubHeaders.Add(hq);
        placement.Add(hc);

        //2nd row - the number of completes. Header Content and subheader are used for having possibility to change column title in Library
        var response  = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'Response');
        qe = QuestionUtil.getQuestionnaireElement(context, response.qId);
        var hq2: HeaderQuestion = new HeaderQuestion(qe);
        hq2.IsCollapsed = true;
        hq2.FilterByMask = true;
        hq2.ShowTotals = false;
        hq2.Distributions.Enabled = true;
        hq2.Distributions.Count = true;
        hq2.HideHeader = true;
        if (response.codes.length) {
            var qmask2 : MaskFlat = new MaskFlat(true);
            qmask2.Codes.AddRange(response.codes);
            hq2.AnswerMask = qmask2;
        }
        var hc2 : HeaderSegment = new HeaderSegment(TextAndParameterUtil.getLabelByKey(context, 'Responses'), '');
        hc2.DataSourceNodeId = DataSourceUtil.getDsId (context);
        hc2.SubHeaders.Add(hq2);
        placement.Add(hc2);

        //3rd row - formula for ResponseRate
        var hf:HeaderFormula = new HeaderFormula();
        hf.Operator = FormulaOperatorType.Divide;
        hf.LeftArgument = -1;
        hf.RightArgument = -2;
        hf.Percent = true;
        hf.Title = TextAndParameterUtil.getLabelByKey(context, "ResponseRate");
        placement.Add(hf);
    }

    /**
     * @memberof PageResponseRate
     * @function tableResponseRate_Render
     * @description function to build Response Rate table
     * @param {Object} context - {component: table, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableResponseRate_Render(context){

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;

        //add rows - standard set of headers for response rate calculation
        tableResponseRate_AddBanner(context, 'row');

        // global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Columns = false;
        table.RemoveEmptyHeaders.Rows = false;
    }

    /**
     * @memberof PageResponseRate
     * @function tableCollectionPeriod_Render
     * @description function to build the table showing the range of dates
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableCollectionPeriod_Render(context){

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;

        var project : Project = DataSourceUtil.getProject(context);
        var qId  = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'DateQuestion');
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, qId);
        var column: HeaderQuestion = new HeaderQuestion(qe);
        column.TimeSeries.FlatLayout = true;
        column.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
        column.TimeSeries.Time2 = TimeseriesTimeUnitType.Month;
        column.TimeSeries.Time3 = TimeseriesTimeUnitType.DayOfMonth;
        column.IsCollapsed = false;
        column.ShowTitle = false;
        column.ShowTotals = false;
        table.ColumnHeaders.Add(column);

        // global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Columns = true;
    }



    /**
     * @memberof PageResponseRate
     * @function getCollectionPeriod
     * @description function to get the collection period for a survey
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {String} - a string with data range when interviews have been started by respondents
     */

    static function getCollectionPeriod (context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;

        var dates = report.TableUtils.GetColumnHeaderCategoryTitles("Response_Rate:CollectionPeriod");
        if (dates.length > 0) {
            var period = dates[0];
            if (dates.length > 1) {
                period += '-' + dates[dates.length-1]
            }
        }
        else {
            period = 'N/A';
        }
        return period;
    }



    /**
     * @memberof PageResponseRate
     * @function getResponseRateSummary
     * @description function to get info for the top panel - invites, responses
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {Object} - basic info about response rate
     * @property {String} invitationN - # of inviatations
     * @property {String} responseN - # of responses
     */
    static function getResponseRateSummary (context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;

        var cell1 : Datapoint = report.TableUtils.GetCellValue("Response_Rate:ResponseRate",1,1);
        var cell2 : Datapoint = report.TableUtils.GetCellValue("Response_Rate:ResponseRate",2,1);
        var invitationN = (!cell1.IsEmpty && !cell1.Value.Equals(Double.NaN)) ? cell1.Value.ToString() : 'N/A';
        var responseN = (!cell2.IsEmpty && !cell2.Value.Equals(Double.NaN)) ? cell2.Value.ToString() : 'N/A';

        return {
            invitationN: invitationN,
            responseN: responseN
        }

    }



    /**
     * @memberof PageResponseRate
     * @function tableByTime_Render
     * @description function to build the table showing distribution by time unit - days, month, year
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableByTime_Render (context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;
        var table = context.table;


        // add rows - standard set of headers for response rate calculation
        tableResponseRate_AddBanner(context, 'row');
        /*table.RowHeaders[0].HideData = true;
        table.RowHeaders[0].SubHeaders[0].HideData = true;
        table.RowHeaders[1].HideData = true;
        table.RowHeaders[1].SubHeaders[0].HideData = true;*/

        // add column - date variable for trend
        var timeUnits = ParamUtil.GetSelectedOptions (context, 'p_TimeUnitWithDefault');

        if (timeUnits.length) {
            var dateQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'MailingDateQuestion');
            var qe:QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, dateQId);
            var timeQuestionCol: HeaderQuestion = new HeaderQuestion(qe);

            // though it can be multi-parameter, use only 1 option for trend
            var timeUnit = timeUnits[0];

            TableUtil.setTimeSeriesByTimeUnit(context, timeQuestionCol, timeUnit);

            // Set rolling if time unit count is specified in Config
            if (timeUnit.TimeUnitCount != null) {
                TableUtil.setRollingByTimeUnit(context, timeQuestionCol, timeUnit);
            }

            timeQuestionCol.ShowTotals = false;
            timeQuestionCol.HideData = false;
            timeQuestionCol.HideHeader = false;
            timeQuestionCol.TimeSeries.FlatLayout = true;

            table.ColumnHeaders.Add(timeQuestionCol);
        }

        // global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Columns = true;
        table.RemoveEmptyHeaders.Rows = false;
    }



    /**
     * @memberof PageResponseRate
     * @function tableByDistribution_Render
     * @description function to build the table showing distribution by demographic variables
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */

    static function tableByDemographics_Render (context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;
        var table = context.table;


        // add columns - standard set of headers for response rate calculation
        tableResponseRate_AddBanner(context, 'column');

        // add row - BGV variable
        var demographics = ParamUtil.GetSelectedOptions (context, 'p_Demographics');
        if (demographics.length) {
            var qId = demographics[0].Code;
            var qe:QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, qId);
            var hq: HeaderQuestion = new HeaderQuestion(qe);
            hq.ShowTotals = false;
            table.RowHeaders.Add(hq);
        }

        // global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Columns = false;
        table.RemoveEmptyHeaders.Rows = false;
    }


    /**
     * @memberof PageResponseRate
     * @function getRRResult
     * @description function to get Response Rate value
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {String} - Response Rate value
     */
    static function getRRResult(context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;

        var result = 'N/A';
        if (report.TableUtils.GetRowValues("Response_Rate:ResponseRate",1).length) {
            var cell : Datapoint = report.TableUtils.GetCellValue("Response_Rate:ResponseRate",3,1);
            if (!cell.IsEmpty && !cell.Value.Equals(Double.NaN)) {
                result = (100*cell.Value).toFixed(0)+'%';
            }
        }
        return result;

    }

}