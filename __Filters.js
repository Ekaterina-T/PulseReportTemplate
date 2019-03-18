class Filters {

    /*
     * Reset filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     */

    static function ResetAllFilters (context) {

        var state = context.state;
        var report = context.report;
        var log = context.log;

        var filterLevelParameters = [];
        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');
        var filterNames = [];
        var i;

        filterLevelParameters = filterFromRespondentData.concat(filterFromSurveyData);

        for (i=0; i<filterLevelParameters.length; i++) {
            filterNames.push('p_ScriptedFilterPanelParameter'+(i+1));
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

        var parameter = context.parameter;
        var project : Project = DataSourceUtil.getProject(context);
        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');
        var filterList = filterFromRespondentData.concat(filterFromSurveyData);

        if(filterList.length >= paramNum) {

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
        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');
        var filterList = filterFromRespondentData.concat(filterFromSurveyData);

        // paramNum should be less than number of filter components on all pages
        // paramNum should be less than number of filters based on BG vars on Response Rate page
        if(paramNum > filterList.length || (pageContext.Items['CurrentPageId'] === 'responses' && paramNum >filterFromRespondentData.length)) {
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

        var filterFromRespondentData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');
        var filterFromSurveyData = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'FiltersFromSurveyData');
        var filterList = filterFromRespondentData.concat(filterFromSurveyData);

        if(filterList.length >= paramNum) {
            return QuestionUtil.getQuestionTitle(context, filterList[paramNum-1]);
        }

        return;
    }


    /*
   * @function GeneratePanelFilterExpression
   * @description function to generate filter expression for the 'FilterPanel' filter. Filter parameters can be both single and multi selects
   * @param {Object} context
   * @return {String} filter script expression
   */

    static function GeneratePanelFilterExpression (context) {

        var state = context.state;
        var report = context.report;
        var log = context.log;

        var filterExpr = [];
        var filters = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'Filters');

        for (var i=0; i<filters.length; i++) {

            if(!state.Parameters.IsNull('p_ScriptedFilterPanelParameter'+(i+1))) {

                // although the parameter is multi select, interface allows to pick only one option (quicker to extend if needed)
                var responses = ParamUtil.GetSelectedCodes (context, 'p_ScriptedFilterPanelParameter'+(i+1));
                var individualFilterExpr = [];
                for (var j=0; j<responses.length; j++) {
                    individualFilterExpr.push('IN('+DataSourceUtil.getDsId(context)+':'+filters[i]+', "'+responses[j]+'")');
                }
                filterExpr.push(individualFilterExpr.join(' OR '));
            }

        }
        return filterExpr.join(' AND ');

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

        return !DataSourceUtil.isProjectSelectorNeeded(context) // date period filter is hidden in pulse programs
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

        if(!timePeriod) {
            return '';
        }

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

}