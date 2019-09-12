class Filters {

    /**
     * Get the list of all filters defined on the survey level based on survey data variables
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {Array} - array of questions to filter survey data by (not page specific)
     */
    static function GetSurveyDataFilterList (context) {

        var log = context.log;

        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');
        return !filterFromSurveyData? [] : PulseProgramUtil.excludeItemsWithoutData(context, filterFromSurveyData);
    }

    /**
     * Get the list of all filters defined on the survey level based on background variables
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {Array} - array of questions to filter background data by (not page specific)
     */
    static function GetBackgroundDataFilterList (context) {

        var log = context.log;
        return DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
    }

    /**
     * Get the list of filters defined as custom page levels
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {Array} - array of questions to filter page specific data by
     */
    static function GetPageSpecificFilterList (context) {

        var log = context.log;
        var pageContext = context.pageContext;

        // If the custom source is defined => the global filters cannot be applied
        if (!!pageContext.Items['Source']) {  // i.e. a page with custom source -> can use only custom filters
            return DataSourceUtil.getPagePropertyValueFromConfig (context, pageContext.Items['CurrentPageId'], 'PageSpecificFilters');
        }

        return [];  // i.e. no page specific source => no filters

    }

    /*
   * Get full filter list.
   * @param {object} context object {state: state, report: report, log: log}
   */

    static function

    GetFullFilterList(context) {

        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');

        return filterFromRespondentData.concat(filterFromSurveyData);
    }

    /**
     * Get the list of all filters defined on the survey level (including background and survey data variables)
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {Array} - array of questions to filter both background and survey data by (not page specific)
     */
    static function GetGlobalFilterList (context) {

        var log = context.log;
        var filterFromRespondentData = GetBackgroundDataFilterList (context);
        var filterFromSurveyData = GetSurveyDataFilterList (context);

        return filterFromRespondentData.concat(filterFromSurveyData);
    }

    /**
     * Get list of filters by type:
     * background - global background; survey - global survey data vars, pageSpecific - survey data from pageSpecific ds
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} filtersType - type of filter list
     * @returns {Array} filters - array of questions o filter by
     */
    static function GetFilterListByType (context, filtersType) {

        var log = context.log;

        //if filter type is not set it is either global or pageSpecific
        //page specificness can be defined by context
        if(!filtersType) {
            var isPageSpecific = context.pageSpecific;
            filtersType = isPageSpecific ? 'pageSpecific' : 'global';
        }

        if(filtersType === 'background') {
            return GetBackgroundDataFilterList(context);
        } else if (filtersType === 'survey') {
            return GetSurveyDataFilterList(context);
        } else if (filtersType === 'global'){
            return GetGlobalFilterList (context);
        } else if (filtersType === 'pageSpecific') {
            context.isCustomSource = false;  // to get page specific filters from config we always use main source
            var filters = GetPageSpecificFilterList (context);
            context.isCustomSource = true;   // then set it back to true
            return filters;
        }

        throw new Error('Filters.GetFilterListByType: filter type '+filtersType+' cannot be handled.')
    }

    /**
     * Reset filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     */
    static function ResetAllFilters (context) {

        var log = context.log;

        var filterNames = [];
        var i;

        var filterSurveyLevelParameters = GetGlobalFilterList(context);
        for (i=0; i<filterSurveyLevelParameters.length; i++) {
            filterNames.push('p_ScriptedFilterPanelParameter'+(i+1));
        }

        var filterPageLevelParameters = GetPageSpecificFilterList(context);
        for (i=0; i<filterPageLevelParameters.length; i++) {
            filterNames.push('p_ScriptedPageFilterPanelParam'+(i+1));
        }

        ParamUtil.ResetParameters(context, filterNames);

        return;
    }

    /**
     * Populate filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {number} paramNum number of filter
     */
    static function populateScriptedFilterByOrder(context, paramNum) {

        var log = context.log;
        var parameter = context.parameter;
        var filterList = GetFilterListByType (context);

        // no question for this parameter placeholder
        if (filterList.length < paramNum) {
            return;
        }

        var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, filterList[paramNum-1]);

        for(var i=0; i<answers.length; i++) {

            var val = new ParameterValueResponse();
            val.StringValue = answers[i].Text;
            val.StringKeyValue = answers[i].Precode;
            parameter.Items.Add(val);
        }

        return;
    }

    /**
     * Hide filter placeholder if there's no filter question.
     * @param {object} context object {state: state, report: report, pageContext: pageContext, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {boolean} indicates if filter exists
     */
    static function hideScriptedFilterByOrder(context, paramNum) {

        var log = context.log;
        var numberOfBackgroundDataFilters = GetBackgroundDataFilterList(context).length;
        var filterList = GetFilterListByType (context);
        var CurrentPageId = PageUtil.getCurrentPageIdInConfig(context);

        // paramNum should be less than number of filter components on all pages
        // paramNum should be less than number of filters based on BG vars on Response Rate page
        if(paramNum > filterList.length || (CurrentPageId === 'Page_Response_Rate' && paramNum >numberOfBackgroundDataFilters)) {
            return true;    // hide
        }

        return false; // don't hide
    }

    /**
     * get filter panel prefix by filtersType
     * @param {Object} context
     * @param {String} filtersType - background - global background; survey - global survey data vars, pageSpecific - survey data from pageSpecific ds
     * @returns {String} filterPrefix: p_ScriptedPageFilterPanelParam or p_ScriptedFilterPanelParameter
     */
    static function GetPanelFilterPrefixByType (context, filtersType) {
        return (filtersType === 'pageSpecific') ? 'p_ScriptedPageFilterPanelParam' : 'p_ScriptedFilterPanelParameter';
    }


    /**
     * Get scripted filter title.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {string} question title
     */
    static function getScriptedFilterNameByOrder(context, paramNum) {

        var log = context.log;
        var filterList = GetFilterListByType (context);

        if(filterList.length >= paramNum) {
            return QuestionUtil.getQuestionTitle(context, filterList[paramNum-1]);
        }

        return '';
    }

    /**
     * @function GeneratePanelFilterExpression
     * @description function to generate filter expression for the 'FilterPanel' filter. Filter parameters can be both single and multi selects
     * @param {Object} context
     * @param {String} filtersType - background - global background; survey - global survey data vars, pageSpecific - survey data from pageSpecific ds
     * @returns {String} filter script expression
     */
    static function GeneratePanelFilterExpression (context, filtersType) {

        var state = context.state;
        var log = context.log;

        var paramName = GetPanelFilterPrefixByType (context, filtersType);
        var bgFilters = GetFilterListByType(context, 'background');
        var filters = (filtersType==='background') ? bgFilters : GetFilterListByType(context, filtersType);
        var startNum = (filtersType==='background') ? 0 : bgFilters.length;
        var filterExpr = [];

        context.isCustomSource = (filtersType === 'pageSpecific') ? true : false;

        for (var i=0; i<filters.length; i++) {

            var paramId = paramName+(i+startNum+1);

            if(!state.Parameters.IsNull(paramId)) {

                // support for multi select. If you need multi-selectors, no code changes are needed, change only parameter setting + ? list css class
                var responses = ParamUtil.GetSelectedCodes(context, paramId);
                var individualFilterExpr = [];
                for (var j=0; j<responses.length; j++) {
                    individualFilterExpr.push('IN('+DataSourceUtil.getDsId(context)+':'+filters[i]+', "'+responses[j]+'")');
                }
                filterExpr.push('('+individualFilterExpr.join(' OR ')+')');
            }

        }

        return filterExpr.join(' AND ');
    }

    /**
     * @function GetFilterValues
     * @description returns selected filter options
     * @param {Object} context
     * @returns {Array} Array of objects {Label: label, selectedOptions: [{Label: label, Code: code}]}
     */
    static function GetFiltersValues (context, filtersType) {

        var log = context.log;

        var filterValues = [];
        var filters = GetFilterListByType (context, filtersType);
        var filterPrefix = GetPanelFilterPrefixByType (context, filtersType);

        for (var i=0; i<filters.length; i++) {
            // support for multi select. If you need multi-selectors, no code changes are needed, change only parameter setting + ? list css class
            var selectedOptions = ParamUtil.GetSelectedOptions(context, filterPrefix+(i+1));
            var filterName = getScriptedFilterNameByOrder(context, i+1);

            if(selectedOptions.length>0) {
                filterValues.push({Label: filterName, selectedOptions: selectedOptions});
            }
        }

        return filterValues;
    }

    /*
    * @function getFilterExpressionByAnswerRange
    * @description function to generate a script expression to filter by options of single question
    * @param {Object} context
    * @param {String} qId - question id
    * @param {Array} answerCodes - the array of answer codes to include
    * @return {String} filter script expression
    */
    static function getFilterExpressionByAnswerRange(context, qId, answerCodes) {

        var state = context.state;
        var report = context.report;
        var log = context.log;

        if (!answerCodes instanceof Array) {
            throw new Error('Filters.getFilterExpressionByAnswerRange: answerCodes is not an array; filter for ' + qId);
        }

        qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(qId);

        if (answerCodes.length) {
            return 'IN(' + qId + ', "'+answerCodes.join('","')+'")';
        }
        return '';
    }

    /*
    * @description function indicationg if time period filter set is needed or not
    * @param {Object} context
    * @return {Boolean} true or false
    */
    static function isTimePeriodFilterHidden(context) {

        return DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'IsTimePeriodFilterHidden')
    }

    /*
    * @description function indicationg if the wave filter is needed or not
    * @param {Object} context
    * @return {Boolean} true or false
    */
    static function

    isWaveFilterHidden(context) {
        var log = context.log;
        return (Boolean)(!DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion'));
    }




    /*
    * @description function to generate a script expression to filter by selected time period
    * @param {Object} context
    * @param {String} qId - date question id
    * @return {String} filter script expression
    */
    static function getTimePeriodFilter(context, qId) {

        var log = context.log;

        if(isTimePeriodFilterHidden(context)) { // date period filter is hidden in pulse programs
            return '';
        }

        var timePeriod = DateUtil.defineDateRangeBasedOnFilters(context);
        var expression = [];
        var year;
        var month;
        var day;

        // example: interview_start >= TODATE("2019-03-31")
        if(timePeriod.hasOwnProperty('startDateString') && timePeriod.startDateString) {
            expression.push(qId+'>=TODATE("'+timePeriod.startDateString+'")');
        }

        if(timePeriod.hasOwnProperty('endDate') && timePeriod.endDateString) {
            expression.push(qId+'<=TODATE("'+timePeriod.endDateString+'")');
        }

        return expression.join(' AND ');
    }


    /*
   * @description function to generate a script expression to filter by selected time period
   * @param {Object} context
   * @return {String} filter script expression
   */
    static function

    getCurrentWaveExpression(context) {

        var log = context.log;

        if (isWaveFilterHidden(context)) {
            return '';
        }

        var qId = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var selectedCodes = ParamUtil.GetSelectedCodes(context, 'p_Wave');

        if (selectedCodes.length) {
            return getFilterExpressionByAnswerRange(context, qId, [selectedCodes[0]]);  // wave filter shouldn't support multiple selection
        }

        return '';

    }


    /*
      * not empty comments filter
      * @param {context}
      * @param {Array} question list
      * @return {string} filter expression
      */

    static function notEmptyCommentsFilter(context, questions) {

        var expressions = [];

        for (var i=0; i<questions.length; i++) {

            var qid = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(questions[i]);
            expressions.push('NOT ISNULL(' + qid + ') AND '+ qid + ' != "" AND ' + qid + ' != " "');
        }
        return expressions.join(' OR ');

    }

    /*
      * not empty comments filter
      * @param {context}
      * @param {string} KPIGroupName: KPIPositiveAnswerCodes, KPINegativeAnswerCodes (as in Config)
      * @return {string} filter expression
      */

    static function filterByKPIGroup(context, KPIGroupName) {

        var kpiQids = ParamUtil.GetSelectedCodes(context, 'p_QsToFilterBy');
        var kpiQidsConfig = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_KPI', 'KPI');
        var qId;


        if (kpiQidsConfig.length == 1) {
            qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(kpiQidsConfig[0]);
        } else {
            qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(kpiQids[0]);
        }
        var answerCodes = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', KPIGroupName);
        return getFilterExpressionByAnswerRange(context, qId, answerCodes);
    }

    /*
	* filter by particular project in pulse program
	* @param {context} {state: state, report: report}
	* @param {string}
	* @return {string} filter expression
    */

    static function projectSelectorInPulseProgram(context) {

        var project : Project = DataSourceUtil.getProject(context);

        if(project.GetQuestion('pid') != null) {
            return 'IN(pid, PValStr("p_projectSelector"))';
        }

        return '';

    }

    /**
     * benchmark table may have references to previous wave and to upper hierarchy levels so they are excluded from the table,
     * but for base clac we still need them
     * @param {context} {state: state, report: report}
     * @param {string} hierLevel
     * @param {string} waveId
     * @return {string} filter expression
     */

    static function

    getHierarchyAndWaveFilter(context, hierLevel, waveId) {

        var log = context.log;

        var excludedFilters = [];
        var hierFilter = hierLevel ? HierarchyUtil.getHierarchyFilterExpressionForNode(context, hierLevel) : HierarchyUtil.getHierarchyFilterExpressionForCurrentRB(context); // '' if hierarchy is not defined
        var waveQId = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var waveFilter = waveId ? getFilterExpressionByAnswerRange(context, waveQId, [waveId]) : getCurrentWaveExpression(context);

        if (hierFilter) {
            excludedFilters.push(hierFilter);
        }

        if (waveFilter) {
            excludedFilters.push(waveFilter);
        }

        return excludedFilters.join(' AND ');
    }

}
