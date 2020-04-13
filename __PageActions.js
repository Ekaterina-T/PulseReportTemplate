class PageActions {

    /**
     * @description Specific part of page Init 
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
     * @requires Parameters: p_HierMaskIds
     * @example PageActions.ActionPage_Init({state: state, report: report, log: log, text: text, user: user, pageContext: pageContext});
     */
    static function ActionPage_Init(context){
        var log = context.log;
        var state = context.state; 
        
        if(state.Parameters.IsNull("p_HierMaskIds")){
            state.Parameters["p_HierMaskIds"] = new ParameterValueResponse(getHierarchyMaskIdsStringList(context));
         }
    }

    /**
     * @description Assembles link to create new action and writes it into text element from context 
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
     * @requires Parameters: p_Wave, p_Dimensions, p_Statements
     * @example PageActions.ActionBtn_Render({state: state, report: report, log: log, text: text, user: user, pageContext: pageContext});
     */
    static function ActionBtn_Render(context) {

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var user = context.user;
        var log = context.log;

        var actionLink = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'SurveyLink');
        var linkParameters = [];

        //assemble all parameters for the link

        var schemaId = Config.DBSchemaID_ForProject;
        var tableName = Config.EndUserTableName;
        var schema_EndUsers : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(schemaId);
        var table_EndUsers : DBDesignerTable = schema_EndUsers.GetDBDesignerTable(tableName);
        var endUserIds = table_EndUsers.GetColumnValues("id", "__l9"+Config.EndUserTableLoginColumnName, user.UserId);
    
        if(endUserIds.Count != 1){
           throw new Error('PageActions.ActionBtn_Render: User is not in the table ' + tableName +' in schema ' + schemaId);
        }
        //var branch = BranchSpecifics.getSelectedBranchId(context);

        //linkParameters.push('B='+  (branch == "" || branch== undefined? "null":branch));
        linkParameters.push('Id=' + endUserIds[0]);
        linkParameters.push('U=' +  user.UserId);
        linkParameters.push('FeaturesConfig=' + user.Roles);

        if(!HierarchyUtil.Hide(context)) linkParameters.push('hier='+ user.PersonalizedReportBase);

        var projectInfo = getProjectInfoForActionsSurvey(context);
        linkParameters.push('pid=' + projectInfo.pid);
        linkParameters.push('pname=' + projectInfo.pname);

        var wave = ParamUtil.GetSelectedCodes(context, 'p_Wave');
        if(wave.length) {
            linkParameters.push('wave=' + wave[0]);
        }

        // Flag if delegation is available
        var isResponsibleVisible = PageActions.isFeatureAvailableForUserRole(context, 'Delegation');
        if(isResponsibleVisible) {linkParameters.push('isResponsibleVisible=true');}
        
        //flag if writing comments is available
        var isWritingCommentsAvailable = PageActions.isFeatureAvailableForUserRole(context, 'WriteAndChangeComments');
        if(isWritingCommentsAvailable) linkParameters.push('isWriting=true');

        linkParameters.push('currency=' + DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Currency'));
        linkParameters.push('l=' + context.report.CurrentLanguage);

        //we need to assign default values for dimension and statement
        //they'll be updated with js when selection changes
        var selectedDimension = ParamUtil.GetSelectedOptions(context, 'p_Dimensions');
        linkParameters.push('dimension=' + selectedDimension[0].Code);

        var selectedStatement = ParamUtil.GetSelectedOptions(context, 'p_Statements');
        (selectedStatement.length) ? linkParameters.push('statement=' + selectedStatement[0].Code) : linkParameters.push('statement=null');

        var linkTitle = TextAndParameterUtil.getTextTranslationByKey(context, 'ActionAddBtn');
        var link = '<a id="createNewAction" href="'+ actionLink +'?'+ linkParameters.join('&') + '" class="icon icon--add" target="_blank" title="'+linkTitle+'"></a>';

        context.text.Output.Append(link);
    }

    /**
     * @description function to hide specific widgets from the page
     * @param {Object} context = {state: state, report: report, log: log, pageContext: pageContext, user: user}
     * @returns {Boolean}
     * @example PageActions.hideAdvancedReportingWidget({state: state, report: report, log: log, pageContext: pageContext, user: user})
     */
    static function hideAdvancedReportingWidget(context) {
        return !isFeatureAvailableForUserRole(context, 'AdvancedReporting');
    }

    /**
     * @description help function to add trending column (as used for content crossing no matter what Trend we use) 
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @inner
     * @example addTrendingColumnByFirstTrend(context);
     */
    static function addTrendingColumnByFirstTrend(context) {

        var table = context.table;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');

        if(trendSeries == null || trendSeries == undefined){
            throw new Error('PageActions.addTrendingByFirstTrend:  Config should have "Trend" property.');
        }

        if(trendSeries.length==0){
            throw new Error('PageActions.addTrendingByFirstTrend: сheck Config settings for "Trend" property. There should be at least one Trend defined.');
        }
       
        var existingColumnsNumber = table.ColumnHeaders.Count;
        
        TableUtil.addTrending(context, trendSeries[0].date); // add 1 new column - trending by Date variable

        var hd : HeaderQuestion = table.ColumnHeaders[existingColumnsNumber]; //trending column
        var toDate : DateTime = DateTime.Now;
        hd.TimeSeries.StartDate =  SystemConfig.ActionPlannerSettings.TrendingStartDate; //new DateTime (2019, 1, 1);
        hd.TimeSeries.EndDate = toDate;
        
    }

     /**
     * @description help function to get valid code of 'Time Series break by' for Smart View
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log} - for log
     * @param timeUnit - option of parameter p_TimeUnitWithDefault
     * @inner
     * @example getTimeSeriesByTimeUnitSmartViewProps(context, timeUnit);
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
     /**
     * @description help function to generate SmartView table code for both trending widgets (Action Trend, End User Statistics)
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param {Object} {order: int trendIndex} - index of given Trend in Trend series list in Config
     * @inner
     * @requires Parameters: p_TimeUnitWithDefault
     * @example generateTrendingSmartViewTableCodeByTimeUnit(context, {order: trendIndex});
     * @returns String
     */
    static function generateTrendingSmartViewTableCodeByTimeUnit(context, seriesParam) {

            var log = context.log;
            var resultSmartViewQuery = "";
            var pageId = PageUtil.getCurrentPageIdInConfig(context);
            var sourceId  = DataSourceUtil.getDsId(context);
            var index = seriesParam.order; 
    
            var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');

            if(trendSeries == null || trendSeries == undefined){
                throw new Error('PageActions.addTrendingByFirstTrend:  Config should have "Trend" property.');
            }
            if(trendSeries.length==0){
                throw new Error('PageActions.addTrendingByFirstTrend: сheck Config settings for "Trend" property. There should be at least one Trend defined.');
            }
   
            //add columns with trending
            var timeUnits = ParamUtil.GetSelectedOptions(context, 'p_TimeUnitWithDefault');
            if(timeUnits == null || timeUnits == undefined){
                throw new Error('PageActions.generateTrendingSmartViewTableCodeByTimeUnit:  cannot get selected options of p_TimeUnitWithDefault');
            }
            if(timeUnits.length==0 || timeUnits.length>1){
                throw new Error('PageActions.generateTrendingSmartViewTableCodeByTimeUnit: p_TimeUnitWithDefault shoud have selected value and only one selected value');
            }
             
            var timeUnit = timeUnits[0];
    
            resultSmartViewQuery+=" ^ "; //add only columns, no rows needed

            // check if time unit for breakdown is specified in TextAndParameterLibrary->ParameterValuesLibrary
            if (timeUnit.TimeUnit) {
                    resultSmartViewQuery+=trendSeries[index].date + "{";
                    resultSmartViewQuery+=getTimeSeriesByTimeUnitSmartViewProps(context, timeUnit);
                    resultSmartViewQuery+="flatlayout: true; distribution: count;"; //do not remove distribution it is important for getting data!
            } else {
                    //  no time units, so add trending by a single (not a date question!) specified in TextAndParameterLibrary->ParameterValuesLibrary
                    resultSmartViewQuery+= timeUnit.Code + "{";
            }
                var toDate : DateTime = DateTime.Now;
                var fromDate : DateTime =  SystemConfig.ActionPlannerSettings.TrendingStartDate; //new DateTime (2019, 1, 1);
   
                resultSmartViewQuery+="dsnid: "+sourceId+"; total: false; hideheader: false; hidedata: false;";
                resultSmartViewQuery+=" start: \"" + DateUtil.formatDateTimeToStringForSmartView(fromDate)+ "\"; ";
                resultSmartViewQuery+=" end: \""+ DateUtil.formatDateTimeToStringForSmartView(toDate) + "\"}"; //toDate.Month +"\/"+toDate.Day+"\/"+toDate.Year+"\"}";          
            
            return resultSmartViewQuery;
    }

     /**
     * @description help function to generate SmartView table code for Action Trend widget
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param Object {order: int trendIndex} - index of given Trend in Trend series list in Config
     * @inner
     * @example generateActionTrandHiddenTableSmartView(context, {order: trendIndex});
     */
    static function generateActionTrandHiddenTableSmartView(context, seriesParam){

        //if needed in future some specific for Action Trend code can be added here

        return generateTrendingSmartViewTableCodeByTimeUnit(context, seriesParam);
    }

     /**
     * @description help function to get data for specific trending 
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param int trendIndex - index of given Trend in Trend series list in Config
     * @inner
     * @example getSpecificActionTrendDataArray(context, trendIndex);
     */
    static function getSpecificActionTrendDataArray(context, trendIndex) {

        var log = context.log;
        var report = context.report;
        var sourceId  = DataSourceUtil.getDsId(context);

        var result = [];

        var smTrend1Expression = generateActionTrandHiddenTableSmartView(context,{order: trendIndex});
        
        var smTrendTable = report.TableUtils.GenerateTableFromExpression(sourceId, smTrend1Expression, TableFormat.Json);
        var smTrendTableJSON = JSON.parse(smTrendTable);
        
        var l = smTrendTableJSON.data[0].length;

        for(var i=0; i<l; i++) {
            result.push(smTrendTableJSON.data[0][i].values.count);
        }

        return result;
    }

    /**
     * @description function to render the trend table
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @example PageActions.tableTrend_Render({state: state, report: report, log: log, table: table, pageContext: pageContext});
     */
    static function tableTrend_Render(context){
        var log = context.log;
        var report = context.report;
        var table = context.table;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var dsId = DataSourceUtil.getDsId(context);

        var trendSeries  = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'Trend');
  
        if(trendSeries == null || trendSeries == undefined){
            throw new Error('PageActions.addTrendingByFirstTrend:  Config should have "Trend" property.');
        }
        if(trendSeries.length==0){
            throw new Error('PageActions.addTrendingByFirstTrend: сheck Config settings for "Trend" property. There should be at least one Trend defined.');
        }
        
        addTrendingColumnByFirstTrend(context);

        for (var trendIndex = 0; trendIndex < trendSeries.length; trendIndex++) { 
                var hc : HeaderContent = new HeaderContent();

                var dpArray = getSpecificActionTrendDataArray(context, trendIndex);
                for (var i=0; i<dpArray.length; i++) {
                    var currentValue = dpArray[i];
                    if (!currentValue.Equals(Double.NaN)) {
                        hc.SetCellValue(i, currentValue);
                    }
                }

                var series_name = QuestionUtil.getQuestionAnswerByCode(context, trendSeries[trendIndex].qId, trendSeries[trendIndex].code, dsId).Text;
                hc.Title = new Label(report.CurrentLanguage, series_name);

                table.RowHeaders.Add(hc);
        }
        
        
        table.Decimals = 0;
        table.RemoveEmptyHeaders.Columns = true;
        table.Caching.Enabled = false;
       
    }

    /**
     * @description help function to generate SmartView help tables code for End User Statistics widget
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param Object {order: int trendIndex} - index of given Trend in Trend series list in Config
     * @inner
     * @example generateTableEndUsertStatisticsHiddenTableSmartView(context, {order: trendIndex});
     * @requires Parameters: p_EndUserSelection
     */
    static function generateTableEndUsertStatisticsHiddenTableSmartView(context, trendIndex){
        var resultSmartViewQuery = "";
        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');
        resultSmartViewQuery += actionOwner+ "{total: false; filterbymask: true; ";

        var chosenUsers = ParamUtil.GetSelectedCodes(context, "p_EndUserSelection");
        var chosenUsersN = chosenUsers.length;

        if(chosenUsersN >0){
            resultSmartViewQuery +="mask: '" + chosenUsers.join(',') + ";";
        }
       
        resultSmartViewQuery += "}"; 
        resultSmartViewQuery += generateTrendingSmartViewTableCodeByTimeUnit(context, trendIndex);
        
        return resultSmartViewQuery;
    }


    /**
     * @description help function to get JSON table with specific trend by user
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param int trendIndex - index of given Trend in Trend series list in Config
     * @inner
     * @example getEndUserStatHiddenTableJSON(context, trendIndex);
     */
    static function getEndUserStatHiddenTableJSON(context, trendIndex) {
        var log = context.log;
        var report = context.report;

        var smExpression = generateTableEndUsertStatisticsHiddenTableSmartView(context,{order: trendIndex});

        var sourceId  = DataSourceUtil.getDsId(context);
        var smTable = report.TableUtils.GenerateTableFromExpression(sourceId, smExpression, TableFormat.Json);
        var smTableJSON = JSON.parse(smTable);

        return smTableJSON;
    }

     /**
     * @description help function to get data from json table with COUNT distribution 
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param int rowIndex - index of the row to take
     * @inner
     * @example  var dpArray = getJSONTableWithCountDistributionRowDataArray(jsonTables[trendIndex], j);
     */
    static function getJSONTableWithCountDistributionRowDataArray(jsonTable, rowIndex){
        var result = [];
        var l = jsonTable.data[rowIndex].length;
        for(var i=0; i<l; i++){
            result.push(jsonTable.data[rowIndex][i].values.count);
        }
        return result;
    }

    /**
     * @description function to render the EndUsertStatistics table
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user}
     * @example PageActions.tableEndUsertStatistics_Render({state: state, report: report, log: log, table: table, pageContext: pageContext, user: user});
     * @requires Parameters: p_EndUserSelection
     */
    static function tableEndUsertStatistics_Render(context){

        var report = context.report;
        var table = context.table;
        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var dsId = DataSourceUtil.getDsId(context);

        //do not move it below because if no enduser chosen function will stop at the middle
        //but this settings are needed anyway
        table.Decimals = 0;
        table.RemoveEmptyHeaders.Rows = true;
        table.Distribution.Enabled = true;
        table.Distribution.Count = true;
        table.Distribution.VerticalPercents = false;
        table.Caching.Enabled = false;

        var trendSeries = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'Trend');
       
        if(trendSeries == null || trendSeries == undefined){
            throw new Error('PageActions.addTrendingByFirstTrend:  Config should have "Trend" property.');
        }
        if(trendSeries.length==0){
            throw new Error('PageActions.addTrendingByFirstTrend: сheck Config settings for "Trend" property. There should be at least one Trend defined.');
        }

        addTrendingColumnByFirstTrend(context);  

        var chosenUsers = ParamUtil.GetSelectedOptions(context, 'p_EndUserSelection');
        var chosenUsersN = chosenUsers.length;

        if(chosenUsersN==0){   return;   }
      
        var jsonTables = [];
        
        for(var trendIndex = 0; trendIndex<trendSeries.length; trendIndex++){
                jsonTables.push(getEndUserStatHiddenTableJSON(context, trendIndex));
            }
        
        if (trendSeries.length > 0) {
            for (var j=0; j<chosenUsersN; j++) {
                var hcUser: HeaderSegment = new HeaderSegment();
                hcUser.DataSourceNodeId = dsId;
                hcUser.Label = new Label(9, chosenUsers[j].Label);

                for (var trendIndex = 0; trendIndex < trendSeries.length; trendIndex++) {
                    var hc : HeaderContent = new HeaderContent();
                    var dpArray = getJSONTableWithCountDistributionRowDataArray(jsonTables[trendIndex], j);
                    for (var i=0; i<dpArray.length; i++) {
                        var currentValue = dpArray[i];
                        if (!currentValue.Equals(Double.NaN)) {
                            hc.SetCellValue(i, currentValue);
                        }
                    }

                    var series_name = QuestionUtil.getQuestionAnswerByCode(context, trendSeries[trendIndex].qId, trendSeries[trendIndex].code, dsId).Text;
                    hc.Title = new Label(report.CurrentLanguage, series_name);

                    hcUser.SubHeaders.Add(hc);
                }

                table.RowHeaders.Add(hcUser);
            }

        }

    }

    /**
     * @description function to render ActionBreakdown Dimension/Statement tables
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param String "statement" or "dimension"
     * @example PageActions.tablesBreakdown_Render({state: state, report: report, log: log, table: table, pageContext: pageContext},'dimension');
     */
    static function tablesBreakdown_Render(context, breakdownType) {

        var log = context.log;
        var table = context.table;

        var breakdownQId : String ="";

        switch(breakdownType){
            case "statement": {breakdownQId = SystemConfig.ActionPlannerSettings.StatementsQId; break;}
            case "dimension": {breakdownQId = SystemConfig.ActionPlannerSettings.DimensionsQId; break;}
            default: {
                throw new Error('PageActions.tablesBreakdown_Render: the second argument should be "statement" or "dimension"');
            }
        }        

        var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, breakdownQId);
        var hq: HeaderQuestion = new HeaderQuestion(qe);

        hq.Distributions.Enabled = true;
        hq.Distributions.HorizontalPercents = true;
        hq.ShowTotals = false;
        hq.Decimals = Config.Decimal;
        table.ColumnHeaders.Add(hq);

        // global table settings
        table.RemoveEmptyHeaders.Columns = true;
        table.Caching.Enabled = false;

    }
   
     /**
     * @description function to mask hierarchy node to show current selected level and children (of first level).
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @returns {String} 'id1,id2,id3' - ids to exclude - except reportbase and its children
     * @example getHierarchyMaskIdsStringList(context);
     * @inner
     */
     //TODO:  What if report base have several elements?
     // Maybe use hierarchy level settings instead of masking
    static function getHierarchyMaskIdsStringList(context){

        var user = context.user;
        var reportBase = user.PersonalizedReportBase;
        var dataTable = HierarchyUtil.getDataTable();
        var hierLevels = dataTable.Rows;

        var idsToMask = [];

        //as it is hierarchy, mask is always exclusive, so we find everything except reportBase and its children
        for (var i = 0; i < hierLevels.Count; i++) {
            var dRow : DataRow = hierLevels[i];
            if (dRow['id']!=reportBase && dRow['parent']!=reportBase) {
                idsToMask.push(dRow['id']);
            }
        }
        var idsToMaskString = idsToMask.join(',');

        return idsToMaskString;
    }
    /**
     * @description help function to get exclusive mask for hierarchy 
     * @param {Object} context - {component: table, pageContext: pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @inner
     * @requires Parameters: p_HierMaskIds
     * @example hierQuestionHeader.AnswerMask = getHierarchyMask (context);
     * @returns MaskHierarchy
     */
    static function getHierarchyMask (context) {

        var state = context.state;
        var idsToMask = [];
  
        if(!state.Parameters.IsNull("p_HierMaskIds")){
            idsToMask = state.Parameters.GetString("p_HierMaskIds").split(',');
        } else {
            idsToMask = getHierarchyMaskIdsStringList(context).split(',');
        }

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
     * @description function to render the ActionsByDemographics table.
     * @requires Parameters: p_Actions_BreakBy
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @example PageActions.tableActionsByDemographics_Render({state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit});
     */
    static function tableActionsByDemographics_Render (context) {

        var table = context.table;
        var state = context.state;
        var hierarchyQuestionId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');
        var selectedBreakVar = ParamUtil.GetSelectedCodes (context, 'p_Actions_BreakBy');

        var qERow: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedBreakVar[0]);
        var hQRow : HeaderQuestion = new HeaderQuestion(qERow);
        hQRow.ShowTotals = false;

        if (selectedBreakVar[0] == hierarchyQuestionId) {
            hQRow.ReferenceGroup.Enabled = false;
            hQRow.HierLayout = 'Flat';

            if(state.Parameters.IsNull("p_OnlyOwnActions") || (!PageActions.isFeatureAvailableForUserRole(context, "ReportLevelAccess"))) {
                hQRow.AnswerMask = getHierarchyMask (context);
            }
        }
        table.RowHeaders.Add(hQRow);

        var qEColumn: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, 'actionstatus');
        var hQColumn : HeaderQuestion = new HeaderQuestion(qEColumn);
        hQColumn.ShowTotals = false;
        hQColumn.Decimals = Config.Decimal;
        table.ColumnHeaders.Add(hQColumn);
        table.RemoveEmptyHeaders.Rows = true;
        table.Caching.Enabled = false;

    }

    //TODO: use Smart View instead reportal component
    /**
     * @description function to render InactiveUsers_Hidden table (help table for building )
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @example PageActions.inactiveUsersHiddenTable_Render({confirmit: confirmit, state: state, report: report, log: log, table: table, user:user, pageContext: pageContext});
     */
    static function inactiveUsersHiddenTable_Render(context){
        var table = context.table;
        var log = context.log;
        var user = context.user;

        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var actionOwner = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'EndUserSelection');
        var qeActionOwner: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, actionOwner);
        var hqActionOwner: HeaderQuestion = new HeaderQuestion(qeActionOwner);

        var actionOwnerMask: MaskFlat = new MaskFlat();
        actionOwnerMask.IsInclusive = true;
        var currentHFUserIds = BranchSpecifics.getUserIdsByCurrentBranch(context, user.UserId);
        for (var i = 0 ; i < currentHFUserIds.length; i++) {
            actionOwnerMask.Codes.Add(currentHFUserIds[i]);
        }

        hqActionOwner.AnswerMask = actionOwnerMask;
        hqActionOwner.FilterByMask = true;
        hqActionOwner.ShowTotals = false;
        table.RowHeaders.Add(hqActionOwner);

        var actionCreator = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'ActionCreatorsList');
        var qeActionCreator: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, actionCreator);
        var hqActionCreator: HeaderQuestion = new HeaderQuestion(qeActionCreator);

        hqActionCreator.AnswerMask = actionOwnerMask;
        hqActionCreator.FilterByMask = true;
        hqActionCreator.ShowTotals = false;
        table.RowHeaders.Add(hqActionCreator);

        var hb : HeaderBase = new HeaderBase();
        hb.HideData = true;
        hb.HideHeader = true;

        /* as lists of actionOwner answers (n items) is the same as list of actionCreators (userId) list (n items), 
        *  we have  2*n = rows, where k-th row is the same person as k+n, so we can sum this values and
        *  if sum is more then 0, the user was active. Formula returns empty in this case and 1 if sum = 0 and person was inactive
        *  table is sorted by this formula, so we take from the beginnig everyone who have 1 in this column
        */
        var hf : HeaderFormula = new HeaderFormula();
        hf.HideHeader = true;
        hf.Type = FormulaType.Expression;
        hf.Expression = "if(row <= rows/2, if(cellv(col-1,row)+cellv(col-1,row+rows/2) > 0, 0, 1), 0 )";

        table.ColumnHeaders.Add(hb);
        table.ColumnHeaders.Add(hf);

        //table settings
        table.RemoveEmptyHeaders.Rows = true;
        table.Caching.Enabled = false;
        table.Sorting.Rows.Enabled = true;
        table.Sorting.Rows.SortByType = TableSortByType.Position;
        table.Sorting.Rows.Position = 2;
    }

    /**
     * @description help function to get inactive users array based on the table that uses function inactiveUsersHiddenTable_Render
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @param String - name of the table in Reportal that uses function inactiveUsersHiddenTable_Render
     * @example inactiveUsersList_Render(context, "InactiveUsers_Hidden");
     * @inner
     * @returns Array of String
     */
    static function inactiveUsersList_Render(context, tableName){
        var log = context.log;
        var report = context.report;

        var inactiveUsers = [];

        var data = report.TableUtils.GetColumnValues(tableName, 1); // get formula column values
        var labels = report.TableUtils.GetRowHeaderCategoryTitles(tableName);

        for(var i=0; i<data.length; i++){
            if(data[i].Value == 0) {continue;}
            inactiveUsers.push(labels[i]);
        }

        return inactiveUsers;
    }

    /**
     * @description function to render the InactiveUsersList.
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @example PageActions.buildInactiveUserList({confirmit: confirmit, state: state, report: report, log: log, user:user, pageContext: pageContext, text: text});
     */
    static function buildInactiveUserList(context) {

        var inactiveUsers = inactiveUsersList_Render(context, "InactiveUsers_Hidden");
        var text = context.text;

        text.Output.Append('<div id="user-list"><div class="list">');
        for (var i=0; i<inactiveUsers.length; i++) {
            text.Output.Append('<p class="name">' + inactiveUsers[i] + '</p>');
        }
        text.Output.Append('</div><ul class="pagination"></ul></div>');
    }

    /**
     * @description function to render the ActionCost table.
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @example PageActions.tableActionCost_Render({confirmit: confirmit, state: state, report: report, log: log, table: table, user:user, pageContext: pageContext});
     * @requires Parameters: p_ActionCost_BreakBy
     */
    static function tableActionCost_Render(context) {

        var table = context.table;
        var state = context.state;
        var hierarchyQuestionId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');
        var selectedBreakVar = ParamUtil.GetSelectedCodes (context, 'p_ActionCost_BreakBy');
        table.RemoveEmptyHeaders.Rows = true;

        var qERow: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedBreakVar[0]);
        var hQRow : HeaderQuestion = new HeaderQuestion(qERow);
        hQRow.ShowTotals = false;

        if (selectedBreakVar[0] == hierarchyQuestionId) {
            hQRow.ReferenceGroup.Enabled = false;
            hQRow.HierLayout = 'Flat';

            if(state.Parameters.IsNull("p_OnlyOwnActions") || (!PageActions.isFeatureAvailableForUserRole(context, "ReportLevelAccess"))) {
                hQRow.AnswerMask = getHierarchyMask (context);
            }
        }
        table.RowHeaders.Add(hQRow);

        var qECost: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, 'cost');
        var hQCost : HeaderQuestion = new HeaderQuestion(qECost);
        hQCost.IsCollapsed = true;
        hQCost.HideHeader = true;
        hQCost.Decimals = Config.Decimal;
        hQRow.SubHeaders.Add(hQCost);

        var HSAvg: HeaderStatistics = new HeaderStatistics();
        HSAvg.Statistics.Avg = true;
        HSAvg.Texts.Average = TextAndParameterUtil.getLabelByKey(context, 'Average');

        var HSSum: HeaderStatistics = new HeaderStatistics();
        HSSum.Statistics.Sum = true;
        HSSum.Texts.Sum = TextAndParameterUtil.getLabelByKey(context, 'Total');

        table.ColumnHeaders.Add(HSAvg);
        table.ColumnHeaders.Add(HSSum);
        table.Caching.Enabled = false;
    }

    /**
     * @description function to render the Hitlists.
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @param Boolean isEditDeleteMode - determines if we should edd Edit/Delete links or not
     * @example PageActions.hitlistsActions_Render({hitlist: hitlist, state: state, report: report, pageContext: pageContext, log: log}, false);
     */
    static function hitlistsActions_Render(context, isEditDeleteMode){

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var hitlist = context.hitlist;
        var log = context.log;

        var staticCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns');
        var tagCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'TagsForHitlist');
        var actionLinks = hitlistsActions_getActionLinks(context);
        var callBlockId = SystemConfig.ActionPlannerSettings.CallBlockID;

        var position = 0;
        var actionLinksNumber = isEditDeleteMode ? actionLinks.length : 0;

        if(actionLinksNumber > hitlist.Columns.Count) {
            throw new Error('PageActions.hitlistsActions_Render: сheck Config settings for the number of action links, or add extra links to the hitlist.');
        }

        if (isEditDeleteMode) {
            hitlistsActions_removeExtraLinkColumns(context);

            if(actionLinksNumber > 0) {
                for(var i = 0; i < actionLinksNumber; i++) {
                    hitlistsActions_SetCallblockLinks(context, actionLinks[i], i, callBlockId);
                }
            }
        }

        for (var i=0; i<staticCols.length; i++) {
            Hitlist.AddColumn(context, staticCols[i].id, {sortable: staticCols[i].properties.sortable, searchable: staticCols[i].properties.searchable, order: position});
            position++;
        }

        for (var i=0; i<tagCols.length; i++) {
            Hitlist.AddColumn(context, tagCols[i].id, {sortable: tagCols[i].properties.sortable, searchable: tagCols[i].properties.searchable, order: position});
            position++;
        }

        if(staticCols.length + tagCols.length !== hitlist.Columns.Count - actionLinksNumber) {
            throw new Error('PageActions.hitlistsActions_Render: сheck Config settings for hitlist columns, '+DataSourceUtil.getProgramDsId(context)+'. Duplicated question ids and hierarchy variables are not allowed to use in the hitlist component.');
        }
    }

    /**
     * @description function to set up the links to corresponding callblocks.
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @param String actionLink - type of the link, e.g. edit, delete
     * @param Int linkPosition - position of the link in the hitlist
     * @param String callBlockId - id of the callblock the link is reffering to
     * @example PageActions.hitlistsActions_SetCallblockLinks({hitlist: hitlist, state: state, report: report, pageContext: pageContext, log: log}, "edit", 0, "Init");
     */
    static function hitlistsActions_SetCallblockLinks(context, actionLink, linkPosition, callBlockId) {
        var hitlist = context.hitlist;
        var log = context.log;
        var report = context.report;
        var user = context.user;

        if(callBlockId == null || callBlockId == undefined || callBlockId == ''){
            throw new Error('PageActions.hitlistsActions_SetCallblockLinks:  Config should have "CallBlockId" property.');
        }

        //user data
        var schema_EndUsers : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(Config.DBSchemaID_ForProject);
        var table_EndUsers : DBDesignerTable = schema_EndUsers.GetDBDesignerTable(Config.EndUserTableName);
        var endUserIds = table_EndUsers.GetColumnValues("id", "__l9"+Config.EndUserTableLoginColumnName, user.UserId);

        var langInLink = 'l=' + report.CurrentLanguage + ';';
        var rolesList = user.Roles == '' ? '' : 'role="' + user.Roles + '";';
        var isResponsibleVisible = isFeatureAvailableForUserRole(context, 'Delegation') == "" || isFeatureAvailableForUserRole(context, 'Delegation') == "false" ? "" : "isResponsibleVisible=" + isFeatureAvailableForUserRole(context, 'Delegation') + ';';
        var isWriting = isFeatureAvailableForUserRole(context, 'WriteAndChangeComments') == "" || isFeatureAvailableForUserRole(context, 'WriteAndChangeComments') == "false"? "" : "isWriting=" + isFeatureAvailableForUserRole(context, 'WriteAndChangeComments') + ';';
        var source = 'source=' + actionLink + ";";
        var u = 'U=' + user.UserId  + ";";
        var featuresConfig = "featuresConfig=" + user.Roles +";";
        var idEditor = endUserIds.Count > 0 ? 'IdEditor=' + endUserIds[0] + ";" : '';

        hitlist.Columns[linkPosition].SurveyLink.CallBlockId = callBlockId;
        hitlist.Columns[linkPosition].SurveyLink.UrlEncryptedParameters = langInLink + rolesList + isResponsibleVisible + isWriting + source + u + idEditor+featuresConfig;
        hitlist.Columns[linkPosition].SurveyLink.Name = actionLink + ' link';
    }

    /**
     * @description function to remove extra links from the hitlist based on the number of them specified in the config
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @example PageActions.hitlistsActions_removeExtraLinkColumns({hitlist: hitlist, state: state, report: report, pageContext: pageContext, log: log});
     */
    static function hitlistsActions_removeExtraLinkColumns(context) {
        var hitlist = context.hitlist;

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var actionLinks = hitlistsActions_getActionLinks(context);

        var i = hitlist.Columns.Count - 1;

        while(i >= actionLinks.length) {
            hitlist.Columns.RemoveAt(i);
            i--;
        }
    }

    /**
     * @description function to evaluate the links defined in the Config and remove any incorrect occurrences
     * @param {Object} context - {state: state, report: report, log: log, table: table, pageContext: pageContext, user: user, confirmit: confirmit}
     * @example PageActions.hitlistsActions_getActionLinks({hitlist: hitlist, state: state, report: report, pageContext: pageContext, log: log});
     */
    static function hitlistsActions_getActionLinks(context) {
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var actionLinksObject = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'ActionLinks');
        var actionLinks = [];
        var evaluatedActionLinks = [];

        if(actionLinksObject != null || actionLinksObject != undefined) {
            for (var prop in actionLinksObject) {
                if(actionLinksObject[prop]) {
                    actionLinks.push(prop);
                }
            }
        }

        if(actionLinks.length != 0) {
            for(var i = 0; i < actionLinks.length; i++) {
                if(actionLinks[i].ToLower().indexOf('read') >= 0) {
                    evaluatedActionLinks.push('read');
                }
                if(actionLinks[i].ToLower().indexOf('edit') >= 0) {
                    evaluatedActionLinks.push('edit');
                }
                if(actionLinks[i].ToLower().indexOf('delete') >= 0) {
                    evaluatedActionLinks.push('delete');
                }
            }
        }

        return evaluatedActionLinks;
    }

    /**
     * @description function to hide the hitlist
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     * @example PageActions.hitlistActions_Hide({state: state, report: report, log: log})
     */
    static function hitlistActions_Hide(context) {
        return Export.isPdfExportMode(context);
    }

    /**
     * @description function to render the ActionsKPI table.
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @example PageActions.tableKPI_Render({state: state, report: report, log: log, table: table, pageContext: pageContext});
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
        formula.Decimals = Config.Decimal;
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
        table.Caching.Enabled = false;
    }

    /**
     * @description function to get the number of columns with tags in StyleAndJavaScriptUtil
     * @param {Object} context - {pageContext: ageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {Array} - array with numbers of columns
     * @example PageActions.getTagColumnNumbers(context)
     * @inner
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
     * @description function to send settings of the Implememted Actions table to  Javascript via StyleAndJavaScriptUtil
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     * @inner
     * @example PageActions.getKPIResult(context)
     * @returns Array of JSON [{score: score, color: color, qid: 'actions', format: '%', yAxisMin: 0}] or null
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
     * @description help function to check specific role permissions / features, uses on  StyleAndJavaScriptUtil and in the report
     * @param {Object} context - {pageContext: ageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param String feature - name of feature - check list of features in report Config
     * @returns Boolean  
     * @example PageActions.isFeatureAvailableForUserRole(context, 'WriteAndChangeComments')
     * @inner
     */
    static function isFeatureAvailableForUserRole(context, feature) {
        var user = context.user;
       
        if (user.UserType == ReportUserType.Confirmit) {
            return true;
        } 

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var featuresByRoles = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'FeaturesByRoles');
        var isAvailable = false;
        var rolesForCurrentFeature = [];

        if(user.UserType == ReportUserType.Enduser) {

        //check features in Config to find the one mentioned in func argument
            for (var i=0; i<featuresByRoles.length; i++) {
                if (featuresByRoles[i].feature == feature) {
                    rolesForCurrentFeature = featuresByRoles[i].roles;
                    break;
                }
            }
        // check roles of given feature and find them in user Roles, 
        // if at least one is found, feature is available
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
     * @description
     * @param {Object} context
     * @returns {Object} {pid: currentPid, pname: currentPname}
     * @requires Parameters: p_projectSelector
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

}
