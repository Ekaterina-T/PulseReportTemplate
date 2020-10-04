class Filters {

    /**
     *
     */
    static function getFilterParameterType(context) {
        return !!context.pageSpecific ? 'pageSpecific' : 'global';
    }

    /**
     *
     */
    static function GetFilterQuestionsListByType(context, explicitFilterType) {

        var bgLevelQids = [];
        var surveyLevelQids = [];
        var filterType = !explicitFilterType ? getFilterParameterType(context) : explicitFilterType;

        if(filterType === 'pageSpecific') {
            var pageId = PageUtil.getCurrentPageIdInConfig(context);
            bgLevelQids = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'PageSpecificFilters');
            surveyLevelQids = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'PageSpecificFiltersFromSurveyData');
        } else {
            bgLevelQids = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
            surveyLevelQids = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');
        }

        return bgLevelQids && surveyLevelQids ? bgLevelQids.concat(surveyLevelQids) : [];
    }

    /**
     *
     */
    static function GetNumberOfBGFiltersByType(context, filterType) {

        if(filterType === 'global') {
            return DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters').length;
        } else if (filterType === 'pageSpecific') {
            var pageId = PageUtil.getCurrentPageIdInConfig(context);
            return DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'PageSpecificFilters').length;
        }
    }

    /**
     * Hide filter placeholder if there's no filter question.
     * @param {object} context object {state: state, report: report, pageContext: pageContext, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {boolean} indicates if filter exists
     */
    static function hideScriptedFilterByOrder(context, paramNum) {

        var log = context.log;
        var pageHasSpecificFilters = PageUtil.PageHasSpefcificFilters(context);
        var isPageSpecificParameter = !!context.pageSpecific;
        var filterList = [];

        if(!isPageSpecificParameter) {

            if(pageHasSpecificFilters) {
                return true;
            }

            filterList = GetFilterQuestionsListByType(context, 'global');
            var pageId = PageUtil.getCurrentPageIdInConfig(context);
            var numberOfBGFilters = GetNumberOfBGFiltersByType(context, 'global');

            // paramNum should be less than number of filter components on all pages
            // paramNum should be less than number of filters based on BG vars on Response Rate page
            if (paramNum > filterList.length || (pageId === 'Page_Response_Rate' && paramNum > numberOfBGFilters)) {
                return true;
            }

            if (!Access.isQuestionAllowed(context, filterList[paramNum-1], 'filters'+paramNum)) {
                return true;
            }

            return false;
        }

        if(isPageSpecificParameter) {

            if(!pageHasSpecificFilters) {
                return true;
            }
            filterList = GetFilterQuestionsListByType(context, 'pageSpecific');
            return paramNum > filterList.length;
        }

        throw new Error('Fiters.hideScriptedFilterByOrder: unknown combination of filter type and page');

    }


    /**
     * Get scripted filter title.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {string} question title
     */
    static function getScriptedFilterNameByOrder(context, paramNum) {

        var log = context.log;
        var filterList = GetFilterQuestionsListByType(context);

        if (paramNum <= filterList.length) {
            return QuestionUtil.getQuestionTitle(context, filterList[paramNum - 1]);
        }

        return '';
    }

    /**
     * Populate filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {number} paramNum number of filter
     */
    static function populateScriptedFilterByOrder(context, paramNum) {

        var log = context.log;
        var parameter = context.parameter;
        var filterList = GetFilterQuestionsListByType(context);

        // no question for this parameter placeholder
        if (filterList.length < paramNum) {
            return;
        }

        var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, filterList[paramNum - 1]);

        for (var i = 0; i < answers.length; i++) {
            var val = new ParameterValueResponse();
            val.StringValue = answers[i].Text;
            val.StringKeyValue = answers[i].Precode;
            parameter.Items.Add(val);
        }

        return;
    }

    /**
     * 
     */
    static function getHiddenFilterIndexes(context) {

        var log = context.log;

        if(DataSourceUtil.isProjectSelectorNotNeeded(context) || PageUtil.PageHasSpefcificFilters(context)) {
            return [];
        }

        //pulse program, one of main pages
        var activeQids = PulseProgramUtil.getPulseSurveyContentInfo_ItemsWithData(context);
        var filters =  GetFilterQuestionsListByType(context, 'global');
        var invalidIndexes = [];

        var startIndex = GetNumberOfBGFiltersByType(context, 'global');

        var startVisibleIndex = startIndex;
        var nVisibleFilters = filters.length;
        var visibleFilters = [];

        for(var i=0; i<filters.length; i++) {
            if (!Access.isQuestionAllowed(context, filters[i])) {
                if(i<startIndex) {
                    startVisibleIndex --;
                }
                nVisibleFilters --;
            } else {
                visibleFilters.push(filters[i]);
            }
        }

        for(var i=startVisibleIndex; i<nVisibleFilters; i++) {
            if(!activeQids.hasOwnProperty(visibleFilters[i])) {
                invalidIndexes.push(i+1);
            }
        }

        return invalidIndexes;

    }

    //================================ FILTER PANEL EXPR START ====================================

    /**
     * Reset filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     */
    static function ResetAllFilters(context) {

        var log = context.log;
        var filterNames = [];
        var i;

        var filterSurveyLevelParameters = GetFilterQuestionsListByType(context, 'global');
        for (i = 0; i < filterSurveyLevelParameters.length; i++) {
            filterNames.push('p_ScriptedFilterPanelParameter' + (i + 1));
        }

        //hardcoded because pages may have different amount of page specific filters
        var maxNumberOfPageSpecificFilters = 10;
        for (i = 0; i < maxNumberOfPageSpecificFilters; i++) {
            filterNames.push('p_ScriptedPageFilterPanelParam' + (i + 1));
        }

        ParamUtil.ResetParameters(context, filterNames);
        return;
    }

    /**
     *
     */
    static function GetIndividualFilterExpression(context, paramId, qId) {

        var state = context.state;
        var ds = DataSourceUtil.getPageDsId(context);

        if (!state.Parameters.IsNull(paramId)) {
            // support for multi select. If you need multi-selectors, no code changes are needed, change only parameter setting + ? list css class
            var responses = ParamUtil.GetSelectedCodes(context, paramId);
            var individualFilterExpr = [];
            for (var j = 0; j < responses.length; j++) {
                individualFilterExpr.push('IN(' + ds + ':' + qId + ', "' + responses[j] + '")');
            }
            return '(' + individualFilterExpr.join(' OR ') + ')';
        }

        return null;
    }


    /**
     * 
     */
    static function GetFilterPanelExpression(context, explicitFilterType, varType) {

        var log = context.log;
        var filterType = explicitFilterType ? explicitFilterType : (PageUtil.PageHasSpefcificFilters(context) ? 'pageSpecific' : 'global');
        var filterList = GetFilterQuestionsListByType(context, filterType); //global or page specifics
        var filterPrefix = (filterType === 'pageSpecific') ? 'p_ScriptedPageFilterPanelParam' : 'p_ScriptedFilterPanelParameter';

        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        var startIndex = 0;
        var lastIndex = filterList.length;

        if(pageId === 'Page_Response_Rate' || varType === 'background') { //apply only bg based filters
            lastIndex = GetNumberOfBGFiltersByType(context, filterType)-1;
        }

        if(varType === 'survey') {
            startIndex = GetNumberOfBGFiltersByType(context, filterType); 
        }

        var filterExpr =  [];

        for(var i=startIndex; i<lastIndex; i++) {
            var indExpr = GetIndividualFilterExpression(context, filterPrefix+''+(i+1), filterList[i]);
            if(indExpr) {
                filterExpr.push(indExpr);
            }
        }

        return filterExpr.join(' AND ');
    }

   //================================ FILTER PANEL EXPR END ====================================

    /**
     * @function GetFilterValues
     * @description returns selected filter options
     * @param {Object} context
     * @returns {Array} Array of objects {Label: label, selectedOptions: [{Label: label, Code: code}]}
     */
    static function GetFiltersValues(context, filterType) {

        var log = context.log;

        var filterValues = [];
        var filters = GetFilterQuestionsListByType(context, filterType);
        var filterPrefix = (filterType === 'pageSpecific') ? 'p_ScriptedPageFilterPanelParam' : 'p_ScriptedFilterPanelParameter';

        for (var i = 0; i < filters.length; i++) {
            // support for multi select. If you need multi-selectors, no code changes are needed, change only parameter setting + ? list css class
            var selectedOptions = ParamUtil.GetSelectedOptions(context, filterPrefix + (i + 1));
            var filterName = getScriptedFilterNameByOrder(context, i + 1);

            if (selectedOptions.length > 0) {
                filterValues.push({ Label: filterName, selectedOptions: selectedOptions });
            }
        }

        return filterValues;
    }

    /**
     * @function getFilterExpressionByAnswerRange
     * @description function to generate a script expression to filter by options of single question
     * @param {Object} context
     * @param {String} qId - question id
     * @param {Array} answerCodes - the array of answer codes to include
     * @returns {String} filter script expression
     */
    static function getFilterExpressionByAnswerRange(context, qId, answerCodes) {

        var log = context.log;

        if (!(answerCodes instanceof Array)) {
            throw new Error('Filters.getFilterExpressionByAnswerRange: answerCodes is not an array; filter for ' + qId);
        }

        qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(qId);

        if (answerCodes.length) {
            return 'IN(' + qId + ', "' + answerCodes.join('","') + '")';
        }
        return '';
    }

    /**
     * @description function indicationg if time period filter set is needed or not
     * @param {Object} context
     * @returns {Boolean} true or false
     */
    static function isTimePeriodFilterHidden(context) {

        return DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'IsTimePeriodFilterHidden')
    }

    /**
     * @description function indicationg if the wave filter is needed or not
     * @param {Object} context
     * @returns {Boolean} true or false
     */
    static function isWaveFilterHidden(context) {
        var log = context.log;
        return (Boolean)(!DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion'));
    }

    /**
     * @description function to generate a script expression to filter by selected time period
     * @param {Object} context
     * @param {String} qId - date question id
     * @returns {String} filter script expression
     */
    static function getTimePeriodFilter(context, qId) {

        var log = context.log;

        if (isTimePeriodFilterHidden(context)) { // date period filter is hidden in pulse programs
            return '';
        }

        var timePeriod = DateUtil.defineDateRangeBasedOnFilters(context);
        var expression = [];
        var year;
        var month;
        var day;

        // example: interview_start >= TODATE("2019-03-31")
        if (timePeriod.hasOwnProperty('startDateString') && timePeriod.startDateString) {
            expression.push(qId + '>=TODATE("' + timePeriod.startDateString + '")');
        }

        if (timePeriod.hasOwnProperty('endDate') && timePeriod.endDateString) {
            expression.push(qId + '<=TODATE("' + timePeriod.endDateString + '")');
        }

        return expression.join(' AND ');
    }

    /**
     * @description function to generate a script expression to filter by selected time period
     * @param {Object} context
     * @returns {String} filter script expression
     */
    static function getCurrentWaveExpression(context) {

        var log = context.log;

        if (isWaveFilterHidden(context)) {
            return '';
        }

        var qId = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var selectedCodes = ParamUtil.GetSelectedCodes(context, 'p_Wave');

        if (selectedCodes.length) {
            return getFilterExpressionByAnswerRange(context, qId, [selectedCodes[0]]); // wave filter shouldn't support multiple selection
        }

        return '';
    }

    /**
     * not empty comments filter
     * @param {context}
     * @param {Array} question list
     * @returns {string} filter expression
     */
    static function notEmptyCommentsFilter(context, questions) {

        var expressions = [];

        for (var i = 0; i < questions.length; i++) {

            var qid = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(questions[i]);
            expressions.push('NOT ISNULL(' + qid + ') AND ' + qid + ' != "" AND ' + qid + ' != " "');
        }
        return expressions.join(' OR ');
    }

    /**
     * not empty comments filter
     * @param {context}
     * @param {string} KPIGroupName: KPIPositiveAnswerCodes, KPINegativeAnswerCodes (as in Config)
     * @returns {string} filter expression
     */
    static function filterByKPIGroup(context, KPIGroupName) {

        var kpiQids = ParamUtil.GetSelectedCodes(context, 'p_QsToFilterBy');
        var kpiQidsConfig = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_KPI', 'KPI');
        var kpiQidsConfig = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_KPI', 'KPI');
        var qId;

        if (kpiQidsConfig.length == 1) {
            qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(kpiQidsConfig[0]);
        } else {
            qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(kpiQids[0]);
        }
        var answerCodes = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_KPI', KPIGroupName);

        return getFilterExpressionByAnswerRange(context, qId, answerCodes);

    }

    /**
     * filter by particular project in pulse program
     * @param {context} {state: state, report: report}
     * @param {string}
     * @returns {string} filter expression
     */
    static function projectSelectorInPulseProgram(context) {

        var log = context.log;
        var pidsFromPageContext = context.pageContext.Items['p_projectSelector'];
        var selectedPids = [];

        if (DataSourceUtil.isProjectSelectorNotNeeded(context)) {
            return '';
        }

        if (pidsFromPageContext) {
            selectedPids = JSON.parse(pidsFromPageContext);
        } else {
            selectedPids = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
        }

        return Filters.getFilterExpressionByAnswerRange(context, SystemConfig.pulseSurveyID, selectedPids);
    }

    /**
     * @description function to generate a script expression to filter by particular project
     * @param {Object} context
     * @param {String} projectId
     * @returns {String} filter script expression
     */
    static function getProjectExpression(context, projectId) {

        return 'source_projectid = "' + projectId + '"';
    }

    /**
     * benchmark table may have references to previous wave and to upper hierarchy levels so they are excluded from the table,
     * but for base clac we still need them
     * @param {context} {state: state, report: report}
     * @param {string} hierLevel
     * @param {string} waveId
     * @param {string} projectId
     * @returns {string} filter expression
     */

    static function getFilterForBenchmarkTableColumns(context, hierLevel, waveId, projectId, excludeDirectReportFilter) {

        var log = context.log;

        var excludedFilters = [];

        var waveQId = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');

        var hierFilter = hierLevel ? HierarchyUtil.getHierarchyFilterExpressionForNode(context, hierLevel) : HierarchyUtil.getHierarchyFilterExpressionForCurrentRB(context); // '' if hierarchy is not defined
        var waveFilter = waveId ? getFilterExpressionByAnswerRange(context, waveQId, [waveId]) : getCurrentWaveExpression(context);
        var projectFilter = projectId ? getProjectExpression(context, projectId) : projectSelectorInPulseProgram(context);
        var directReportFilter = excludeDirectReportFilter ? '' : Filters.getDirectFilterExpression(context);

        if(projectFilter) {
            excludedFilters.push(projectFilter);
        }

        if (hierFilter) {
            excludedFilters.push(hierFilter);
        }

        if (waveFilter) {
            excludedFilters.push(waveFilter);
        }

        if(directReportFilter) {
            excludedFilters.push(directReportFilter);
        }

        return excludedFilters.join(' AND ');
    }

    /**
     * function returns hierarchy based filter expression for pulse survey selector drop down
     * @param {Object} context
     * @returns {String} filter expression
     */
    static function getPulseSurveyData_FilterByHierarchy(context) {

        var user = context.user;
        var showAll = ParamUtil.GetSelectedCodes(context, 'p_ShowAllPulseSurveys').length; // there's only one answer showAll (len=1) or not (len =0)

        if (showAll) {
            return '';
        }

        var expr = '';

        if (user.UserType === ReportUserType.Confirmit) { // for tests
            var bases = user.PersonalizedReportBase;
            expr = 'CreatedByEndUserName = ""';
        } else {
            expr = 'CreatedByEndUserName = "' + user.UserId + '"';
        }

        return expr;
    }


    /**
     * @author - EkaterinaT
     * @example - Filters.currentUsername({user:user, log: log})
     * @description - filter for custom table UserRoles that has Username field, needed to define ViewerManager role
     * @param {Object} context
     * @returns {string} filter expression
     */
    static function currentUsername(context) {

        var log = context.log;
        var surveyConfig = DataSourceUtil.getSurveyConfig(context);
        var str = surveyConfig.hasOwnProperty('UserRolesTabeleDsId') ? 'Username = "'+context.user.UserId+'"' : '';
        return str;


    }



    /**
     * @description function indicating if the direct filter is needed or not
     * @author - IrinaK
     * @param {Object} context
     * @returns {Boolean} true or false
     */
    static function isDirectFilterEnabled(context) {

        var log = context.log;

        var isDirectFilterEnabled_MainConfig = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'isDirectFilterEnabled');
        var isDirectFilterEnabled_AccessConfig = Access.isElementAllowed(context, "DirectReportsFilter", "Controls", 'direct filter'); //RBI-130

        return isDirectFilterEnabled_MainConfig && isDirectFilterEnabled_AccessConfig;
    }

    /**
     * @description function to generate a script expression to filter by node without children
     * @author - IrinaK
     * @param {Object} context
     * @returns {String} filter script expression
     */
    static function getDirectFilterExpression(context) {

        var log = context.log;
        var user = context.user;

        if (!isDirectFilterEnabled(context)) {
            return '';
        }

        var selectedCodes = ParamUtil.GetSelectedCodes(context, 'p_DirectFilter');
        var hierarchyQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');

        var reportBase = user.PersonalizedReportBase.split(',');
        var allSelectedHierarchyLevels = '"' + reportBase[0] + '"';
        for (var i = 1; i < reportBase.length; i++) {
            allSelectedHierarchyLevels = allSelectedHierarchyLevels + ',' + '"' + reportBase[i] + '"';
        }

        if (selectedCodes[0] == 'Direct nodes') {
            return 'IN(' + hierarchyQId + ',' + allSelectedHierarchyLevels + ')';
        }
        return '';
    }
}
