class PageResults {

    static function tableStatements_Hide(context) {

        return SuppressUtil.isGloballyHidden(context);
    }

    /*
     * Assemble Statements table
     * @param {object} context: {state: state, report: report, log: log, table: table}
     * @param {string} bannerId: explicit bannerId to use, not mandotary
     */

    static function tableStatements_Render(context, bannerId) {

        var state = context.state;
        var table = context.table;
        var log = context.log;
        var suppressSettings = context.suppressSettings;

        tableStatements_AddColumns(context, bannerId);
        tableStatements_AddRows(context);
        tableStatements_ApplyConditionalFormatting(context);
        SuppressUtil.setTableSuppress(table, suppressSettings);

        table.Decimals = 0;
        table.RowNesting = TableRowNestingType.Nesting;
        table.RemoveEmptyHeaders.Rows = true;

    }

    /*
     * Assemble Benchmarks table
     * @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function tableBenchmarks_Render(context) {

        var state = context.state;
        var table = context.table;
        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        if(DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'hasBenchmarks')) {

            tableStatements_AddRows(context);
            tableBenchmarks_AddColumns_Banner0(context);

            table.Decimals = 0;
            table.RowNesting = TableRowNestingType.Nesting;
            table.RemoveEmptyHeaders.Rows = false;
        }
    }


    /*
     * Column Banner selector for Statements table
     * @param {object} context: {state: state, report: report, log: log, table: table}
     * @param {string} bannerId: explicit bannerId to use, not mandotary
     */

    static function tableStatements_AddColumns(context, bannerId) {

        var log = context.log;log.LogDebug('ghgh')
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        if(bannerId === '0') {
            tableStatements_AddColumns_Banner0(context);
            return;
        }

        if (bannerId === '1') {
            tableStatements_AddColumns_Banner1(context);
            return;
        }

        if(DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'ResultStatements')) { // for not pulse
            tableStatements_AddColumns_Banner0(context);
            return;
        }

        if(DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'Dimensions')) { // for pulse
            tableStatements_AddColumns_Banner1(context);
            return;
        }

    }

    /*
     * Add set of rows based on questions or categorizations (for pulse)
     * @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function tableStatements_AddRows(context) {

        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        if(DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'ResultStatements')) {

            tableStatements_AddRows_Banner0(context);
        } else if(DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'Dimensions')) {

            tableStatements_AddRows_Banner1(context);
        }

    }

    /*
     * Populate benchmarks table
     * @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function tableBenchmarks_AddColumns_Banner0(context) {

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        // add Responses Column
        var responses: HeaderBase = new HeaderBase();
        table.ColumnHeaders.Add(responses);

        //add Benchmarks

        var benchmarks: HeaderBenchmark = new HeaderBenchmark();

        benchmarks.BenchmarkProjectId = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'BenchmarkProject');

        if(DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'BenchmarkSet')) {// there's benchmark set

            var selectedBMSet = ParamUtil.GetSelectedCodes(context, 'p_BenchmarkSet'); // can be only one option
            benchmarks.BenchmarkSet = selectedBMSet[0];
        }

        table.ColumnHeaders.Add(benchmarks);
    }



    /*
     * Add set of columns: Score (Avg), distribution barChart, Scale Distribution, Responses, Benchmarks, Benchmark comparison bar chart
     * @param {object} context: {state: state, report: report, log: log, table: table}
     * @param {boolean} hasBenchmark
     */

    static function tableStatements_AddColumns_Banner0(context) {

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;

        // add Score column

        var score: HeaderStatistics = new HeaderStatistics();
        score.Decimals = 0;
        score.Statistics.Avg = true;
        score.Texts.Average = TextAndParameterUtil.getLabelByKey(context, 'Score');
        table.ColumnHeaders.Add(score);

        //add distribution barChart

        var bcCategories: HeaderCategories = new HeaderCategories();
        bcCategories.RecodingIdent = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'ReusableRecodingId');
        bcCategories.Totals = false;
        bcCategories.Distributions.Enabled = true;
        bcCategories.Distributions.HorizontalPercents = true;
        bcCategories.Decimals = 0;
        bcCategories.HideData = true;

        var barChart: HeaderChartCombo = new HeaderChartCombo();
        var chartValues = [];
        var barChartColors = Config.barChartColors_Distribution;
        var i;

        for(i=0; i< barChartColors.length; i++) {
            var chartValue: ChartComboValue = new ChartComboValue();
            chartValue.Expression = 'cellv(col-'+(i+1)+', row)';
            chartValue.BaseColor = new ChartComboColorSet([barChartColors[i].color]);
            chartValue.Name = TextAndParameterUtil.getTextTranslationByKey(context, barChartColors[i].label);
            chartValue.CssClass = 'barchart__bar barchart__bar_type_distribution '+ barChartColors[i].type;
            chartValues.push(chartValue);

        }

        barChart.Values = chartValues;
        barChart.TypeOfChart = ChartComboType.Bar100;
        barChart.Title = TextAndParameterUtil.getLabelByKey(context, 'Distribution');

        table.ColumnHeaders.Add(bcCategories);
        table.ColumnHeaders.Add(barChart);

        // add scale distribution
        if(!state.Parameters.IsNull('p_Results_CountsPercents')) {

            var selectedDistr = state.Parameters.GetString('p_Results_CountsPercents');
            var categoryDistr: HeaderCategories = new HeaderCategories();
            var baseDist: HeaderBase = new HeaderBase();

            categoryDistr.Totals = false;
            baseDist.Distributions.Enabled = true;
            baseDist.Decimals = 0;
            baseDist.HideHeader = true;

            if(selectedDistr==='C') { // Counts

                baseDist.Distributions.Count = true;
                baseDist.Distributions.HorizontalPercents = false;
            } else { // Percent

                baseDist.Distributions.HorizontalPercents = true;
                baseDist.Distributions.Count = false;
            }

            categoryDistr.SubHeaders.Add(baseDist);
            table.ColumnHeaders.Add(categoryDistr);
        }

        // add Responses Column

        var responses: HeaderBase = new HeaderBase();
        table.ColumnHeaders.Add(responses);

        // add Benchmark related columns
        if(isBenchmarkAvailable(context)) {
            tableStatements_AddBenchmarkColumns_Banner0(context);
        }

    }

    /*
   * Add set of columns: %Fav, distribution barChart, Scale Distribution, Responses, Benchmarks, Benchmark comparison bar chart
   * @param {object} context: {state: state, report: report, log: log, table: table}
   * @param {boolean} hasBenchmark
   */
    static function tableStatements_AddColumns_Banner1(context) {

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;

        // add Score column
        var ScoreRecodingCols = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'ReusableRecoding_PositiveCols');
        var fav: HeaderFormula = new HeaderFormula();
        fav.Type = FormulaType.Expression;
        fav.Expression = 'cellv(col+'+ScoreRecodingCols.join(', row)+cellv(col+')+',row)'; //'cellv(col+1, row)';
        fav.Decimals = 0;
        fav.Title = TextAndParameterUtil.getLabelByKey(context, 'Fav');
        table.ColumnHeaders.Add(fav);

        //add distribution barChart
        var bcCategories: HeaderCategories = new HeaderCategories();
        bcCategories.RecodingIdent = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'ReusableRecodingId');
        bcCategories.Totals = false;
        bcCategories.Distributions.Enabled = true;
        bcCategories.Distributions.HorizontalPercents = true;
        bcCategories.Decimals = 0;
        bcCategories.HideData = true;

        var barChart: HeaderChartCombo = new HeaderChartCombo();
        var chartValues = [];
        var barChartColors = Config.barChartColors_Distribution;
        var i;

        for(i=0; i< barChartColors.length; i++) {
            var chartValue: ChartComboValue = new ChartComboValue();
            chartValue.Expression = 'cellv(col-'+(i+1)+', row)';
            chartValue.BaseColor = new ChartComboColorSet([barChartColors[i].color]);
            chartValue.Name = TextAndParameterUtil.getTextTranslationByKey(context, barChartColors[i].label);
            chartValue.CssClass = 'barchart__bar barchart__bar_type_distribution '+ barChartColors[i].type;
            chartValues.push(chartValue);

        }

        barChart.Values = chartValues;
        barChart.TypeOfChart = ChartComboType.Bar100;
        barChart.Title = TextAndParameterUtil.getLabelByKey(context, 'Distribution');

        table.ColumnHeaders.Add(bcCategories);
        table.ColumnHeaders.Add(barChart);

        // add scale distribution
        if(!state.Parameters.IsNull('p_Results_CountsPercents')) {

            var selectedDistr = state.Parameters.GetString('p_Results_CountsPercents');
            var categoryDistr: HeaderCategories = new HeaderCategories();
            var baseDist: HeaderBase = new HeaderBase();

            categoryDistr.Totals = false;
            baseDist.Distributions.Enabled = true;
            baseDist.Decimals = 0;
            baseDist.HideHeader = true;

            if(selectedDistr==='C') { // Counts

                baseDist.Distributions.Count = true;
                baseDist.Distributions.HorizontalPercents = false;
            } else { // Percent

                baseDist.Distributions.HorizontalPercents = true;
                baseDist.Distributions.Count = false;
            }

            categoryDistr.SubHeaders.Add(baseDist);
            table.ColumnHeaders.Add(categoryDistr);
        }

        // add Responses Column

        var responses: HeaderBase = new HeaderBase();
        table.ColumnHeaders.Add(responses);

        // add Benchmark related columns
        if(isBenchmarkAvailable(context)) {
            tableStatements_AddBenchmarkColumns_Banner0(context);
        }
    }

    /*
     * Add set of benchmark related set of columns: Benchmarks, Benchmark comparison bar chart
     * @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function tableStatements_AddBenchmarkColumns_Banner0 (context) {

        var report = context.report;
        var table = context.table;
        var log = context.log;

        // add benchmark data
        var benchmarkContent: HeaderContent = new HeaderContent();
        var baseValues: Datapoint[] = report.TableUtils.GetColumnValues('Benchmarks',1);
        var benchmarkValues: Datapoint[] = report.TableUtils.GetColumnValues('Benchmarks',2);
        var suppressValue = Config.SuppressSettings.TableSuppressValue;

        for(var i=0; i<benchmarkValues.length; i++) {

            var base: Datapoint = baseValues[i];
            var benchmark: Datapoint = benchmarkValues[i];

            if (base.Value > suppressValue && !benchmark.IsEmpty) {
                benchmarkContent.SetCellValue(i, benchmark.Value);
            }
        }

        benchmarkContent.HideData = true;
        table.ColumnHeaders.Add(benchmarkContent);

        // add formula ro calculate score vs. benchmark

        var barChart_ScoreVsNorm: HeaderChartCombo = new HeaderChartCombo();
        var chartValue_ScoreVsNorm = [];
        var barChart_ScoreVsNormColors = Config.barChartColors_NormVsScore;

        barChart_ScoreVsNorm.TypeOfChart = ChartComboType.Bar;
        barChart_ScoreVsNorm.Thickness = '100%';
        barChart_ScoreVsNorm.Size = 200;
        barChart_ScoreVsNorm.HideHeader = true;

        var chartValue_Main: ChartComboValue = new ChartComboValue();
        chartValue_Main.Expression = 'cellv(1,row)-cellv(col-1,row)'; // diff between score and norm value
        chartValue_Main.BaseColor = new ChartComboColorSet([barChart_ScoreVsNormColors[1].color]); // main color is red - negative
        chartValue_Main.Name = TextAndParameterUtil.getTextTranslationByKey(context, 'ScoreVsNormValue');
        chartValue_Main.CssClass = 'barchart__bar barchart__bar_type_score-vs-norm';

        var chartValue_Alternative: ChartComboColorAlternative = new ChartComboColorAlternative();
        chartValue_Alternative.Color = new ChartComboColorSet([barChart_ScoreVsNormColors[0].color]);
        chartValue_Alternative.Threshold = 0; // If greater than 0

        chartValue_Main.AltColors = [chartValue_Alternative];
        chartValue_ScoreVsNorm.push(chartValue_Main);

        barChart_ScoreVsNorm.Values = chartValue_ScoreVsNorm;
        barChart_ScoreVsNorm.Title = new Label(report.CurrentLanguage,TextAndParameterUtil.getTextTranslationByKey(context, 'ScoreVsNormValue'));

        table.ColumnHeaders.Add(barChart_ScoreVsNorm);

        var formula_ScoreVsNorm: HeaderFormula = new HeaderFormula();
        formula_ScoreVsNorm.Type = FormulaType.Expression;
        formula_ScoreVsNorm.Expression = 'cellv(1,row)-cellv(col-2,row)';
        table.ColumnHeaders.Add(formula_ScoreVsNorm);
    }


    /*
     * Checks is Benchmark table was build sucessfully, i.e. if benchmark project is defined
     *  @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function isBenchmarkAvailable(context) {

        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        if(!DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'hasBenchmarks')) {
            return false;
        }

        try {
            var report = context.report;
            var benchmarkValues: Datapoint[] = report.TableUtils.GetColumnValues('Benchmarks',2);

        } catch(e) {
            throw new Error('PageResults.isBenchmarkAvailable: Something\'s wrong with Bencmark table. Check if Benchmark project set up correctly.');
        }

        return true;
    }

    /*
     * Add categorizations as table rows based on Survey Config-> Page_Result-> Dimensions property
     *  @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function tableStatements_AddRows_Banner0(context) {

        var state = context.state;
        var table = context.table;
        var log = context.log;
        var questions = DataSourceUtil.getPagePropertyValueFromConfig(context, PageUtil.getCurrentPageIdInConfig(context), 'ResultStatements');

        for(var i=0; i<questions.length; i++) {
            var questionnaireElement : QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, questions[i]);
            var headerQuestion : HeaderQuestion = new HeaderQuestion(questionnaireElement);
            headerQuestion.IsCollapsed = true;
            addNestedHeader(context, headerQuestion);
            table.RowHeaders.Add(headerQuestion);
        }
    }

    /*
     * Add statement questions as table rows based on Survey Config-> Page_Result-> ResultStatements
     *  @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function tableStatements_AddRows_Banner1(context) {

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var categorizations = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'Dimensions');
        var isDimensionVisible = state.Parameters.GetString('p_Results_TableTabSwitcher')!=='noDims';

        for (var i=0; i<categorizations.length; i++) {

            var categorization : HeaderCategorization = new HeaderCategorization();
            categorization.CategorizationId = categorizations[i];
            categorization.DataSourceNodeId = DataSourceUtil.getDsId(context);
            categorization.DefaultStatistic = StatisticsType.Average;
            categorization.CalculationRule = CategorizationType.AverageOfAggregates;
            categorization.Preaggregation = PreaggregationType.Average;
            categorization.SampleRule = SampleEvaluationRule.Average;
            categorization.Collapsed = false;

            categorization.Totals = isDimensionVisible;

            addNestedHeader(context, categorization);
            table.RowHeaders.Add(categorization);

        }

        table.TotalsFirst = true;

    }


    /*
     * Add nested header based on BreakVariables and BreakByTimeUnits properties for 'Results' page.
     * If BreakByTimeUnits is defined then BreakVariables value is ignored.
     * @param {object} context: {state: state, report: report, log: log, table: table}
     */

    static function addNestedHeader(context, parentHeader) {

        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var breakByTimeUnits = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'BreakByTimeUnits');
        var breakVariables = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'BreakVariables');
        var breakByParameter = null;
        var nestedHeader: HeaderQuestion;
        var questionElem: QuestionnaireElement;

        if(breakByTimeUnits) {
            breakByParameter = 'p_TimeUnitNoDefault';
        } else if(breakVariables && breakVariables.length>0) {
            breakByParameter = 'p_Results_BreakBy';
        }

        if(!breakByParameter) { // break by value is not set in config
            return;
        }

        var selectedOption = ParamUtil.GetSelectedOptions(context, breakByParameter)[0];

        if(selectedOption==null || selectedOption.Code === 'na') {//no break by option is selected
            return;
        }

        selectedOption = selectedOption.Code;

        if(breakByParameter === 'p_TimeUnitNoDefault') { // break by time unit

            var qid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'DateQuestion');

            questionElem = QuestionUtil.getQuestionnaireElement(context, qid);
            nestedHeader = new HeaderQuestion(questionElem);
            nestedHeader.ShowTotals = false;
            nestedHeader.TimeSeries.FlatLayout = true;

            nestedHeader.TimeSeries.Time1 = TimeseriesTimeUnitType.Year;
            if(selectedOption.TimeUnit === 'Quarter') {
                nestedHeader.TimeSeries.Time2 = TimeseriesTimeUnitType.Quarter;
            } else {
                nestedHeader.TimeSeries.Time2 = TimeseriesTimeUnitType.Month;
                if(selectedOption.TimeUnit === 'Day') {
                    nestedHeader.TimeSeries.Time3 = TimeseriesTimeUnitType.DayOfMonth;
                }
            }

            TableUtil.applyDateRangeFilterToHeader(context, nestedHeader);
            parentHeader.SubHeaders.Add(nestedHeader);

            return;
        }

        if(breakByParameter === 'p_Results_BreakBy') { // break by time unit

            questionElem = QuestionUtil.getQuestionnaireElement(context, selectedOption);
            nestedHeader = new HeaderQuestion(questionElem);
            nestedHeader.ShowTotals = false;
            parentHeader.SubHeaders.Add(nestedHeader);

            return;
        }
    }

    /*
   * Conditional Formatting for Statements table
   * @param {object} context: {state: state, report: report, log: log, table: table}
   */

    static function tableStatements_ApplyConditionalFormatting(context) {

        var table = context.table;
        var log = context.log;

        // Score column is bold and has bigger font-size
        var area: Area = new Area();
        var condition: Condition = new Condition();
        condition.Expression = 'true';
        condition.Style = 'score-column cf-score-column';

        area.Name = 'Score';
        area.FromStart = true;
        area.Indexes = '1';
        area.RowFormatting = false;
        area.AddCondition(condition);

        table.ConditionalFormatting.AddArea(area);
    }

    /*
     * show distribution bar chart legend
     * @param {object} context {state: state, report: report, log: log, text: text}
     */

    static function drawDistributionChartLegend(context) {

        var text = context.text;
        var barChartColors = Config.barChartColors_Distribution;
        var legend = '<div class="bar-chart-legend-container"><div class="bar-chart-legend">';

        for (var i=0; i < barChartColors.length; i++) {
            legend += '<div class="bar-chart-legend__item legend-item">'+
                '<div class="legend-item__color" style="background-color: '+barChartColors[i].color+';"></div>'+
                '<div class="legend-item__label">'+TextAndParameterUtil.getTextTranslationByKey(context, barChartColors[i].label)+'</div>'+
                '</div>';
        }

        legend += '</div></div>';
        text.Output.Append(legend);

        return;
    }

}


/* ------------------ COMMENTS

# Where should the call TableUtil.maskOutNA(context, headerQuestion) be added?  Only to the tableStatements_AddRows_Banner0 function?
--------------- */