class PageCulturalBehaviors {

    /**
     * @memberof PageCulturalBehaviors
     * @function tableAllResults_Hide
     * @description function to hide the CulturalBehaviors table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableCulturalBehaviors_Hide(context) {

        return SuppressUtil.isGloballyHidden(context) || ParamUtil.isParameterEmpty(context, 'p_CulturalBehaviors_BreakBy');
    }

    /**
     * @memberof PageCulturalBehaviors
     * @function tableCulturalBehaviors_Render
     * @description function to render the CulturalBehaviors table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableCulturalBehaviors_Render(context) {
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

        tableCulturalBehaviors_AddRows(context);
        tableCulturalBehaviors_AddColumns(context);
    }

    /**
     * @memberof PageCulturalBehaviors
     * @function tableCulturalBehaviors_AddRows
     * @description function to add rows to the CulturalBehaviors table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableCulturalBehaviors_AddRows(context) {
        var table = context.table;
        var log = context.log;

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var dimensions = TableUtil.getActiveQuestionsListFromPageConfig(context, pageId, 'Dimensions', true);

        for (var i = 0; i < dimensions.length; i++) {
            var row = getRowHeader(context, dimensions[i]);
            table.RowHeaders.Add(row);
        }
    }

    /**
     * @memberof PageCulturalBehaviors
     * @function tableCulturalBehaviors_AddColumns
     * @description function to add columns to the CulturalBehaviors table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableCulturalBehaviors_AddColumns(context) {
        var table = context.table;
        var log = context.log;

        var responses = TableUtil.getBaseColumn(context);
        table.ColumnHeaders.Add(responses);

        addDistributionBarChart(context);
    }

    /*
     * @memberof PageCulturalBehaviors
     * @function getRowHeader
     * @description Create HeaderQuestion column with the Question
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {Object} question
     * @param {Object} subHeaders
     * @return {HeaderQuestion} created column
     */
    static function getRowHeader(context, question) {
        var header = TableUtil.getHeaderDescriptorObject(context, question);
        var questionRow;

        if (header.Type === 'Question') {
            var qe = QuestionUtil.getQuestionnaireElement(context, header.Code);
            questionRow = new HeaderQuestion(qe);
            questionRow.IsCollapsed = true;
            questionRow.DefaultStatistic = StatisticsType.Average;
        } else {
            if (header.Type === 'Dimension') {
                questionRow = new HeaderCategorization();
                questionRow.CategorizationId = String(header.Code).replace(/[ ,&]/g, '');
                questionRow.DataSourceNodeId = DataSourceUtil.getDsId(context);
                questionRow.DefaultStatistic = StatisticsType.Average;
                questionRow.CalculationRule = CategorizationType.AverageOfAggregates; // AvgOfIndividual affects performance
                questionRow.Preaggregation = PreaggregationType.Average;
                questionRow.SampleRule = SampleEvaluationRule.Max;// https://jiraosl.firmglobal.com/bcolse/TQA-4116
                questionRow.Collapsed = false;
                questionRow.Totals = true;
            }
        }

        TableUtil.addBreakByNestedHeader(context, questionRow);

        return questionRow;
    }

    /*
     * @memberof PageCulturalBehaviors
     * @function addDistributionBarChart
     * @description add distribution bar chart
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function addDistributionBarChart(context) {

        var log = context.log;
        var table = context.table;
        var state = context.state;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        //add distribution barChart
        var bcCategories: HeaderCategories = new HeaderCategories();
        //bcCategories.RecodingIdent = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'ReusableRecodingId');
        bcCategories.Totals = false;
        bcCategories.Distributions.Enabled = true;
        bcCategories.Distributions.HorizontalPercents = true;
        bcCategories.Decimals = Config.Decimal;
        bcCategories.HideData = true;

        table.ColumnHeaders.Add(bcCategories);

        var barChartColors = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'DistributionColors');
        var n = barChartColors.length;

        if (state.ReportExecutionMode !== ReportExecutionMode.ExcelExport) {

            var barChart: HeaderChartCombo = new HeaderChartCombo();
            var chartValues = [];
            var i;

            bcCategories.HideData = true;

            for (i = 0; i < n; i++) {
                var chartValue: ChartComboValue = new ChartComboValue();
                chartValue.Expression = 'cellv(col-' + (i + 1) + ', row)'; //'cellv(col-'+(n-i)+', row)';//
                chartValue.BaseColor = new ChartComboColorSet([barChartColors[i].color]);
                chartValue.Name = TextAndParameterUtil.getTextTranslationByKey(context, barChartColors[i].label);
                chartValue.CssClass = 'barchart__bar barchart__bar_type_distribution ' + barChartColors[i].type;
                chartValues.push(chartValue);
            }

            barChart.Values = chartValues;
            barChart.TypeOfChart = ChartComboType.Bar100;
            barChart.Title = TextAndParameterUtil.getLabelByKey(context, 'Distribution');
            table.ColumnHeaders.Add(barChart);
        } else {
            //workaround for Excel export that shows recording (not chart) and takes translations from recording
            //so show formula instead of original recording

            for (i = 0; i < barChartColors.length; i++) {
                var formula: HeaderFormula = new HeaderFormula();
                formula.Type = FormulaType.Expression;
                formula.Expression = 'cellv(col-' + (i * 2 + 1) + ', row)/100';
                formula.Percent = true;
                formula.Title = TextAndParameterUtil.getLabelByKey(context, barChartColors[i].label);
                table.ColumnHeaders.Add(formula);
            }
        }
    }

    /*
     * @memberof PageCulturalBehaviors
     * @function drawDistributionChartLegend
     * @description show distribution bar chart legend
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function drawDistributionChartLegend(context) {

        var text = context.text;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var barChartColors = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'DistributionColors');
        var legend = '<div class="bar-chart-legend-container"><div class="bar-chart-legend">';

        for (var i = 0; i < barChartColors.length; i++) {
            legend += '<div class="bar-chart-legend__item legend-item">' +
                '<div class="legend-item__color" style="background-color: ' + barChartColors[i].color + ';"></div>' +
                '<div class="legend-item__label">' + TextAndParameterUtil.getTextTranslationByKey(context, barChartColors[i].label) + '</div>' +
                '</div>';
        }

        legend += '</div></div>';
        text.Output.Append(legend);

        return;
    }
}