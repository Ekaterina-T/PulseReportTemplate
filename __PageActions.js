class PageActions {

    /**
     * @memberof PageActions
     * @function Hide
     * @description function to hide the page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function Hide(context){

        return false;
    }

    /**
     * @memberof PageActions
     * @function Render
     * @description function to render the page
     * @param {Object} context - {component: page, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function Render(context){

    }

    /**
     * @memberof PageActions
     * @function hitlistActions_Hide
     * @description function to hide the hitlist
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function hitlistActions_Hide(context){

        var state = context.state; 
        return state.ReportExecutionMode === ReportExecutionMode.PdfExport;
    }

    /**
     * @memberof PageActions
     * @function hitlistActions_Render
     * @description function to render the hitlist
     * @param {Object} context - {component: hitlist, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function hitlistActions_Render(context){

        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var hitlist = context.hitlist;
        var state = context.state;

        /* retrieve the list of hitlist columns from Config without using 'isCustomSource' (i.e. the main source is used to find Config settings) */
        var staticCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns');
        var tagCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'TagsForHitlist');



        /* add columns to Hiltlist using custom source */
        context.isCustomSource = true;
        for (var i=0; i<staticCols.length; i++) {
            Hitlist.AddColumn(context, staticCols[i], {sortable: true, searchable: true});
        }

        for (var i=0; i<tagCols.length; i++) {
            Hitlist.AddColumn(context, tagCols[i], {sortable: false, searchable: false});
        }

        if(staticCols.length + tagCols.length !== hitlist.Columns.Count) {
            throw new Error('DataSourceUtil.hitlistActions_Render: сheck Config settings for hitlist columns, '+DataSourceUtil.getProgramDsId(context)+'. Duplicated question ids and hierarchy variables are not allowed to use in the hitlist component.');
        }

        if (!state.Parameters.IsNull("p_SwitchHitlistMode")) {

            Hitlist.AddColumn(context, 'editLink', {sortable: false, searchable: false});

            Hitlist.AddColumn(context, 'deleteLink', {sortable: false, searchable: false});
        }

    }


    /**
     * @memberof PageActions
     * @function getTagColumnNumbers
     * @description function to get the number of columns with tags.
     * @param {Object} context - {component: hitlist, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {Array} - array with numbers of columns
     */
    static function getTagColumnNumbers (context) {

        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var tagColumnNumbers = [];

        var numberOfStaticColumns = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns').length;
        var numberOfTagColumns = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'TagsForHitlist').length;

        var numberOfColumnsAtStart = 2 + numberOfStaticColumns; // Hitlist always contains 1 first hidden column with the system field Respondent ID



        for (var i=0; i<numberOfTagColumns; i++) {
            tagColumnNumbers.push(i + numberOfColumnsAtStart);
        }
        return tagColumnNumbers;
    }


    /**
     * @memberof PageActions
     * @function tableKPI_Render
     * @description function to render the Implememted Actions table.
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function getKPIResult(context){

        var report = context.report;
        context.isCustomSource = false;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var cell : Datapoint = report.TableUtils.GetCellValue("ActionsKPI",1,1);
        if (!cell.IsEmpty && !cell.Value.Equals(Double.NaN)) {

            var color = Config.primaryGreyColor;
            var score = parseFloat((100*cell.Value).toFixed(Config.Decimal));
            var thresholds = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'KPIthreshold');

            for (var j=0; j<thresholds.length; j++) {
                if (score >= thresholds[j].score) {
                    color =  thresholds[j].color;
                    break;
                }
            }
            return [{score: score, color: color, qid: 'actions', format: '%', yAxisMin: 0}];
        }

        return null;
    }




    /**
     * @memberof PageActions
     * @function tableKPI_Render
     * @description function to render the Implememted Actions table.
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableKPI_Render(context){

        var table = context.table;
        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        // % of Implemented actions.
        var formula : HeaderFormula = new HeaderFormula();
        formula.Type = FormulaType.Expression;
        formula.Expression = "IF(CELLV(1, ROWS)!=0 , SUM(COLVALUES(2, ROWS-1))/CELLV(1, ROWS), EMPTYV())";
        formula.Title.Texts.Add(new LanguageText(9, "%"));
        formula.Percent = true;
        table.RowHeaders.Add(formula);


        // the number of Implemented actions.
        var metric  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'KPI');
        context.isCustomSource = true;
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, metric.qId);
        var hq: HeaderQuestion = new HeaderQuestion(qe);
        hq.IsCollapsed = false;
        hq.ShowSubTotals = true;
        hq.ShowTotals = true;

        if (metric.codes.length) {
            var qmask : MaskFlat = new MaskFlat(true);
            qmask.Codes.AddRange(metric.codes);
            hq.AnswerMask = qmask;
        }
        hq.Distributions.Enabled = true;
        hq.Distributions.Count = true;
        table.RowHeaders.Add(hq);

    }


    /**
     * @memberof PageActions
     * @function tableQuestionsByDimension_Render
     * @description function to render the QuestionsByDimension table. It's a hidden table used to filter the list of statements by the selected dimension
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */

    static function tableQuestionsByDimension_Render(context){

        var table = context.table;
        var dimension = ParamUtil.GetSelectedCodes(context, 'p_Dimensions')[0];
        var categorization : HeaderCategorization = new HeaderCategorization();
        categorization.CategorizationId = dimension;
        categorization.DataSourceNodeId = DataSourceUtil.getDsId(context);
        categorization.DefaultStatistic = StatisticsType.Average;
        categorization.CalculationRule = CategorizationType.AverageOfAggregates; // AvgOfIndividual affects performance
        categorization.Preaggregation = PreaggregationType.Average;
        categorization.SampleRule = SampleEvaluationRule.Max;
        categorization.Collapsed = false;
        categorization.Totals = false;
        table.RowHeaders.Add(categorization);

    }

    /**
     * @memberof PageActions
     * @function getHierarchyMask
     * @description function to mask hierarchy node to show current selected level and children (of first level).
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     */

    static function getHierarchyMask (context) {

        var state = context.state;
        var user = context.user;
        var reportBase = user.PersonalizedReportBase;
        var schema : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(parseInt(Config.schemaId));
        var dbTableNew : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
        var dataTable = dbTableNew.GetDataTable();
        var hierLevels = dataTable.Rows;

        var currentParent = dbTableNew.GetColumnValues('parent', 'id', reportBase)[0];

        var parentsToMask = [];
        var mask : MaskHierarchy = new MaskHierarchy();
        for (var i = 0; i < hierLevels.Count; i++) {
            var dRow : DataRow = hierLevels[i];
            if (dRow['id']!=reportBase && dRow['parent']!=reportBase) {
                parentsToMask.push(dRow['id']);
                var hn : HierarchyNode = new HierarchyNode();
                hn.Code = dRow['id'];
                hn.Level = new HierarchyLevel(Config.tableName, 'parent');
                mask.Nodes.Add(hn);
            }
        }
        return mask;
    }

    /**
     * @memberof PageActions
     * @function tableActionsByDemographics_Render
     * @description function to render the ActionsByDemographics table.
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     */

    static function tableActionsByDemographics_Render (context) {

        var table = context.table;
        var pageContext = context.pageContext;
        var hierarchyQuestionId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');
        context.isCustomSource = true;
        var selectedBreakVar = ParamUtil.GetSelectedCodes (context, 'p_Actions_BreakBy');

        var qERow: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedBreakVar[0]);
        var hQRow : HeaderQuestion = new HeaderQuestion(qERow);
        hQRow.ShowTotals = false;

        if (selectedBreakVar[0] == hierarchyQuestionId) {
            hQRow.ReferenceGroup.Enabled = false;
            hQRow.HierLayout = 'Flat';
            hQRow.AnswerMask = getHierarchyMask (context);
        }
        table.RowHeaders.Add(hQRow);

        var qEColumn: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, 'actionstatus');
        var hQColumn : HeaderQuestion = new HeaderQuestion(qEColumn);
        hQColumn.ShowTotals = false;
        table.ColumnHeaders.Add(hQColumn);
        table.RemoveEmptyHeaders.Rows = true;

    }

    /**
     * @memberof PageActions
     * @function tableInactiveUsersHidden_Render.
     * @description function to render the InactiveUsersHidden table. It's a hidden table used to get the list of users who didn't create nor was assigned an action for wave selected on filter panel
     * @param {Object} context - {confirmit: confirmit, state: state, report: report, log: log, table: table, user:user, pageContext: pageContext}
     */

    static function tableInactiveUsersHidden_Render(context) {

        var table = context.table;
        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');
        context.isCustomSource = true;

        var qeActionOwner: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, actionOwner);
        var hqActionOwner: HeaderQuestion = new HeaderQuestion(qeActionOwner);
        hqActionOwner.ShowTotals = true;
        table.RowHeaders.Add(hqActionOwner);

        var qeActionCreater: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, 'userId');
        var hqActionCreater: HeaderQuestion = new HeaderQuestion(qeActionCreater);
        hqActionCreater.ShowTotals = true;
        table.ColumnHeaders.Add(hqActionCreater);

        table.RemoveEmptyHeaders.Columns = true;
        table.RemoveEmptyHeaders.Rows = false;
        table.Caching.Enabled = false;

    }

    /**
     * @memberof PageActions
     * @function widgetInactiveUsers_Render.
     * @description function returns an array of Inactive users.
     * @param {Object} context - {confirmit: confirmit, state: state, report: report, log: log, user:user, pageContext: pageContext, text: text}
     */
    static function widgetInactiveUsers_Render(context) {

        context.isCustomSource = true;
        var report = context.report;
        var actionOwners = report.TableUtils.GetRowHeaderCategoryIds('InactiveUsers_Hidden');
        var actionCreaters = report.TableUtils.GetColumnHeaderCategoryIds('InactiveUsers_Hidden');
        var actionOwnersNames = report.TableUtils.GetRowHeaderCategoryTitles('InactiveUsers_Hidden');
        var inactiveUsers = [];

        if (actionCreaters.length > 0) {
            for (var i=0; i<actionOwners.length-1; i++) {
                var row = report.TableUtils.GetRowValues('InactiveUsers_Hidden', i+1);
                var columnIndex = row.length-1;
                if (row[columnIndex].Value === 0) {
                    var isCreator = false; // считаем априори всех лентяями, не создавшими ни одного экшенаа
                    for (var j=0; j<actionCreaters.length-1; j++) {
                        if (actionOwners[i] === actionCreaters[j]) {
                            isCreator = true;  // нашли совпадение, сбрасываем флаг и выходим из цикла,тк точно не лентяй
                            break;
                        }
                        // получается, ветка else уже не нужна, в ней нечего делать
                    }
                    // если после прохода всего цикла флаг сохранил первоначальное значение, добавляем в список
                    if (isCreator === false) {
                        inactiveUsers.push(actionOwnersNames[i]);
                    }
                }
            }
        }
        return inactiveUsers;
    }

    /**
     * @memberof PageActions
     * @function addActionTrendSeriesByParam
     * @description function to add action trend series
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */

    static function setActionTrendSeriesByParam(context, seriesParam, target) {

        var table = context.table;
        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var index = seriesParam.order;

        var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');

        if (trendSeries.length > index) {

            // add row with action status
            context.isCustomSource = true;
            var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, trendSeries[index].qId);
            var hq: HeaderQuestion = new HeaderQuestion(qe);
            hq.IsCollapsed = false;
            hq.ShowTotals = true;
            hq.Distributions.Enabled = true;
            hq.Distributions.Count= true;
            hq.HideHeader = true;

            var qmask : MaskFlat = new MaskFlat(true);
            qmask.IsInclusive = false;
            for (var i = 0; i<trendSeries.length; i++) {
                qmask.Codes.Add(trendSeries[i].code);
            }
            hq.AnswerMask = qmask;

            if (target) target.Add(hq);
            else table.RowHeaders.Add(hq);

            // add column - trending by Date variable
            TableUtil.addTrending(context, trendSeries[index].date);

            var hd : HeaderQuestion = table.ColumnHeaders[0];
            var toDate : DateTime = DateTime.Now;
            hd.TimeSeries.StartDate = new DateTime (2019, 1, 1);
            hd.TimeSeries.EndDate = toDate;
        }

    }


    /**
     * @memberof PageActions
     * @function tableTrend_Render
     * @description function to render the trend table
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableTrend_Render(context){

        var report = context.report;
        var table = context.table;

        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');

        context.isCustomSource = true;
        var customProject : Project = DataSourceUtil.getProject(context);


        // add 1st series
        var firstSeriesName: HeaderSegment = new HeaderSegment();
        firstSeriesName.DataSourceNodeId = DataSourceUtil.getDsId(context);
        var firstSeriesNameQid: Question = customProject.GetQuestion(trendSeries[0].qId);
        firstSeriesName.Label = new Label(report.CurrentLanguage, firstSeriesNameQid.GetAnswer(trendSeries[0].code).Text);

        context.isCustomSource = false;
        setActionTrendSeriesByParam(context, {order: 0});
        var nestedRowHeader = table.RowHeaders[0];


        table.RowHeaders[0] = firstSeriesName;
        firstSeriesName.SubHeaders.Add(nestedRowHeader);
        table.RowNesting = 'Nesting';

        // copy the 2nd series from the hidden table
        if (trendSeries.length > 1) {

            var project : Project = DataSourceUtil.getProject(context);
            for (var index = 1; index < trendSeries.length; index++) {
                var hc : HeaderContent = new HeaderContent();
                var dpArray : Datapoint[] = report.TableUtils.GetRowValues('ActionsTrend_Hidden' + index, 1);
                for (var i=0; i<dpArray.Length; i++) {
                    var notStartValue = dpArray[i].Value;
                    if (!notStartValue.Equals(Double.NaN)) {
                        hc.SetCellValue(i, notStartValue);
                    }
                }

                var question : Question = project.GetQuestion(trendSeries[index].qId);
                var series_name = question.GetAnswer(trendSeries[index].code).Text;

                hc.Title = new Label(report.CurrentLanguage, series_name);
                table.RowHeaders.Add(hc);
            }
        }

        // global table settings
        table.Decimals = 0;
        table.RemoveEmptyHeaders.Columns = true;
        table.Caching.Enabled = false;

    }


    /**
     * @memberof PageActions
     * @function tableTrend_Render
     * @description function to render the trend table
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableTrendHidden_Render(context, seriesParam) {

        var table = context.table;
        var pageContext = context.pageContext;

        setActionTrendSeriesByParam(context, seriesParam);

        // global table settings
        table.RemoveEmptyHeaders.Columns = false;
        table.Caching.Enabled = false;

    }

    /**
     * @memberof PageActions
     * @function tableEndUsertStatisticsHidden_Render
     * @description function to render the EndUsertStatisticsHidden table. End user statistics by action status. Data from hidden tables is combined in EndUsertStatistics table
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext}, order
     */
    static function tableEndUsertStatisticsHidden_Render(context, seriesParam) {

        var table = context.table;
        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');

        setActionTrendSeriesByParam(context, seriesParam);
        var nestedRowHeader = table.RowHeaders[0];

        var qeActionOwner: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, actionOwner);
        var hqActionOwner: HeaderQuestion = new HeaderQuestion(qeActionOwner);
        hqActionOwner.ShowTotals = false;

        table.RowHeaders[0] = hqActionOwner;
        table.RowHeaders[0].SubHeaders.Add(nestedRowHeader);

        // global table settings
        table.RemoveEmptyHeaders.Columns = false;
        table.Caching.Enabled = false;
    }

    /**
     * @memberof PageActions
     * @function tableEndUsertStatistics_Render
     * @description function to render the EndUsertStatistics table
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user}
     */
    static function tableEndUsertStatistics_Render(context){

        var report = context.report;
        var table = context.table;
        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var trendSeries = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');
        var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');
        context.isCustomSource = true;
        var p : Project = DataSourceUtil.getProject(context);


        var qActionOwner : Question = p.GetQuestion(actionOwner);
        var actionOwners = qActionOwner.GetAnswers();
        var DsId = DataSourceUtil.getDsId(context);

        if (trendSeries.length > 1) {
            for (var j=0; j<qActionOwner.AnswerCount; j++) {
                var hcUser: HeaderSegment = new HeaderSegment();
                hcUser.DataSourceNodeId = DsId;
                hcUser.Label = new Label(9, actionOwners[j].Text);

                for (var index = 0; index < trendSeries.length; index++) {
                    var hc : HeaderContent = new HeaderContent();
                    var dpArray : Datapoint[] = report.TableUtils.GetRowValues('EndUserStatistics_Hidden' + index, j+1);
                    for (var i=0; i<dpArray.Length; i++) {
                        var notStartValue = dpArray[i].Value;
                        if (!notStartValue.Equals(Double.NaN)) {
                            hc.SetCellValue(i, notStartValue);
                        }
                    }

                    var question : Question = p.GetQuestion(trendSeries[index].qId);
                    var series_name = question.GetAnswer(trendSeries[index].code).Text;

                    hc.Title = new Label(report.CurrentLanguage, series_name);
                    hcUser.SubHeaders.Add(hc);

                }

                table.RowHeaders.Add(hcUser);

            }

        }

        // add column - trending by Date variable

        TableUtil.addTrending(context, trendSeries[1].date);

        var hd : HeaderQuestion = table.ColumnHeaders[0];
        var toDate : DateTime = DateTime.Now;
        hd.TimeSeries.StartDate = new DateTime (2019, 1, 1);
        hd.TimeSeries.EndDate = toDate;

        table.Decimals = 0;
        table.Caching.Enabled = false;
    }

    /**
     * @memberof PageActions
     * @function tableTrend_Render
     * @description function to render the trend table
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableBreakdown_Render (context) {

        var table = context.table;
        var pageContext = context.pageContext;
        var selectedCodes = ParamUtil.GetSelectedCodes(context, 'p_ActionAllocation');

        context.isCustomSource = true;

        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedCodes[0]);
        var hq : HeaderQuestion = new HeaderQuestion(qe);
        hq.Distributions.Enabled = true;
        hq.Distributions.HorizontalPercents = true;
        hq.ShowTotals = false;
        table.ColumnHeaders.Add(hq);

        // global table settings
        table.RemoveEmptyHeaders.Columns = false;
        table.Caching.Enabled = false;

    }

    static function tableActionCost_Render(context) {

        var table = context.table;
        var pageContext = context.pageContext;
        var hierarchyQuestionId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');
        context.isCustomSource = true;
        var selectedBreakVar = ParamUtil.GetSelectedCodes (context, 'p_ActionCost_BreakBy');
        table.RemoveEmptyHeaders.Rows = true;

        var qERow: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedBreakVar[0]);
        var hQRow : HeaderQuestion = new HeaderQuestion(qERow);
        hQRow.ShowTotals = false;

        if (selectedBreakVar[0] == hierarchyQuestionId) {
            hQRow.ReferenceGroup.Enabled = false;
            hQRow.HierLayout = 'Flat';
            hQRow.AnswerMask = getHierarchyMask (context);
        }
        table.RowHeaders.Add(hQRow);

        var qECost: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, 'cost');
        var hQCost : HeaderQuestion = new HeaderQuestion(qECost);
        hQCost.IsCollapsed = true;
        hQCost.HideHeader = true;
        hQRow.SubHeaders.Add(hQCost);


        var HSAvg: HeaderStatistics = new HeaderStatistics();
        HSAvg.Statistics.Avg = true;
        HSAvg.Texts.Average = TextAndParameterUtil.getLabelByKey(context, 'Average');
        var HSSum: HeaderStatistics = new HeaderStatistics();
        HSSum.Statistics.Sum = true;
        HSSum.Texts.Sum = TextAndParameterUtil.getLabelByKey(context, 'Total');

        table.ColumnHeaders.Add(HSAvg);
        table.ColumnHeaders.Add(HSSum);


    }


    static function getActionLink(context){

        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        return DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'SurveyLink');
    }


    static function isFeatureAvailableForUserRole(context, feature) {

        var user = context.user;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var featuresByRoles = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'FeaturesByRoles');
        var userRoles = user.Roles;
        var isAvailable = false;
        var rolesForCurrentFeature = [];

        if (user.UserType == ReportUserType.Confirmit) isAvailable = true;
        else if(user.UserType == ReportUserType.Enduser) {

            for (var i=0; i<featuresByRoles.length; i++) {
                if (featuresByRoles[i].feature == feature) {
                    rolesForCurrentFeature = featuresByRoles[i].roles;
                }
            }


            for (var i=0; i<rolesForCurrentFeature.length; i++) {
                if (user.HasRole(rolesForCurrentFeature[i])) {
                    isAvailable = true;
                    break;
                }

            }
        }
        return isAvailable;
    }


    static function ActionBtn_Render(context) {

        var report = context.report;
        var state = context.state;
        var user = context.user;
        var text = context.text;
        var log = context.log;

        // End user
        var userid = user.UserId;

        // Hierarchy
        var hier = !HierarchyUtil.Hide(context) ? user.PersonalizedReportBase : null;


        // Project
        var project : Project = DataSourceUtil.getProject(context);
        var pid = project.ConfirmitProjectId;
        var pname = project.ProjectName;

        // Wave

        var qId = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');

        var wave = DataSourceUtil.getPagePropertyValueFromConfig(context, PageUtil.getCurrentPageIdInConfig(context), 'DefaultWave');


        // Dimension
        var dimensionId = ParamUtil.GetSelectedCodes(context, 'p_Dimensions').length ? ParamUtil.GetSelectedCodes(context, 'p_Dimensions')[0] : null;

        // Dimension Text
        var dimension = ParamUtil.GetSelectedOptions(context, 'p_Dimensions').length ? ParamUtil.GetSelectedOptions(context, 'p_Dimensions')[0].Label : null;

        // Statement
        var questionId = ParamUtil.GetSelectedCodes (context, 'p_Statements').length ? ParamUtil.GetSelectedCodes (context, 'p_Statements')[0] : null;

        // Statement text
        var questionText = ParamUtil.GetSelectedOptions(context, 'p_Statements').length ? ParamUtil.GetSelectedOptions(context, 'p_Statements')[0].Label : null;

        // Link
        var actionLink = PageActions.getActionLink(context);

        // Flag if delegation is available
        var isResponsibleVisible = PageActions.isFeatureAvailableForUserRole(context,'Delegation');

        // Report currency
        var currency = DataSourceUtil.getPagePropertyValueFromConfig (context, PageUtil.getCurrentPageIdInConfig(context), 'Currency');

        var link = '<a href="'+ actionLink + '?U=' + userid + '&hier=' + hier + '&pid=' + pid + '&pname=' + pname +  '&isResponsibleVisible=' + isResponsibleVisible +
            '&wave=' + wave +'&dimensionId='+ dimensionId +'&dimension=' + dimension + '&questionId=' + questionId +'&questionText=' + questionText + '&currency=' + currency +
            '" class="icon icon--add" target="_blank" title="'+TextAndParameterUtil.getTextTranslationByKey(context, 'ActionAddBtn')+'"></a>';
        text.Output.Append(link);

    }

}
