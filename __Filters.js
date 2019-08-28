class Filters {

    /*
    * Get the list of all filters defined on the survey level (including background and survey data variables)


    * @param {object} context object {state: state, report: report, log: log}
    */

    static function GetGlobalFilterList (context) {

        var log = context.log;
        var pageContext = context.pageContext;

        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');

        // Wrapped in try/catch to avoid throwing errors when retrieving pageContext.Items['Source'] when it doesn't exist
        // If the custom source is defined => the global filters cannot be applied
        try {

            if (pageContext.Items['Source'] === undefined) {  // i.e. not a page with custom source
                return filterFromRespondentData.concat(filterFromSurveyData);
            }
            return [];  // page with custom source => only page specific filters, no global ones

        } catch (e) {  // i.e. not a page with custom source
            return filterFromRespondentData.concat(filterFromSurveyData);
        }
    }


    /*
     * Get the list of filters defined as custom page levels
     * @param {object} context object {state: state, report: report, log: log}
     */

    static function GetPageSpecificFilterList (context) {

        var log = context.log;
        var pageContext = context.pageContext;

        // Wrapped in try/catch to avoid throwing errors when retrieving pageContext.Items['Source'] when it doesn't exist
        // If the custom source is defined => the global filters cannot be applied
        try {
            if (pageContext.Items['Source'] != undefined) {  // i.e. a page with custom source -> can use only custom filters
                return DataSourceUtil.getPagePropertyValueFromConfig (context, pageContext.Items['CurrentPageId'], 'PageSpecificFilters');
            }
        } catch (e) {}

        return [];  // i.e. no page specific source => no filters

    }


    /*
     * Get the list of all available filters depending on type
     * @param {object} context object {state: state, report: report, log: log}
     * @param {boolean} isPageSpecificType - true if filter is page specific, false if it is global
     */

    static function GetFilterListByType (context, isPageSpecificType) {

        var log = context.log;

        if (!isPageSpecificType) {
            return GetGlobalFilterList (context);
        }

        context.isCustomSource = false;  // to get page specific filters from config we always use main source
        var filters = GetPageSpecificFilterList (context);
        context.isCustomSource = true;   // then set it back to true
        return filters;
    }

    /*
     * Reset filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     */

    static function ResetAllFilters (context) {

        var state = context.state;
        var report = context.report;
        var log = context.log;

        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');

        var filterLevelParameters = filterFromRespondentData.concat(filterFromSurveyData); //GetFullFilterList (context);
        var filterNames = [];
        var i;

        for (i=0; i<filterLevelParameters.length; i++) {
            filterNames.push('p_ScriptedFilterPanelParameter'+(i+1));
        }

        var filterPageLevelParameters = GetPageSpecificFilterList (context);

        for (i=0; i<filterPageLevelParameters.length; i++) {
            filterNames.push('p_ScriptedPageFilterPanelParam'+(i+1));
        }


        ParamUtil.ResetParameters(context, filterNames);

        return;
    }

    /*
     * Populate filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {number} paramNum number of filter
     */

    static function populateScriptedFilterByOrder(context, paramNum) {

        var log = context.log;
        var parameter = context.parameter;
        var pageContext = context.pageContext;
        var isPageSpecific = context.pageSpecific;


        var filterList = GetFilterListByType (context, isPageSpecific);
        if (filterList.length >= paramNum) {



            var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, filterList[paramNum-1]);

            for(var i=0; i<answers.length; i++) {

                var val = new ParameterValueResponse();
                val.StringValue = answers[i].Text;
                val.StringKeyValue = answers[i].Precode;
                parameter.Items.Add(val);
            }
        }

        return;
    }

    /*
     * Hide filter placeholder if there's no filter question.
     * @param {object} context object {state: state, report: report, pageContext: pageContext, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {boolean} indicates if filter exists
     */

    static function hideScriptedFilterByOrder(context, paramNum) {

        var pageContext = context.pageContext;
        var log = context.log;
        var isPageSpecific = context.pageSpecific;
        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterList = GetFilterListByType (context, isPageSpecific);


        // paramNum should be less than number of filter components on all pages
        // paramNum should be less than number of filters based on BG vars on Response Rate page
        if(paramNum > filterList.length || (pageContext.Items['CurrentPageId'] === 'Response_Rate' && paramNum >filterFromRespondentData.length)) {
            return true;    // hide
        }

        return false; // don't hide
    }

    /*
     * Get scripted filter title.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {string} question title
     */

    static function getScriptedFilterNameByOrder(context, paramNum) {

        var pageContext = context.pageContext;
        var log = context.log;
        var isPageSpecific = context.pageSpecific;
        var filterList = GetFilterListByType (context, isPageSpecific);

        if(filterList.length >= paramNum) {
            return QuestionUtil.getQuestionTitle(context, filterList[paramNum-1]);
        }

        return '';
    }


    /*
   * @function GeneratePanelFilterExpression
   * @description function to generate filter expression for the 'FilterPanel' filter. Filter parameters can be both single and multi selects
   * @param {Object} context
   * @return {String} filter script expression
   */

    static function GeneratePanelFilterExpression (context, isPageSpecific) {

        var state = context.state;
        var report = context.report;
        var log = context.log;
        var pageContext = context.pageContext;

        var filterExpr = [];
        var filters = isPageSpecific ? GetPageSpecificFilterList(context) : GetGlobalFilterList (context);
        var paramName = isPageSpecific ? 'p_ScriptedPageFilterPanelParam' : 'p_ScriptedFilterPanelParameter';

        context.isCustomSource = isPageSpecific ? true : false;

        for (var i=0; i<filters.length; i++) {

            if(!state.Parameters.IsNull(paramName+(i+1))) {

                // support for multi select. If you need multi-selectors, no code changes are needed, change only parameter setting + ? list css class
                var responses = ParamUtil.GetSelectedCodes (context, paramName+(i+1));
                var individualFilterExpr = [];
                for (var j=0; j<responses.length; j++) {
                    individualFilterExpr.push('IN('+DataSourceUtil.getDsId(context)+':'+filters[i]+', "'+responses[j]+'")');
                }                
		filterExpr.push('('+individualFilterExpr.join(' OR ')+')'); 
            }

        }
        return filterExpr.join(' AND ');

    }


    /*
   * @function GenerateGlobalPanelFilterExpression
   * @description function to generate filter expression for the 'FilterPanel' filter. Filter parameters can be both single and multi selects
   * @param {Object} context
   * @return {String} filter script expression
   */

    static function GenerateGlobalPanelFilterExpression (context) {

        return GeneratePanelFilterExpression (context, false);

    }



    /*
  * @function GeneratePageSpecificPanelFilterExpression
  * @description function to generate custom filter expression for the 'FilterPanel' filter.
  * Filter script is applied only to pages which have a custom property Source and page specific filters
  * Filter parameters can be both single and multi selects
  * @param {Object} context
  * @return {String} filter script expression
  */

    static function GeneratePageSpecificPanelFilterExpression (context) {

        return GeneratePanelFilterExpression (context, true);

    }



    /*
   * @function GetFilterValues
   * @description function to generate filter expression for the 'FilterPanel' filter. Filter parameters can be both single and multi selects
   * @param {Object} context
   * @return {Array} Array of objects {Label: label, selectedOptions: [{Label: label, Code: code}]}
   */

    static function GetFiltersValues (context) {

        var state = context.state;
        var report = context.report;
        var log = context.log;

        var filterValues = [];
        var filters = GetGlobalFilterList (context);

        for (var i=0; i<filters.length; i++) {

            // support for multi select. If you need multi-selectors, no code changes are needed, change only parameter setting + ? list css class
            var selectedOptions = ParamUtil.GetSelectedOptions(context, 'p_ScriptedFilterPanelParameter'+(i+1));
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
	    
        if(!(answerCodes instanceof Array)) {
            throw new Error('Filters.getFilterExpressionByAnswerRange: answerCodes is not an array; filter for '+qId);
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
    static function isWaveFilterHidden(context) {
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
    static function getCurrentWaveExpression (context) {



        var log = context.log;

        if(isWaveFilterHidden(context)) {
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
        var kpiQidsConfig = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', 'KPI');
        var qId;


        if (kpiQidsConfig.length == 1) {
            qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(kpiQidsConfig[0]);
        } else {
            qId = QuestionUtil.getQuestionIdWithUnderscoreInsteadOfDot(kpiQids[0]);
        }
        var answerCodes = DataSourceUtil.getPagePropertyValueFromConfig (context, 'Page_KPI', KPIGroupName);

        return getFilterExpressionByAnswerRange(context, qId, answerCodes);

    }


    /**
	* filter by particular project in pulse program
	* @param {context} {state: state, report: report}
	* @param {string}
	* @return {string} filter expression
    */

    static function projectSelectorInPulseProgram(context) {

        if(!DataSourceUtil.isProjectSelectorNeeded(context) {

            if(!context.state.Parameters.IsNull('p_projectSelector') {
                return 'IN(pid, PValStr("p_projectSelector"))';
            } else {
                var defaultVal = ParamUtil.getDefaultParameterValue(context, 'p_projectSelector');
                return 'pid = "' + defaultVal + '"';
            }
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

    static function getHierarchyAndWaveFilter(context, hierLevel, waveId) {

        var log = context.log;

        var excludedFilters = [];
        var hierFilter = hierLevel ? HierarchyUtil.getHierarchyFilterExpressionForNode (context, hierLevel) : HierarchyUtil.getHierarchyFilterExpressionForCurrentRB (context); // '' if hierarchy is not defined
        var waveQId = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var waveFilter = waveId ? getFilterExpressionByAnswerRange(context, waveQId, [waveId]) : getCurrentWaveExpression (context);

        if(hierFilter) {
            excludedFilters.push(hierFilter);
        }

        if(waveFilter) {
            excludedFilters.push(waveFilter);
        }

        return excludedFilters.join(' AND ');
    }

    /**
     * function returns hierarchy based filter expression for pulse survey selector drop down
     * @param {Object} context
     * @returns {String} filter expression
     */
	
    static function getPulseSurveyData_FilterByHierarchy(context) {

        var showAll = ParamUtil.GetSelectedCodes(context, 'p_ShowAllPulseSurveys').length; // there's only one answer showAll (len=1) or not (len =0)
        return !showAll ? Filters.getFilterExpressionByAnswerRange(context, 'CreatedByUserHierarchyNodeId', [context.user.PersonalizedReportBase]) : '';
    }

}
