class PageCorrelation {

    /*
     * Assemble Statements table
     * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext, suppressSettings: suppressSettings}
     */
    static function tableCorrelation_Render(context) {

        var log = context.log;
        var table = context.table;

        table.Caching.Enabled = false;
        table.TotalsFirst = true;
        table.RemoveEmptyHeaders.Rows = true;

        TableUtil.addClasses(context, ["reportal-table","reportal-categories", "correlation-table"]);

        //SuppressUtil.setTableSuppress(table, suppressSettings);

        tableCorrelation_AddRows(context);
        tableCorrelation_AddColumns(context);
        tableCorrelation_AddConditionalFormatting(context);
        tableCorrelation_AddSorting(context);
    }

    /*
     * Add rows to the Correlation table based on the selected question/s or dimension/s.
     * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext, suppressSettings: suppressSettings}
     */
    static function tableCorrelation_AddRows(context) {
        var log = context.log;
        var table = context.table;

        table.RowHeaders.Add(getHeaderFormula_Average());

        var headerID = ParamUtil.GetSelectedOptions(context, 'p_ImpactAnalysisDimension');

        for(var i=0; i<headerID.length; i++) {

            var header = TableUtil.getHeaderDescriptorObject(context, headerID[i]);

            if(header.Type === 'Question') {
                var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, header.Code);
                var row: HeaderQuestion = new HeaderQuestion(qe);
                row.IsCollapsed = true;
                row.DefaultStatistic = StatisticsType.Average;
                table.RowHeaders.Add(row);

            } else if(header.Type === 'Dimension') {
                var categorization: HeaderCategorization = new HeaderCategorization();
                categorization.CategorizationId = String(header.Code).replace(/[ ,&]/g, '');
                categorization.DataSourceNodeId = DataSourceUtil.getDsId(context);
                categorization.DefaultStatistic = StatisticsType.Average;
                categorization.CalculationRule = CategorizationType.AverageOfAggregates; // AvgOfIndividual affects performance
                categorization.Preaggregation = PreaggregationType.Average;
                categorization.SampleRule = SampleEvaluationRule.Max; // https://jiraosl.firmglobal.com/browse/TQA-4116
                categorization.Collapsed = true;
                categorization.Totals = false;
                table.RowHeaders.Add(categorization);
            }
        }
    }

    /*
     * Create HeaderFormula which calculates the average among all column values starting from the second one
     * @return {HeaderFormula} Formula for the average
     */
    static function getHeaderFormula_Average() {
        var avg: HeaderFormula = new HeaderFormula();

        avg.Type = FormulaType.Expression;
        avg.Expression = 'AVERAGE(COLVALUES(2, ROWS))';
        avg.Decimals = 0;

        return avg;
    }

    /*
     * Add columns to the Correlation table
     * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext, suppressSettings: suppressSettings}
     */
    static function tableCorrelation_AddColumns(context) {
        var log = context.log;
        var table = context.table;

        var columnsCollection: HeaderCollection = new HeaderCollection();
        columnsCollection.Add(getStatisticsColumn());
        columnsCollection.Add(getCorrelation(context));
        columnsCollection.Add(getBaseColumn());
        columnsCollection.Add(getFormulaColumn());

        table.ColumnHeaders.AddRange(columnsCollection);
    }

    /*
     * Create HeaderStatistics column
     * @return {HeaderStatistics} created column
     */
    static function getStatisticsColumn() {
        var headerStatistics = new HeaderStatistics();
        headerStatistics.Statistics.Avg = true;

        return headerStatistics
    }

    /*
     * Create HeaderCorrelation column based on the selected correlation question
     * @return {HeaderCorrelation} created column
     */
    static function getCorrelation(context) {
        var selectedCorrelationVariable = ParamUtil.GetSelectedOptions(context, 'p_CorrelationQuestion')[0];

        if(!!selectedCorrelationVariable) {
            var selectedQuestion = selectedCorrelationVariable.Code;
            var questionnaireElement: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedQuestion);

            var headerCorrelation : HeaderCorrelation = new HeaderCorrelation(CorrelationType.Correlation, questionnaireElement);
            headerCorrelation.Decimals = 3;

            return headerCorrelation;
        } else {
            throw new Error("PageCorrelation.tableCorrelation_AddColumns.getCorrelation: no correlation question specified in the Config");
        }
    }

    /*
     * Create HeaderBase column
     * @return {HeaderBase} created column
     */
    static function getBaseColumn() {
        var headerBase: HeaderBase = new HeaderBase();

        return headerBase;
    }

    /*
     * Create HeaderFormula column which is calculated based on AdjustedSentiment
     * if categorySentiment < overallSentiment then Adjusted sentiment = (10-categorySentiment+5), else Adjusted sentiment = (categorySentiment+5)
     * final value is AdjustedSentiment * Counts * Correlation
     * @return {HeaderFormula} created column
     */
    static function getFormulaColumn() {
        var headerFormula: HeaderFormula = new HeaderFormula();
        headerFormula.Type = FormulaType.Expression;
        headerFormula.Expression = "(IF(cellv(col-3,row)<cellv(col-3,1), (10 - (cellv(col-3,row) + 5)), (cellv(col-3,row) + 5))) * cellv(col-2,row) * cellv(col-1, row)";
        headerFormula.HideData = false;

        return headerFormula;
    }

    /*
     * Apply conditional formatting to the Correlation table to section the table into areas
     * Conditional formatting is used to define key area for each category
     *      1. issues: categorySentiment <= overallSentiment && correlation > 0
     *      2. monitor: categorySentiment < overallSentiment && correlation <= 0
     *      3. strength: categorySentiment > overallSentiment && correlation >0
     *      4. maintain: ctegorySentiment > overallSentiment && correlation <=0
     * conditional formatting applied to the firs column and then used by js fuction to create chart and 4 different tables
     * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext, suppressSettings: suppressSettings}
     */
    static function tableCorrelation_AddConditionalFormatting(context) {
        var log = context.log;
        var table = context.table;

        var conditions = [
            {
                expression: 'cellv(col + 1, row)>0 AND cellv(col,row) <= cellv(col, 1) ',
                style: 'issues'
            },

            {
                expression: '(cellv(col + 1, row) = EMPTYV() OR cellv(col + 1, row)<=0) AND cellv(col,row) <= cellv(col, 1) ',
                style: 'monitor'
            },
            {
                expression: 'cellv(col + 1, row)>0 AND cellv(col,row) > cellv(col, 1) ',
                style: 'strength'
            },
            {
                expression: '(cellv(col + 1, row) = EMPTYV() OR cellv(col + 1, row)<=0) AND cellv(col,row) > cellv(col, 1) ',
                style: 'maintain'
            }
        ];
        var name = "KeyAreas";
        var applyTo = {
            axis: Area.Columns,
            direction: Area.Left,
            indexes: "1"
        };

        TableUtil.setupConditionalFormatting(context, conditions, name, applyTo);
    }

    /*
     * Add sorting to the Correlation table
     * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext, suppressSettings: suppressSettings}
     */
    static function tableCorrelation_AddSorting(context) {
        TableUtil.setupRowsTableSorting(context, false, 1, 0, true, 1);
    }

    /**
     * Show help text depending on what view is chosen
     * @param {Object} context - {component: text, pageContext: this.pageContext,report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function txtHelp_Render(context){
        var text = '<div id="quadrant-table">'+
            TextAndParameterUtil.getTextTranslationByKey(context, 'CorrelationTable_InfoTooltip') +
            '</div>'+
            '<div id="quadrant-chart">'+
            TextAndParameterUtil.getTextTranslationByKey(context, 'CorrelationChart_InfoTooltip') +
            '</div>';

        context.text.Output.Append(text);
    }
}