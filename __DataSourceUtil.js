class DataSourceUtil {

    /*
     * Get current ds id from Config library on basis of p_SurveyType.
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {string} surveyType : ds0
     */

    static function getDsId (context) {

        var state = context.state;
        var report = context.report;
        var log = context.log;
        var surveyType;  // selected survey

        if (!state.Parameters.IsNull('p_SurveyType')) {
            surveyType = state.Parameters.GetDataSourceNodeId("p_SurveyType");
        } else {
            surveyType = getDefaultDSFromConfig(context);
        }

        return surveyType;
    }

    /*
     * Since data source can be hidden (ifHide property is true),
     * need to define 1st not hidden ds as default ds.
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {string} Source ds id
     */

    static function getDefaultDSFromConfig (context) {

        var log = context.log;
        var surveys = Config.Surveys;
        var i = 0;

        while (surveys[i].ifHide && i<= surveys.length) {
            i++;
        }

        return surveys[i].Source;
    }

    /*
     * Get current Project from Config library on basis of p_SurveyType.
     * @param {object} context object with two mandotary fields: state and report
     * @returns {Project}
     */

    static function getProject (context) {

        var state = context.state;
        var report = context.report;

        return report.DataSource.GetProject(getDsId(context));
    }

    /*
     * Get property value for the current project.
     * @param {object} context object with two mandotary fields: state and report
     * @param {string} propertyName
     * @returns {string} property value
     */

    static function getPropertyValueFromConfig (context, propertyName) {

        var state = context.state;
        var log = context.log;
        var surveyType = getDsId(context);
        var surveys = Config.Surveys;
        var i = 0;

        // loop through array of survey configs
        while (i<surveys.length && surveys[i].Source != surveyType) {
            i++;
        }

        //if property not fount throw an error
        if(surveys[i][propertyName] == null) {
            throw new Error('DataSourceUtil.getPropertyValueFromConfig: Property "'+propertyName+'" is not found for ds '+surveyType+'.');
        }

        return surveys[i][propertyName];
    }

    /*
     * Check if surveyType selector should be hidden (only one survey and nothing to switch to) or not.
     * @param {object} context object with three mandotary fields: {state: state, report: report, log: log}
     * @returns {bool} ifHide gives false if Config contains more than one data source.
     */

    static function ifSingleSurveyTypeUsed (context) {

        var surveys = Config.Surveys;
        var ifHide = false;

        if(surveys.length == 1) {
            ifHide = true;
        }

        return ifHide;
    }

    /*
     * Check if there should be project switcher inside data source (for pulse programs).
     * @param {object} context object with three mandotary fields: {state: state, report: report, log: log}
     * @returns {bool} ifHide gives false if Config contains more than one data source.
     */

    static function ifProjectSelectorNotNeeded (context) {

        var log = context.log;
        var project : Project = getProject(context);
        var ifHide = false;

        if (project.GetQuestion('pid') == null) {
            ifHide = true;
        }

        return ifHide;
    }


}