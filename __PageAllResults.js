class PageAllResults {

    /**
     * @memberof PageAllResults
     * @function tableAllResults_Hide
     * @description function to hide the AllResultsTable table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableAllResults_Hide(context) {

        return SuppressUtil.isGloballyHidden(context) || ParamUtil.isParameterEmpty(context, 'p_AllResults_BreakBy');

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

        var responses = getBaseColumn(context);
        table.ColumnHeaders.Add(responses);

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var questions = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Questions');

        questions = TableUtil.excludeNotActiveDimensionsFromQuestionsList(context, questions);

        for (var i = 0; i < questions.length; i++) {
            var questionColumn = getQuestionColumn(context, questions[i]);
            table.ColumnHeaders.Add(questionColumn);
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

        var pageID = PageUtil.getCurrentPageIdInConfig(context);
        var isTotalsShown = DataSourceUtil.getPagePropertyValueFromConfig(context, pageID, 'ShowTotals');

        if (header.Type === 'Question') {

            var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, header.Code);
            questionColumn = new HeaderQuestion(qe);
            questionColumn.IsCollapsed = true;
            questionColumn.DefaultStatistic = StatisticsType.Average;
            TableUtil.maskOutNA(context, questionColumn, header.Code);

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
                questionColumn.Totals = !!isTotalsShown;

                //calc cell base with excluded NA
                var categoryDistr: HeaderCategories = new HeaderCategories();
                categoryDistr.HideHeader = true;
                categoryDistr.HideData = true;
                TableUtil.maskOutNA(context, categoryDistr);
                categoryDistr.Mask.Type = MaskType.ShowCodes;
                categoryDistr.Mask.Codes = ''; // do not show any codes but Total
                categoryDistr.Distributions.Enabled = true;
                categoryDistr.Distributions.Count = true;
                questionColumn.SubHeaders.Add(categoryDistr);

                TableUtil.addScore(context, questionColumn, 'cellv(col-1,row)!=emptyv()', true);

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

        var pageID = PageUtil.getCurrentPageIdInConfig(context);
        var hasConditionalFormatting = DataSourceUtil.getPagePropertyValueFromConfig(context, pageID, 'ApplyConditionalFormatting');

        if(hasConditionalFormatting) {
            var conditions = [];
            var name = '';
            var applyTo = {
                axis: Area.Columns,
                direction: Area.Left,
                indexes: []
            };

            conditions = Config.ConditionalFormatting['AllResults_Score'];
            name = "ScoreAreas";
            applyTo.indexes = getScoreFormattingIndexes(context);
            TableUtil.setupConditionalFormatting(context, conditions, name, applyTo);
        }
    }

    /**
     * @memberof PageAllResults
     * @function getGapSetting
     * @description function to get indexes of score columns
     * @return {Array} score indexes
     */
    static function getScoreFormattingIndexes(context) {
        var indexes = [];
        var startingPoint = 2;

        for(var i = startingPoint; i < 999; i++) {
            indexes.push(i);
        }

        return indexes;
    }
}
