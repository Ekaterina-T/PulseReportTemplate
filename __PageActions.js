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
     * @function hitlistActions_Hide
     * @description function to hide the hitlist
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function hitlistActions_Hide(context) {
        return Export.isPdfExportMode(context);
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
     * @returns {} ???
     */

    static function getHierarchyMaskIdsStringList(context){

        //ET: re-write using hierarchy util
        var user = context.user;
        var reportBase = user.PersonalizedReportBase;
        //var schema : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(parseInt(Config.schemaId));
        //var dbTableNew : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
        var dataTable = HierarchyUtil.getDataTable(); //already cached //dbTableNew.GetDataTable();
        var hierLevels = dataTable.Rows;
		
		var idsToMask = "";
		
		for (var i = 0; i < hierLevels.Count; i++) {
            //ET: alternative is idsToMask = []; each iteration idsToMask.push; after loop idsToMask.join()
            // removes extra if every iteration?
			if(i!=0) idsToMask+=",";
			
            var dRow : DataRow = hierLevels[i];
            if (dRow['id']!=reportBase && dRow['parent']!=reportBase) {
                idsToMask+=dRow['id'];
            }
        }
		
		return idsToMask;
	}
     
    /**
     * 
     */
    static function getHierarchyMask (context) {

        var state = context.state;		
		var idsToMask = [];
        
        //ET: if and else must have {}, airbnb style guide
        //ET: why p_HierMaskIds is not described in SystemConfig?
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
     * @function addActionTrendSeriesByParam
     * @description function to add action trend series
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @param {}
     * @param {}
     */
    static function setActionTrendSeriesByParam(context, seriesParam, target) {

        var table = context.table;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var index = seriesParam.order;
        var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');

        //ET: what happens if condition === false? should we hide widget if series are not specified?
        // or throw error demanding to populate this property? i tend to this option
        // if we return when it's false, than code will have less {}, less spagetti like
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

            //ET: if else must have {} airbnb clean-code style guide
            // can be shorter: (target) ? target.Add(hq) : table.RowHeader.Add(hq);
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
        //ET: dsId can be taken from project as it's build already
        // we have function  QuestionUtil.getQuestionAnswerByCode (context, questionId, precode, dsId) - can it be used?
        // if yes, it's better for maintenance (fix in one place for all cases)
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

            //ET: haven't project been retrieved on line 361?
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

                //ET: need to replace with QuestionUtil.getQuestionAnswerByCode (context, questionId, precode, dsId)
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
        
        //ET: ParamUtil.GetSelectedOptions?
		var chosenUsers: ParameterValueMultiSelect;
		var chosenUsersN = 0;
        
        //ET: ParamUtil.GetSelectedOptions?
		if(!state.Parameters.IsNull("p_EndUserSelection")){
			chosenUsers = state.Parameters["p_EndUserSelection"];
			chosenUsersN = chosenUsers.Count;
        }
        
        //ET: can it be retrieved from p, line 470?
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

                    //ET: need to replace with QuestionUtil.getQuestionAnswerByCode (context, questionId, precode, dsId)
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
        //ET: why start date is hard coded?
        hd.TimeSeries.StartDate = new DateTime (2019, 1, 1);
        hd.TimeSeries.EndDate = toDate;

        table.Decimals = 0;
        table.Caching.Enabled = false;
    }

    /**
     * 
     */
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


    /**
     * 
     */
    static function isFeatureAvailableForUserRole(context, feature) {

        var user = context.user;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var featuresByRoles = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'FeaturesByRoles');
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

      
    
    /**
     * SMART VIEW HIDDEN TABLES
     */
	static function getActionTrendHiddenTableRowDataArray(context, tableIndex, rowIndex) {

        var log = context.log;
        var report = context.report;
        
        var result = [];	
        var smTrend1Expression = generateActionTrandHiddenTableSmartView(context,{order: tableIndex});
        
        var sourceId  = DataSourceUtil.getDsId(context);//getPagePropertyValueFromConfig (context, pageId, 'Source');
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

        var sourceId  = DataSourceUtil.getDsId(context);//getDSId allows to avoid need of Source property on page level; getPagePropertyValueFromConfig (context, pageId, 'Source');
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

        var smExpression = generatetableEndUsertStatisticsHiddenTableSmartView(context,{order: tableIndex});

        var sourceId  = DataSourceUtil.getDsId(context);//getPagePropertyValueFromConfig (context, pageId, 'Source');
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
     * ET: why 2 functions are needed here? they have the same signature and no special logic
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

            // move out of loop? start loop from 1 - otherwise extra checks
            // can be replaces with shorter expression: !i? resultSmartViewQuery+="mask: '" : other alternative
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
        var sourceId  = DataSourceUtil.getDsId(context);//getPagePropertyValueFromConfig (context, pageId, 'Source');
            
        if (trendSeries.length <= index) {
            return resultSmartViewQuery;
        }
            
        // add row with action status        
        resultSmartViewQuery+= trendSeries[index].qId;
        resultSmartViewQuery+="{dsnid: "+sourceId+"; collapsed: false; total: true; distribution: count; hideheader: true; filterbymask: true;  xmask: ";

        for (var i = 0; i<trendSeries.length; i++) {
            //ET: the same as before; extra operation every iteration
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
            //ET: we've got date util for dates, can it help?
            // please use it
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
        // ET: is the below if needed? or the above one?
		if(data[i].Value > 0) inactiveUsers.push(labels[i]);		
	}	
	
	return inactiveUsers;
 }
	

static function hitlistsActions_Render(context, isEditDeleteMode){

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var hitlist = context.hitlist;

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
            throw new Error('PageActions.hitlistsActions_Render: сheck Config settings for hitlist columns, '+DataSourceUtil.getProgramDsId(context)+'. Duplicated question ids and hierarchy variables are not allowed to use in the hitlist component.');
        }

        if (isEditDeleteMode) {
            Hitlist.AddColumn(context, 'editLink', {sortable: false, searchable: false});
            Hitlist.AddColumn(context, 'deleteLink', {sortable: false, searchable: false});
        }
    }
	
/**
     * @memberof PageActions
     * @function tableTrend_Render
     * @description function to render the trend table
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tablesBreakdown_Render (context, selectedCode) {

        var log = context.log;
        var table = context.table;
        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedCode);
        var hq: HeaderQuestion = new HeaderQuestion(qe);

        hq.Distributions.Enabled = true;
        hq.Distributions.HorizontalPercents = true;
        hq.ShowTotals = false;
        table.ColumnHeaders.Add(hq);

        // global table settings
        table.RemoveEmptyHeaders.Columns = false;
        table.Caching.Enabled = false;

    }


    /**
     * @param {Object} context
     * @returns {Object} {pid: currentPid, pname: currentPname}
     */
    static function getProjectInfoForActionsSurvey(context) {

        var log = context.log;

        //not pulse program
        if(DataSourceUtil.isProjectSelectorNotNeeded(context)) {

            //TO DO: handle case when pid to pass into Actions comes from config
            var programsDsId = DataSourceUtil.getProgramDsId(context);
            var project: Project =  DataSourceUtil.getProject(context, programsDsId);
            return {pid: project.ConfirmitProjectId, pname: project.ProjectName};
        }

        //TO DO: handle case when many pulse surveys are selected
        var selectedPulseSurvey = ParamUtil.GetSelectedOptions(context, 'p_projectSelector')[0];
        return {pid: selectedPulseSurvey.Code, pname: selectedPulseSurvey.Label};
    }

     /**
      * @description Assemble link to create new action
      * @param {Object} context
      */
    static function ActionBtn_Render(context) {

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var user = context.user;
        var log = context.log;

        var linkParameters = [];
        var actionLink = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'SurveyLink'); 

        //assemble all parameters for the link
        linkParameters.push('U=' + user.UserId);

        var userRoles: String = user.Roles;
        if(userRoles!="") linkParameters.push('role='+ userRoles);

        if(!HierarchyUtil.Hide(context)) linkParameters.push('hier='+ user.PersonalizedReportBase);

        var projectInfo = getProjectInfoForActionsSurvey(context);
        linkParameters.push('pid=' + projectInfo.pid);
        linkParameters.push('pname=' + projectInfo.pname);

        var wave = ParamUtil.GetSelectedCodes(context, 'p_Wave');
        if(wave.length) {
            linkParameters.push('wave=' + wave[0]);
        }

        // Flag if delegation is available
        linkParameters.push('isResponsibleVisible=' + PageActions.isFeatureAvailableForUserRole(context, 'Delegation'));
        linkParameters.push('currency=' + DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Currency'));
        linkParameters.push('l=' + context.report.CurrentLanguage);

        //we need to assign default values for dimension and statement
        //they'll be updated with js when selection changes
        var selectedDimension = ParamUtil.GetSelectedOptions(context, 'p_Dimensions');
        linkParameters.push('dimension=' + selectedDimension[0].Code);

        var selectedStatement = ParamUtil.GetSelectedOptions(context, 'p_Statements');
        (selectedStatement.length) ? linkParameters.push('statement=' + selectedStatement[0].Code) : linkParameters.push('null');

        var linkTitle = TextAndParameterUtil.getTextTranslationByKey(context, 'ActionAddBtn');
        var link = '<a id="createNewAction" href="'+ actionLink +'?'+ linkParameters.join('&') + '" class="icon icon--add" target="_blank" title="'+linkTitle+'"></a>'; 

        context.text.Output.Append(link);
    }
}
