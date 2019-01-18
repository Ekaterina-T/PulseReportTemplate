class Filters {

    /*
     * Reset filter parameters.
     * @param {object} context object {state: state, report: report, log: log}
     */

    static function ResetAllFilters (context) {

        var state = context.state;
        var report = context.report;
        var log = context.log;

        var filterLevelParameters = DataSourceUtil.getPropertyValueFromConfig(context, 'Filters');
        var filterNames = [];
        var i;

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
        var filterList = DataSourceUtil.getPropertyValueFromConfig(context, 'Filters');

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
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {boolean} indicates if filter exists
     */

    static function hideScriptedFilterByOrder(context, paramNum) {

        var filterList = DataSourceUtil.getPropertyValueFromConfig(context, 'Filters');

        if(filterList.length >= paramNum) {
            return false;
        }

        return true;
    }

    /*
     * Get scripted filter title.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} paramNum number of scripted filter
     * @returns {string} question title
     */

    static function getScriptedFilterNameByOrder(context, paramNum) {

        var project : Project = DataSourceUtil.getProject(context);
        var filterList = DataSourceUtil.getPropertyValueFromConfig(context,'Filters');

        if(filterList.length >= paramNum) {
            return QuestionUtil.getQuestionTitle(context, filterList[paramNum-1]);
        }

        return;
    }

}