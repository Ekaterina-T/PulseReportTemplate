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
        //table.RemoveEmptyHeaders.Columns = true;
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

        //var wave = getWaveColumn(context);
        var wave = getSelectedWavesColumns(context);

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
     * @function getSelectedWavesColumns
     * @description Create HeaderQuestion columns with the Waves selected from the dropdown
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @return {Object} created columns
     */
    static function getSelectedWavesColumns(context) {
        var log = context.log;
        var waveQid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');

        var selectedWave = ParamUtil.GetSelectedCodes(context, 'p_Wave');
        var selectedWaveType = ParamUtil.GetSelectedCodes(context, 'p_WaveSelector')[0];
        var numberOfWaves = 0;

        switch (selectedWaveType) {
            case "CurrentWave" : numberOfWaves = 1; break;
            case "LastTwoWaves" : numberOfWaves = 2; break;
            case "LastThreeWaves" : numberOfWaves = 3; break;
            default: numberOfWaves = 1; break;
        }

        var maskCodes = getLastNWavesFromSelected(context, numberOfWaves, waveQid, selectedWave);
        var waveHeaders = [];

        for(var i = 0; i < maskCodes.length; i++) {
            var gapHeader = getGapFormula(context);
            var waveHeader = getWaveColumn(context, waveQid, maskCodes[i]);

            var previousWave = getPreviousWaveFromSelected(context, waveQid, maskCodes[i]);
            var previousWaveHeader = getWaveColumn(context, waveQid, previousWave);

            //waveHeaders.push(gapHeader);
            waveHeaders.push(previousWaveHeader);
            waveHeaders.push(waveHeader);
        }

        return waveHeaders;
    }

    /**
     * @memberof PageAllResults
     * @function getLastNWavesFromSelected
     * @description gets last n waves from selected in dd parameter
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {Number} N - number of last waves needed
     * @param {Object} waveQid - id for the wave question
     * @param {String} selectedWave - code of the selected wave
     * @returns {Array} codes
     */
    static function getLastNWavesFromSelected(context, N, waveQid, selectedWave) {
        var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, waveQid);
        var codes = [];

        for (var i = answers.length - 1; i >= 0; i--) {
            if (answers[i].Precode == selectedWave) {
                codes.push(answers[i].Precode);
                for (var j = 1; j < N; j++) {
                    if (i - j >= 0) {
                        codes.push(answers[i - j].Precode);
                    }
                }
                break;
            }
        }

        return codes;
    }

    /**
     * @memberof PageAllResults
     * @function getPreviousWaveFromSelected
     * @description gets the id of the previous wave from the wave selected in the drop down
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {Object} waveQid - id for the wave question
     * @param {String} selectedWave - code of the selected wave
     * @returns {String} code of the previous wave
     */
    static function getPreviousWaveFromSelected(context, waveQid, selectedWave) {
        var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, waveQid);

        for (var i = 0; i < answers.length; i++) {
            if (answers[i].Precode == selectedWave) {
                if (i == 0) {
                    return null;
                } else {
                    return answers[i - 1];
                }
            }
        }
    }

    /*
     * @memberof PageAllResults
     * @function getGapFormula
     * @description Create HeaderFormula columns with the gap calculation between the wave and the previous wave
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @return {Object} created column
     */
    static function getGapFormula(context) {
        var gapFormula : HeaderFormula = new HeaderFormula();

        gapFormula.Type = FormulaType.Expression;
        gapFormula.Expression = 'cellv(col-2, row) - cellv(col-1,row)';
        gapFormula.Decimals = 0;
        gapFormula.Title = TextAndParameterUtil.getLabelByKey(context, 'HRGap');

        return gapFormula;
    }

    /*
     * @memberof PageAllResults
     * @function getWaveColumn
     * @description Create HeaderQuestion column with the Wave
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {Object} waveQid - id for the wave question
     * @param {Object} maskCodes - codes for the mask
     * @return {HeaderQuestion} created column
     */
    static function getWaveColumn(context, waveQid, maskCodes) {
        //var waveQid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var waveQe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, waveQid);

        if(!!maskCodes) {
            var waveHeader: HeaderQuestion = new HeaderQuestion(waveQe);

            var qmask: MaskFlat = new MaskFlat();
            qmask.IsInclusive = true;

            if (ArrayUtil.isArray(maskCodes)) {
                qmask.Codes.AddRange(maskCodes);
            } else {
                qmask.Codes.Add(maskCodes);
            }

            waveHeader.AnswerMask = qmask;
            waveHeader.FilterByMask = true;
            waveHeader.ShowTotals = false;

            return waveHeader;
        } else {
            var emptyWaveHeader : HeaderFormula = new HeaderFormula();
            emptyWaveHeader.Expression = 'emptyv()';
            emptyWaveHeader.Title = TextAndParameterUtil.getLabelByKey(context, 'HRGap');

            return emptyWaveHeader;
        }

    }

    /*
     * @memberof PageAllResults
     * @function getBaseColumn
     * @description Create HeaderBase column
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {Object} subHeaders
     * @return {HeaderBase} created column
     */
    static function getBaseColumn(context, subHeaders) {
        var headerBase: HeaderBase = new HeaderBase();

        if(!!subHeaders && ArrayUtil.isArray(subHeaders)) {
            for(var i = 0; i < subHeaders.length; i++) {
                headerBase.SubHeaders.Add(subHeaders[i]);
            }
        }

        return headerBase;
    }

    /*
     * @memberof PageAllResults
     * @function getQuestionColumn
     * @description Create HeaderQuestion column with the Question
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {Object} question
     * @param {Object} subHeaders
     * @return {HeaderQuestion} created column
     */
    static function getQuestionColumn(context, question, subHeaders) {
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

        if(!!subHeaders && ArrayUtil.isArray(subHeaders)) {
            for(var i = 0; i < subHeaders.length; i++) {
                questionColumn.SubHeaders.Add(subHeaders[i]);
            }
        }

        return questionColumn;
    }
}