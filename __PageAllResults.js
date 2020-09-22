class PageAllResults {

    /**
     * @memberof PageAllResults
     * @function tableAllResults_Hide
     * @description function to hide the AllResultsTable table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableAllResults_Hide(context) {

        return SuppressUtil.isGloballyHidden(context);

    }

    /**
     * @memberof PageAllResults
     * @function tableAllResults_Render
     * @description function to render the AllResultsTable table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableAllResults_Render(context) {
        var table = context.table;
        var log = context.log;
        var suppressSettings = context.suppressSettings;

        // global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Rows = true;
        table.RemoveEmptyHeaders.Columns = true;
        table.Decimals = Config.Decimal;
        table.TotalsFirst = true;

        SuppressUtil.setTableSuppress(table, suppressSettings);

        tableAllResults_AddRows(context);
        tableAllResults_AddColumns(context);
    }

    /**
     * @memberof PageAllResults
     * @function tableAllResults_AddRows
     * @description function to add rows to the AllResultsTable table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableAllResults_AddRows(context) {
        var table = context.table;
        var log = context.log;

        var rowsQid = ParamUtil.GetSelectedCodes(context, 'p_AllResults_BreakBy')[0];
        var rowsQidInfo = QuestionUtil.getQuestionInfo(context, rowsQid);
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, rowsQid);
        var hrows: HeaderQuestion = new HeaderQuestion(qe);

        if (rowsQidInfo.standardType === 'hierarchy') { // the same code exists in __PageResponseRate by demographics function :(
            hrows.HierLayout = HierLayout.Flat;
        }

        hrows.ShowTotals = false;
        table.RowHeaders.Add(hrows);
    }

    /**
     * @memberof PageAllResults
     * @function tableAllResults_AddColumns
     * @description function to add columns to the AllResultsTable table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableAllResults_AddColumns(context) {
        var table = context.table;
        var log = context.log;

        var wave = getWaveColumn(context);

        var responses = getBaseColumn(context, wave);
        table.ColumnHeaders.Add(responses);

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var questions = TableUtil.getActiveQuestionsListFromPageConfig(context, pageId, 'Questions', true);

        for (var i = 0; i < questions.length; i++) {
            var questionColumn = getQuestionColumn(context, questions[i], wave);
            table.ColumnHeaders.Add(questionColumn);
        }
    }

    /*
     * @memberof PageAllResults
     * @function getBaseColumn
     * @description Create HeaderBase column
     * @return {HeaderBase} created column
     */
    static function getBaseColumn(context, subHeader) {
        var headerBase: HeaderBase = new HeaderBase();

        if(!!subHeader) {
            headerBase.SubHeaders.Add(subHeader);
        }

        return headerBase;
    }

    /*
     * @memberof PageAllResults
     * @function getWaveColumn
     * @description Create HeaderQuestion column with the Wave
     * @return {HeaderQuestion} created column
     */
    static function getWaveColumn(context) {
        var waveQid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var waveQe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, waveQid);
        var waveHeader: HeaderQuestion = new HeaderQuestion(waveQe);

        var maskCodes = getLastNWavesFromSelected(3, context);
        var qmask: MaskFlat = new MaskFlat();
        qmask.IsInclusive = true;
        qmask.Codes.AddRange(maskCodes);

        waveHeader.AnswerMask = qmask;
        waveHeader.FilterByMask = true;
        waveHeader.ShowTotals = false;

        return waveHeader;
    }

    /*
     * @memberof PageAllResults
     * @function getQuestionColumn
     * @description Create HeaderQuestion column with the Question
     * @return {HeaderQuestion} created column
     */
    static function getQuestionColumn(context, question, subHeader) {
        var header = TableUtil.getHeaderDescriptorObject(context, question);
        var questionColumn;

        if (header.Type === 'Question') {
            var qe = QuestionUtil.getQuestionnaireElement(context, header.Code);
            questionColumn = new HeaderQuestion(qe);
            questionColumn.IsCollapsed = true;
            questionColumn.DefaultStatistic = StatisticsType.Average;
        } else {
            if (header.Type === 'Dimension') {
                questionColumn = new HeaderCategorization();
                questionColumn.CategorizationId = String(header.Code).replace(/[ ,&]/g, '');
                questionColumn.DataSourceNodeId = DataSourceUtil.getDsId(context);
                questionColumn.DefaultStatistic = StatisticsType.Average;
                questionColumn.CalculationRule = CategorizationType.AverageOfAggregates; // AvgOfIndividual affects performance
                questionColumn.Preaggregation = PreaggregationType.Average;
                questionColumn.SampleRule = SampleEvaluationRule.Max;// https://jiraosl.firmglobal.com/bcolse/TQA-4116
                questionColumn.Collapsed = false;
                questionColumn.Totals = false;
            }
        }

        TableUtil.maskOutNA(context, questionColumn);

        if(!!subHeader) {
            questionColumn.SubHeaders.Add(subHeader);
        }

        return questionColumn;
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

        for (var i = answers.length - 1; i >= 0; i--) {
            if (answers[i].Precode == selectedWave) {
                codes.push(answers[i].Precode);
                for (var j = 1; j < N; j++) {
                    if (i - j >= 0) codes.push(answers[i - j].Precode);
                }
                break;
            }
        }

        return codes;
    }
}