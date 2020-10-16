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
        tableAllResults_ApplyConditionalFormatting(context);
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

        var selectedWave = ParamUtil.GetSelectedCodes(context, 'p_Wave')[0];
        var selectedWaveType = ParamUtil.GetSelectedCodes(context, 'p_WaveSelector')[0];
        var numberOfWaves = 0;

        switch (selectedWaveType) {
            case "CurrentWave" : numberOfWaves = 1; break;
            case "LastTwoWaves" : numberOfWaves = 2; break;
            case "LastThreeWaves" : numberOfWaves = 3; break;
            default: numberOfWaves = 1; break;
        }

        var maskCodes = TableUtil.getLastNWavesFromSelected(context, numberOfWaves, waveQid, selectedWave);
        var waveHeaders = [];
        var gapSettings = getGapSetting(context);

        for(var i = maskCodes.length - 1; i >= 0; i--) {
            var gapHeader = getGapFormula(context, gapSettings.ShowGap);
            var waveHeader = TableUtil.getWaveColumn(context, waveQid, maskCodes[i]);

            var previousWave = TableUtil.getPreviousWaveFromSelected(context, waveQid, maskCodes[i]);
            var previousWaveHeader = TableUtil.getWaveColumn(context, waveQid, previousWave);
            previousWaveHeader.HideHeader = true;
            previousWaveHeader.HideData = true;

            waveHeaders.push(gapHeader);
            waveHeaders.push(previousWaveHeader);
            waveHeaders.push(waveHeader);
        }

        return waveHeaders;
    }

    /*
     * @memberof PageAllResults
     * @function getGapFormula
     * @description Create HeaderFormula columns with the gap calculation between the wave and the previous wave
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {Boolean} isVisible - whether this column is visible or not
     * @return {Object} created column
     */
    static function getGapFormula(context, isVisible) {
        var gapFormula : HeaderFormula = new HeaderFormula();

        gapFormula.Type = FormulaType.Expression;
        gapFormula.Expression = 'IF((cellv(col+2, row) = emptyv() OR cellv(col+1,row) = emptyv()), emptyv(), ROUND(cellv(col+2, row)) - ROUND(cellv(col+1,row)))';
        gapFormula.Decimals = 0;
        gapFormula.HideHeader = !isVisible;
        gapFormula.HideData = !isVisible;
        gapFormula.Title = TextAndParameterUtil.getLabelByKey(context, 'HRGap');

        return gapFormula;
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

    /**
     * @memberof PageAllResults
     * @function tableAllResults_ApplyConditionalFormatting
     * @description function to apply conditional formatting
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableAllResults_ApplyConditionalFormatting(context) {
        var log = context.log;
        var table = context.table;

        var gapSettings = getGapSetting(context);
        var conditions = [];
        var name = '';
        var applyTo = {
            axis: Area.Columns,
            direction: Area.Left,
            indexes: []
        };

        if(gapSettings.GapFormatting) {
            conditions = Config.ConditionalFormatting['AllResults_Gap'];
            name = "GapAreas";
            applyTo.indexes = getGapFormattingIndexes();
            TableUtil.setupConditionalFormatting(context, conditions, name, applyTo);
        }

        if(gapSettings.ScoreFormatting) {
            conditions = Config.ConditionalFormatting['AllResults_Score'];
            name = "ScoreAreas";
            applyTo.indexes = getScoreFormattingIndexes();
            TableUtil.setupConditionalFormatting(context, conditions, name, applyTo);
        }
    }
    /**
     * @memberof PageAllResults
     * @function getGapSetting
     * @description function to get selected gap settings based on the parameter
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @return {Object} gap settings
     */
    static function getGapSetting(context) {
        var selectedSettings = ParamUtil.GetSelectedCodes(context, 'p_AllResults_GapSettings');
        var gapSettings = {
            ShowGap: ArrayUtil.itemExistInArray(selectedSettings, 'ShowGap'),
            GapFormatting: ArrayUtil.itemExistInArray(selectedSettings, 'GapFormatting') && ArrayUtil.itemExistInArray(selectedSettings, 'ShowGap'),
            ScoreFormatting: ArrayUtil.itemExistInArray(selectedSettings, 'ScoreFormatting')
        };

        return gapSettings;
    }

    /**
     * @memberof PageAllResults
     * @function getGapSetting
     * @description function to get indexes of gap columns
     * @return {Array} gap indexes
     */
    static function getGapFormattingIndexes() {
        var indexes = [];

        for(var i = 0; i < 999; i++) {
            indexes.push(i * 3 + 1);
        }

        return indexes;
    }

    /**
     * @memberof PageAllResults
     * @function getGapSetting
     * @description function to get indexes of score columns
     * @return {Array} score indexes
     */
    static function getScoreFormattingIndexes() {
        var indexes = [];

        for(var i = 1; i < 999; i++) {
            indexes.push(i * 3 + 3);
        }

        return indexes;
    }
}