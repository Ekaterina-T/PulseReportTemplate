class PageKPI {

    /**
     * @memberof PageKPI
     * @function Hide
     * @description function to hide the page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function Hide(context){
        return false;
    }

    /**
     * @memberof PageKPI
     * @function Render
     * @description function to render the page
     * @param {Object} context - {component: page, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */

    static function Render(context){

    }

    /**
     * @memberof PageKPI
     * @function tableKPI_Hide
     * @description function to hide the KPI table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableKPI_Hide(context){
        return false;
    }

    /**
     * @memberof PageKPI
     * @function tableKPI_Render
     * @description function to render the KPI table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableKPI_Render(context){

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;
        var suppressSettings = context.suppressSettings;

        // add row = KPI question
        var Q = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', 'KPI');
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, Q);
        var row : HeaderQuestion = new HeaderQuestion(qe);
        row.IsCollapsed = true;
        row.HideHeader = true;
        TableUtil.maskOutNA(context, row);
        table.RowHeaders.Add(row);

        // add column statics
        var s : HeaderStatistics = new HeaderStatistics();
        s.Statistics.Avg = true;
        table.ColumnHeaders.Add(s);

        // global table settings

        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Columns = true;
        SuppressUtil.setTableSuppress(table, suppressSettings);
    }


    /**
     * @memberof PageKPI
     * @function tableTrend_Hide
     * @description function to hide the Trend table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableTrend_Hide(context){

        return SuppressUtil.isGloballyHidden(context);

    }


    /**
     * @memberof PageKPI
     * @function chartTrend_Hide
     * @description function to hide the trend chart
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function chartTrend_Hide(context){

        return SuppressUtil.isGloballyHidden(context);

    }


    /**
     * @memberof PageKPI
     * @function tableTrend_Render
     * @description function to render the Trend table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableTrend_Render(context){

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;
        var suppressSettings = context.suppressSettings;

        // add row = KPI question
        var Q = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', 'KPI');

        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, Q);
        var row: HeaderQuestion = new HeaderQuestion(qe);
        row.IsCollapsed = true;
        row.DefaultStatistic = StatisticsType.Average;
        row.HideHeader = true;
        TableUtil.maskOutNA(context, row);
        table.RowHeaders.Add(row);

        // add column (Date variable)

        var timeUnits = ParamUtil.GetSelectedOptions (context, 'p_TimeUnitWithDefault');
        if (timeUnits.length) {
            var dateQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'DateQuestion');
            qe = QuestionUtil.getQuestionnaireElement(context, dateQId);
            var timeQuestionCol: HeaderQuestion = new HeaderQuestion(qe);

            // though it can be multi-parameter, use only 1 option for trend
            var timeUnit = timeUnits[0];
            TableUtil.setTimeSeriesByTimeUnit(context, timeQuestionCol, timeUnit);

            // Set rolling if time unit count is specified in Config
            if (timeUnit.TimeUnitCount != null) {
                TableUtil.setRollingByTimeUnit(context, timeQuestionCol, timeUnit);
            }

            timeQuestionCol.ShowTotals = false;
            timeQuestionCol.TimeSeries.FlatLayout = true;
            table.ColumnHeaders.Add(timeQuestionCol);


            // global table settings
            table.Caching.Enabled = false;
            table.RemoveEmptyHeaders.Columns = true;
            SuppressUtil.setTableSuppress(table, suppressSettings);
        }
    }

    /**
     * @memberof PageKPI
     * @function verbatim_Hide
     * @description function to hide the verbatim table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function verbatim_Hide(context){

        if (SuppressUtil.isGloballyHidden(context)) {
            return true;
        }

        var log = context.log;
        var report = context.report;

        // check base value for the verbatim question. If it is less than VerbatimSuppressValue, Verbatim table is hidden

        var counts : Datapoint[] = report.TableUtils.GetColumnValues("VerbatimBase", 1);
        for (var i=0; i<counts.Length; i++) {
            var base = parseInt(counts[i].Value);
            if (base < Config.SuppressSettings.VerbatimSuppressValue) {
                return true;
            }
        }

        return false;
    }

    static function verbatim_Render(context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;
        var verbatimTable = context.component;

        var Q = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', 'KPIComment');
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, Q);
        verbatimTable.QuestionnaireElement = qe;

        // Verbatim Hide Script (method 'verbatim_Hide') is used instead. Uncomment the lines below if you need bases for positive and negative comments calculated separately

        //verbatimTable.HideData.SuppressData = true;
        //verbatimTable.HideData.BaseLessThan = Config.SuppressSettings.VerbatimSuppressValue;
    }

    /**
     * @memberof PageKPI
     * @function getKPIResult
     * @description function to get KPI score and title
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Object} - object with properties title and score
     */
    static function getKPIResult(context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;

        var Q = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', 'KPI');
        var result = {title: QuestionUtil.getQuestionTitle (context, Q), score: 'N/A', color: Config.primaryGreyColor};

        if (!SuppressUtil.isGloballyHidden(context) && report.TableUtils.GetRowValues("KPI:KPI",1).length) {
            var cell : Datapoint = report.TableUtils.GetCellValue("KPI:KPI",1,1);
            if (!cell.IsEmpty && !cell.Value.Equals(Double.NaN)) {
                result.score = parseFloat(cell.Value.toFixed(Config.Decimal));
                var thresholds = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', 'KPIthreshold');
                for (var i=0; i<thresholds.length; i++) {
                    if (result.score >= thresholds[i].score) {
                        result.color =  thresholds[i].color;
                        break;
                    }
                }
            }
        }

        return result;

    }


    /**
     * @memberof PageKPI
     * @function tableVerbatimBase_Render
     * @description function to render the Verbatim Base table. It is used for suppressing Verbatim Tables to check base
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableVerbatimBase_Render(context){

        var log = context.log;
        var report = context.report;
        var state = context.state;
        var table = context.table;

        // add row = open text question
        var Q = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', 'KPIComment');
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, Q);
        var row : HeaderQuestion = new HeaderQuestion(qe);
        row.IsCollapsed = true;
        row.ShowTotals = false;
        table.RowHeaders.Add(row);

        table.Distribution.Enabled = true;
        table.Distribution.Count = true;
        table.Distribution.VerticalPercents = false;
    }

}

/* Привет!

Вспомнила такое: Эннова на резалтс странице хотели отключать RemoveEmptyHeaders, чтобы видеть все доступные вопросы, даже если там нет данных.
В связи с этим была проблема при BreakBy по тайм юнитам. Хэдер показывал месяца и пр., который выходили за выбранный период, т.к. к хэдеру ограничение не применялось.
Поэтому я добавляла скриптик, кот. явно прописывал старт и энд даты у дэйт хэдера.
И тут тоже добавила в класс DateUtil. Его по идее и для фильтров можно юзать.
На резалтсах я его прикрутила, а в других таблицах не стала. Как думаешь, впилить сразу или подождать?

Чего-то ощущение, что мы студию пишем...
Надо определиться, где проходит граница темплэйта и кастомизации.
В принципе, после вызова теплэйтной функции, всегда можно сверху ещё дописать настроек))) Табличных по крайней мере.
*/