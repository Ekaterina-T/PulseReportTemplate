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

        //SuppressUtil.setTableSuppress(table, suppressSettings);

        var selectedCorrelationVariable = ParamUtil.GetSelectedOptions(context, 'p_CorrelationQuestion')[0];

        if(!!selectedCorrelationVariable) {
            var selectedQuestion = selectedCorrelationVariable.Code;
        }

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

    }

    /*
     * Apply conditional formatting to the Correlation table to section the table into areas
     * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext, suppressSettings: suppressSettings}
     */
    static function tableCorrelation_AddConditionalFormatting(context) {

    }

    /*
     * Add sorting to the Correlation table
     * @param {object} context: {state: state, report: report, log: log, table: table, pageContext: pageContext, suppressSettings: suppressSettings}
     */
    static function tableCorrelation_AddSorting(context) {

    }
}