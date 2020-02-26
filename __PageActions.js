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

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var hitlist = context.hitlist;
        var state = context.state;

        /* retrieve the list of hitlist columns from Config without using 'isCustomSource' (i.e. the main source is used to find Config settings) */
        var staticCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns');
        var tagCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'TagsForHitlist');



        /* add columns to Hiltlist using custom source */
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
     * @function getHierarchyMask
     * @description function to mask hierarchy node to show current selected level and children (of first level).
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     */

    static function getHierarchyMaskIdsStringList(context){
		var state = context.state;
        var user = context.user;
        var reportBase = user.PersonalizedReportBase;
        var schema : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(parseInt(Config.schemaId));
        var dbTableNew : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
        var dataTable = dbTableNew.GetDataTable();
        var hierLevels = dataTable.Rows;

        var currentParent = dbTableNew.GetColumnValues('parent', 'id', reportBase)[0];
		
		var idsToMask = "";
		
		for (var i = 0; i < hierLevels.Count; i++) {
			if(i!=0) idsToMask+=",";
			
            var dRow : DataRow = hierLevels[i];
            if (dRow['id']!=reportBase && dRow['parent']!=reportBase) {
                idsToMask+=dRow['id'];
            }
        }
		
		return idsToMask;

	}
     
    static function getHierarchyMask (context) {

        var state = context.state;
		
		var idsToMask = [];
		
		if(!state.Parameters.IsNull("p_HierMaskIds"))
			idsToMask = state.Parameters.GetString("p_HierMaskIds").split(',');
		else idsToMask = getHierarchyMaskIdsStringList(context).split(',');
        
        var mask : MaskHierarchy = new MaskHierarchy();
        for (var i = 0; i < idsToMask.length; i++) {
            
                var hn : HierarchyNode = new HierarchyNode();
                hn.Code = idsToMask[i];
                hn.Level = new HierarchyLevel(Config.tableName, 'parent');
                mask.Nodes.Add(hn);  
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
        var hierarchyQuestionId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');
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

   /* static function tableInactiveUsersHidden_Render(context) {

        var table = context.table;
        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');

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

    }*/

    /**
     * @memberof PageActions
     * @function widgetInactiveUsers_Render.
     * @description function returns an array of Inactive users.
     * @param {Object} context - {confirmit: confirmit, state: state, report: report, log: log, user:user, pageContext: pageContext, text: text}
     */
    /*static function widgetInactiveUsers_Render(context) {

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
  */
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
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');

        var customProject : Project = DataSourceUtil.getProject(context);


        // add 1st series
        var firstSeriesName: HeaderSegment = new HeaderSegment();
        firstSeriesName.DataSourceNodeId = DataSourceUtil.getDsId(context);
        var firstSeriesNameQid: Question = customProject.GetQuestion(trendSeries[0].qId);
        firstSeriesName.Label = new Label(report.CurrentLanguage, firstSeriesNameQid.GetAnswer(trendSeries[0].code).Text);

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
				var dpArray = getActionTrendHiddenTableRowDataArray(context, index, 0);
				for (var i=0; i<dpArray.length; i++) {
                    var notStartValue = dpArray[i];
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
        var state = context.state;
        var report = context.report;
        var table = context.table;
	    var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var trendSeries = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'Trend');
        var p : Project = DataSourceUtil.getProject(context);
		
		var chosenUsers: ParameterValueMultiSelect;
		var chosenUsersN = 0;
		
		if(!state.Parameters.IsNull("p_EndUserSelection")){
			chosenUsers = state.Parameters["p_EndUserSelection"];
			chosenUsersN = chosenUsers.Count;
		}
        var DsId = DataSourceUtil.getDsId(context);
        
	    var jsonTables = [];
		if(chosenUsersN > 0){
			for(var index = 0; index<trendSeries.length; index++){
					jsonTables.push(getEndUserStatHiddenTableJSON(context, index));
			}
		}	
		
        if (trendSeries.length > 1) {
            for (var j=0; j<chosenUsersN; j++) {
                var hcUser: HeaderSegment = new HeaderSegment();
                hcUser.DataSourceNodeId = DsId;
                hcUser.Label = new Label(9, (ParameterValueResponse)(chosenUsers[j]).DisplayValue);

                for (var index = 0; index < trendSeries.length; index++) {
                    var hc : HeaderContent = new HeaderContent();
                    var dpArray = getJSONTableRowDataArray(jsonTables[index], j);
					//var dpArray : Datapoint[] = report.TableUtils.GetRowValues('EndUserStatistics_Hidden' + index, j+1);
                    for (var i=0; i<dpArray.length; i++) {
                        var notStartValue = dpArray[i];
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

        var log = context.log;
        var table = context.table;
        var selectedCodes = ParamUtil.GetSelectedCodes(context, 'p_ActionAllocation');
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedCodes[0]);
        var hq: HeaderQuestion = new HeaderQuestion(qe);

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
        var hierarchyQuestionId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');
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

        if (user.UserType == ReportUserType.Confirmit) {
            isAvailable = true;
        } else if(user.UserType == ReportUserType.Enduser) {

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

        var user = context.user;
        var text = context.text;
        var log = context.log;


        var userid = user.UserId;
        var hier = !HierarchyUtil.Hide(context) ? user.PersonalizedReportBase : null;
        var project : Project = DataSourceUtil.getProject(context);

        var pid = project.ConfirmitProjectId;
        var pname = project.ProjectName;

        var wave = DataSourceUtil.getPagePropertyValueFromConfig(context, PageUtil.getCurrentPageIdInConfig(context), 'DefaultWave');
        var dimensionId = ParamUtil.GetSelectedCodes(context, 'p_Dimensions').length ? ParamUtil.GetSelectedCodes(context, 'p_Dimensions')[0] : null;
        var dimensionText = ParamUtil.GetSelectedOptions(context, 'p_Dimensions').length ? ParamUtil.GetSelectedOptions(context, 'p_Dimensions')[0].Label : null;
        var statement = ParamUtil.GetSelectedCodes (context, 'p_Statements').length ? ParamUtil.GetSelectedCodes (context, 'p_Statements')[0] : null;
        var statementText = ParamUtil.GetSelectedOptions(context, 'p_Statements').length ? ParamUtil.GetSelectedOptions(context, 'p_Statements')[0].Label : null;
        var actionLink = PageActions.getActionLink(context);

        // Flag if delegation is available
        var isResponsibleVisible = PageActions.isFeatureAvailableForUserRole(context,'Delegation');
        var currency = DataSourceUtil.getPagePropertyValueFromConfig (context, PageUtil.getCurrentPageIdInConfig(context), 'Currency');

        var link = '<a href="'+ actionLink + '?U=' + userid + '&hier=' + hier + '&pid=' + pid + '&pname=' + pname +  '&isResponsibleVisible=' + isResponsibleVisible +
            '&wave=' + wave +'&dimensionId='+ dimensionId +'&dimension=' + dimensionText + '&questionId=' + statement +'&questionText=' + statementText + '&currency=' + currency +
            '" class="icon icon--add" target="_blank" title="'+TextAndParameterUtil.getTextTranslationByKey(context, 'ActionAddBtn')+'"></a>';
        text.Output.Append(link);
    }
    
    
    /**
     * SMART VIEW HIDDEN TABLES
     */
	static function getActionTrendHiddenTableRowDataArray(context, tableIndex, rowIndex) {

        var log = context.log;
        var report = context.report;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        
        var result = [];	
        var smTrend1Expression = generateActionTrandHiddenTableSmartView(context,{order: tableIndex});
        
        var sourceId  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Source');
        var smTrendTable = report.TableUtils.GenerateTableFromExpression(sourceId, smTrend1Expression, TableFormat.Json);
        var smTrendTableJSON = JSON.parse(smTrendTable);
        
        var l = smTrendTableJSON.data[rowIndex].length;
        
        for(var i=0; i<l; i++) {
            result.push(smTrendTableJSON.data[rowIndex][i].values.count);
        }

        return result;
  }

  /**
   * 
   */  
    static function getActionTrendHiddenTableJSON(context, tableIndex) {

        var log = context.log;
        var report = context.report;

        var smExpression = generateActionTrandHiddenTableSmartView(context,{order: tableIndex});
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var sourceId  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Source');
        var smTable = report.TableUtils.GenerateTableFromExpression(sourceId, smExpression, TableFormat.Json);
        var smTableJSON = JSON.parse(smTable);

        return smTableJSON; 
    }


    /**
     * 
     */
    static function getEndUserStatHiddenTableJSON(context, tableIndex) {
        var log = context.log;
        var report = context.report;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var smExpression = generatetableEndUsertStatisticsHiddenTableSmartView(context,{order: tableIndex});

        var sourceId  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Source');
        var smTable = report.TableUtils.GenerateTableFromExpression(sourceId, smExpression, TableFormat.Json);
        var smTableJSON = JSON.parse(smTable);

        return smTableJSON;
    }
  
    /**
     * ?? context ??
     */
    static function getJSONTableRowDataArray(jsonTable, rowIndex){
        var result = [];	
        var l = jsonTable.data[rowIndex].length;	
        for(var i=0; i<l; i++){
            result.push(jsonTable.data[rowIndex][i].values.count);
        }
        return result;
    }
  
  
    /**
     * 
     */
    static function generateActionTrandHiddenTableSmartView(context, seriesParam){
        return generateActionTrendSeriesByParam_SVText(context, seriesParam);
    }
  
    /**
     * 
     */
    static function generatetableEndUsertStatisticsHiddenTableSmartView(context, seriesParam){
        var resultSmartViewQuery = "";
        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');
        resultSmartViewQuery += actionOwner+ "{total: false; filterbymask: true; ";
            
        var chosenUsers = ParamUtil.GetSelectedCodes(context, "p_EndUserSelection");
        var chosenUsersN = chosenUsers.length;

        for(var i=0; i<chosenUsersN; i++) {

            // move out of loop?
            if(i==0) {
                resultSmartViewQuery+="mask: '";
             } else {
                resultSmartViewQuery+="','";
             } 

            resultSmartViewQuery+=chosenUsers[i];    
            if (i==chosenUsersN-1) {
                resultSmartViewQuery +="';";
            }
        }
        resultSmartViewQuery += "}\/";
        resultSmartViewQuery += generateActionTrendSeriesByParam_SVText(context, seriesParam);
        return resultSmartViewQuery;
    }
  
  /**
   * 
   */
  //ActionsPage_SmartView.generateActionTrandTableSmartView(,)
    static function generateActionTrendSeriesByParam_SVText(context, seriesParam) {

        var log = context.log;
        var resultSmartViewQuery = "";
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var index = seriesParam.order; //1

        var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');
        var sourceId  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Source');
            
        if (trendSeries.length <= index) {
            return resultSmartViewQuery;
        }
            
        // add row with action status        
        resultSmartViewQuery+= trendSeries[index].qId;
        resultSmartViewQuery+="{dsnid: "+sourceId+"; collapsed: false; total: true; distribution: count; hideheader: true; filterbymask: true;  xmask: ";

        for (var i = 0; i<trendSeries.length; i++) {
            if(i!=0) resultSmartViewQuery+=",";
            resultSmartViewQuery+=trendSeries[i].code;
        }
        resultSmartViewQuery+=";}";
            
            
        //add columns with trending
        var timeUnits = ParamUtil.GetSelectedOptions(context, 'p_TimeUnitWithDefault');
        
        if (timeUnits.length) {
            // though it can be multi-parameter, use only 1 option for trend
            var timeUnit = timeUnits[0];              
            
            resultSmartViewQuery+=" ^ ";
            // check if time unit for breakdown is specified in TextAndParameterLibrary->ParameterValuesLibrary
            if (timeUnit.TimeUnit) {                    
                resultSmartViewQuery+=trendSeries[index].date + "{";
                resultSmartViewQuery+=getTimeSeriesByTimeUnitSmartViewProps(context, timeUnit);
                resultSmartViewQuery+="flatlayout: true; ";                    
            } else {    
                //  no time units, so add trending by a single (not a date question!) specified in TextAndParameterLibrary->ParameterValuesLibrary
                resultSmartViewQuery+= timeUnit.Code + "{";
            }
            // we've got date util for dates, can it help?
            var toDate : DateTime = DateTime.Now;
            resultSmartViewQuery+="dsnid: "+sourceId+"; total: false; hideheader: false; hidedata: false; start: \"1/1/2019\"; end: \""+ toDate.Month +"\/"+toDate.Day+"\/"+toDate.Year+"\"}";
        }
        
        return resultSmartViewQuery
    }		
  
    /**
     * 
     */
    static function getTimeSeriesByTimeUnitSmartViewProps(context, timeUnit){
        var timeUnitCode = timeUnit.Code;
        var resultSmartViewQuery = "";
        switch (timeUnitCode) {
            case 'Y':
            resultSmartViewQuery+="time1: year; ";
            break;

            case 'Q':
            resultSmartViewQuery+="time1: year; ";
            resultSmartViewQuery+="time2: quarter; ";
            break;

            case 'M':
            resultSmartViewQuery+="time1: year; ";
            resultSmartViewQuery+="time2: month; ";
            break;
            case 'D':
            resultSmartViewQuery+="time1: year; ";
            resultSmartViewQuery+="time2: month; ";
            resultSmartViewQuery+="time3: day; ";
            break;

            default:
            resultSmartViewQuery+="time1: year; ";
        }
        return resultSmartViewQuery;
    }


   static function inactiveUsersHiddenTable_Render(context){
	var table = context.table;
	var log = context.log;
	
	var pageId = PageUtil.getCurrentPageIdInConfig(context);
    
	var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');
    context.isCustomSource = true;

    var qeActionOwner: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, actionOwner);
    var hqActionOwner: HeaderQuestion = new HeaderQuestion(qeActionOwner);
    hqActionOwner.ShowTotals = false;
    table.RowHeaders.Add(hqActionOwner);
	
	var actionCreator = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'ActionCreatorsList');
    var qeActionCreator: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, actionCreator);
    var hqActionCreator: HeaderQuestion = new HeaderQuestion(qeActionCreator);
    hqActionCreator.ShowTotals = false;
    table.RowHeaders.Add(hqActionCreator);
	
	var hb : HeaderBase = new HeaderBase();
    hb.HideData = true;
	hb.HideHeader = true;

	var hf : HeaderFormula = new HeaderFormula();
	hf.HideHeader = true;
	hf.Type = FormulaType.Expression;
	hf.Expression = "if(row < rows/2, if(cellv(col-1,row)+cellv(col-1,row+rows/2) > 0, emptyv(), 1), emptyv() )";

	table.ColumnHeaders.Add(hb);	
	table.ColumnHeaders.Add(hf);
	
	//table settings
	table.RemoveEmptyHeaders.Rows = true;
	table.Caching.Enabled = false;
    table.Sorting.Rows.Enabled = true;
    table.Sorting.Rows.SortByType = TableSortByType.Position;
    table.Sorting.Rows.Position = 2;
}


static function inactiveUsersList_Render(context, tableName){
	var log = context.log;
	var report = context.report;
	
	var inactiveUsers = [];
	
	var data = report.TableUtils.GetColumnValues(tableName, 1);
	var labels = report.TableUtils.GetRowHeaderCategoryTitles(tableName);

	for(var i=0; i<data.length; i++){
		if(data[i].Value == 0) continue;
		if(data[i].Value > 0) inactiveUsers.push(labels[i]);		
	}	
	
	return inactiveUsers;
 }
	
 static function maskStatementsScript_Render(context){
	var log = context.log;
	var text = context.text;
	
	var pageId = PageUtil.getCurrentPageIdInConfig(context);
    var jsonStatementsByDimensions = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'StatementsByDimension');

    var jsCode = "<script>";
        jsCode +="function maskStatements(){";
        jsCode +="var jsonStatementsByDimensions = " + jsonStatementsByDimensions + ";";
        jsCode +=" var dimensionSelect = document.querySelector('#dimensionDropdown select');";
        jsCode +=" var selectedDimension = document.querySelectorAll('#dimensionDropdown select option')[dimensionSelect.selectedIndex].value.split(':')[2];";
        jsCode +="  var statementsSelect = document.querySelector('#statementDropdown select');";
        jsCode +=" var statements = document.querySelectorAll('#statementDropdown select option');";
        jsCode +=" for (var i=statements.length-1; i>0; i--){";
        jsCode +=" var stId = statements[i].value.split(':')[2];";
        jsCode +=" if(jsonStatementsByDimensions[selectedDimension].indexOf(stId) == -1) {";
        jsCode +="        statements[i].style.display = 'none';";
        jsCode +="        if( statementsSelect.selectedIndex == i) {statementsSelect.selectedIndex = 0;}}";
        jsCode +=" else { statements[i].style.display = 'inherit';}";
        jsCode +="}}";
        jsCode +=" maskStatements();";
        jsCode +=" document.querySelector('#dimensionDropdown select').addEventListener('change', maskStatements);";
        jsCode +="</script>";
		
	text.Output.Append(jsCode);
}	
}
