class TableUtil{

    /**
     * @memberof TableUtil
     * @function setTimeSeriesByTimeUnit
     * @description function to set time series for a header question depending on the value of parameter TimeUnitsWithDefaultValue ot TimeUnitsNoDefaultValue
     * @param {Object} context - {report: report, user: user, state: state, log: log}
     */
    static function setTimeSeriesByTimeUnit(context, headerQuestion, timeUnit){

        if (!timeUnit || !headerQuestion) {
            throw new Error("TableUtil.setTimeSeriesByTimeUnit: HeaderQuestion or TimeUnit is not defined");
        }

        var timeUnitCode = timeUnit.Code;

        switch (timeUnitCode) {
            case 'Y':
                headerQuestion.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
                break;

            case 'Q':
                headerQuestion.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
                headerQuestion.TimeSeries.Time2 = TimeseriesTimeUnitType.Quarter;
                break;

            case 'M':
                headerQuestion.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
                headerQuestion.TimeSeries.Time2 = TimeseriesTimeUnitType.Month;
                break;

            case 'D':
                headerQuestion.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
                headerQuestion.TimeSeries.Time2 = TimeseriesTimeUnitType.Month;
                headerQuestion.TimeSeries.Time3 = TimeseriesTimeUnitType.DayOfMonth;
                break;

            default:
                headerQuestion.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
        }

    }


    /**
     * @memberof TableUtil
     * @function setRollingByTimeUnit
     * @description function to set rolling timesseries for a header question depending on the value of parameter TimeUnitsWithDefaultValue ot TimeUnitsNoDefaultValue
     * @param {Object} context - {report: report, user: user, state: state, log: log}
     */
    static function setRollingByTimeUnit(context, headerQuestion, timeUnit){

        if (!timeUnit || !headerQuestion) {
            throw new Error("TableUtil.setRollingByTimeUnit: HeaderQuestion or TimeUnit is not defined");
        }

        var timeUnitCode = timeUnit.Code;

        headerQuestion.TimeSeries.RollingTimeseries.Enabled = true;
        headerQuestion.TimeSeries.RollingTimeseries.From = -(timeUnit.TimeUnitCount - 1);
        headerQuestion.TimeSeries.RollingTimeseries.To = 0;

        switch (timeUnitCode) {
            case 'Y':
                headerQuestion.TimeSeries.RollingTimeseries.Unit = RollingUnitType.Year;
                break;

            case 'Q':
                headerQuestion.TimeSeries.RollingTimeseries.Unit = RollingUnitType.Quarter;
                break;

            case 'M':
                headerQuestion.TimeSeries.RollingTimeseries.Unit = RollingUnitType.Month;
                break;

            case 'D':
                headerQuestion.TimeSeries.RollingTimeseries.Unit = RollingUnitType.Day;
                break;

            default:
                headerQuestion.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
        }

    }

    /*
     * Function sets start and end date for Date header.
     * That allows to limit date interval and number of columns in table when
     * 1) RemoveEmptyHeaders Option is off and 2) Date filter is applied
     * param {object} context {report: report, user: user, state: state, log: log}
     * param {HeaderQuestion} headerDateQuestion - header based on date question
     */

    static function applyDateRangeFilterToHeader(context, headerDateQuestion) {

        var dateRange = DateUtil.defineDateRangeBasedOnFilters(context);

        if(dateRange) {
            headerDateQuestion.TimeSeries.StartDate = dateRange.startDate;
            headerDateQuestion.TimeSeries.EndDate = dateRange.endDate;
        }

        return;
    }

    /*
   * Function that excludes NA answer from header.
   * param {object} context {state: state, report: report, pageContext: pageContext, log: log}
   * param {Header} headerQuestion or headerCategory
   */

    static function maskOutNA(context, header) {

        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var naCode = DataSourceUtil.getPropertyValueFromConfig(context, pageId, 'NA_answerCode');

        if(!naCode) {
            return;
        }

        if(header.HeaderType === HeaderVariableType.QuestionnaireElement) {
            var qId = header.QuestionnaireElement.QuestionId;
            var project : Project = DataSourceUtil.getProject(context);
            var q : Question = project.GetQuestion(qId);

            // additional check for Multi. Apply Mask only if a question has NA answer, otherwise Internal Server Error
            if (q.QuestionType != QuestionType.Multi || (q.QuestionType == QuestionType.Multi && QuestionUtil.hasAnswer(context, qId, naCode))) {
                var qMask : MaskFlat = new MaskFlat();
                qMask.Codes.Add(naCode);
                qMask.IsInclusive = false;
                header.AnswerMask = qMask;
                header.FilterByMask = true;
            }

        }

        if(header.HeaderType === HeaderVariableType.Categories) {
            header.IgnoreCodes = naCode;
            header.Mask.Type = MaskType.HideCodes;
            header.Mask.Codes = naCode;
        }
    }


    /*
   * Add nested header based on BreakVariables and BreakByTimeUnits properties for 'Results' page.
   * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext}
   * @param {Header} parent header
   */

    static function addBreakByNestedHeader(context, parentHeader) {

        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var breakByTimeUnits = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'BreakByTimeUnits');
        var breakVariables = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'BreakVariables');
        var breakByParameter = null;
        var breakByType = null;
        var nestedHeader: HeaderQuestion;
        var questionElem: QuestionnaireElement;

        if(breakByTimeUnits && breakVariables && breakVariables.length>0) {
            throw new Error('TableUtil.addBreakByNestedHeader: only one property can be used for break by, exclude either BreakByTimeUnits or BreakVariables from config for the DS, page '+pageId);
        }

        if(!(breakByTimeUnits || (breakVariables && breakVariables.length>0))) { // none of break by values set in config
            return;
        }
        //TO DO: get rid of explicit page names
        if(breakByTimeUnits && pageId === 'Page_Results') {
            breakByParameter = 'p_TimeUnitNoDefault';
            breakByType = 'TimeUnit';
        } else if(breakByTimeUnits && pageId === 'Page_CategoricalDrilldown') {
            breakByParameter = 'p_CatDD_TimeUnitNoDefault';
            breakByType = 'TimeUnit';
        } else if(breakVariables && breakVariables.length>0 && pageId === 'Page_Results') {
            breakByParameter = 'p_Results_BreakBy';
            breakByType = 'Question';
        } else if(breakVariables && breakVariables.length>0 && pageId === 'Page_CategoricalDrilldown') {
            breakByParameter = 'p_CategoricalDD_BreakBy';
            breakByType = 'Question';
        }

        var selectedOption = ParamUtil.GetSelectedOptions(context, breakByParameter)[0];

        if(selectedOption==null || selectedOption.Code === 'na') {//no break by option is selected
            return;
        }

        if(breakByType === 'TimeUnit') { // break by time unit

            var qid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'DateQuestion');

            questionElem = QuestionUtil.getQuestionnaireElement(context, qid);
            nestedHeader = new HeaderQuestion(questionElem);
            nestedHeader.ShowTotals = false;
            nestedHeader.TimeSeries.FlatLayout = true;

            nestedHeader.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
            if(selectedOption.TimeUnit === 'Quarter') {
                nestedHeader.TimeSeries.Time2 = TimeseriesTimeUnitType.Quarter;
            } else if(selectedOption.TimeUnit === 'Month') {
                nestedHeader.TimeSeries.Time2 = TimeseriesTimeUnitType.Month;
            } else if(selectedOption.TimeUnit === 'Day') {
                nestedHeader.TimeSeries.Time2 = TimeseriesTimeUnitType.Month;
                nestedHeader.TimeSeries.Time3 = TimeseriesTimeUnitType.DayOfMonth;
            }

            TableUtil.applyDateRangeFilterToHeader(context, nestedHeader);
            parentHeader.SubHeaders.Add(nestedHeader);

            return;
        }

        if(breakByType === 'Question') { // break by time unit

            questionElem = QuestionUtil.getQuestionnaireElement(context, selectedOption.Code);
            nestedHeader = new HeaderQuestion(questionElem);
            nestedHeader.ShowTotals = false;
            parentHeader.SubHeaders.Add(nestedHeader);

            return;
        }
    }

}