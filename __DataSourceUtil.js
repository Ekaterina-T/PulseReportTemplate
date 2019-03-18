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

        if (!state.Parameters.IsNull('p_SurveyType')) {
            return state.Parameters.GetDataSourceNodeId("p_SurveyType"); // selected survey
        }

        return getDefaultDSFromConfig(context);
    }

    /*
     * Since data source can be hidden (isHidden property is true),
     * need to define 1st not hidden ds as default ds.
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {string} Source ds id
     */

    static function getDefaultDSFromConfig (context) {

        var log = context.log;
        var surveys = Config.Surveys;
        var i = 0;

        while (surveys[i].isHidden && i<= surveys.length) {
            i++;
        }

        if(i === surveys.length) {
            throw new Error('DataSourceUtil.getDefaultDSFromConfig: No active data sources found in Config.');
        }

        return surveys[i].Source;
    }

    /*
     * Get current Project from Config library on basis of p_SurveyType.
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {object}
     */

    static function getProject (context) {

        var state = context.state;
        var report = context.report;

        return report.DataSource.GetProject(getDsId(context));
    }

    /*
     * Get Config object for the current survey.
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {object} config
     */

    static function getSurveyConfig (context) {

        var state = context.state;
        var log = context.log;
        var surveyType = getDsId(context);
        var surveys = Config.Surveys;
        var i = 0;

        // loop through array of survey configs
        while (i<surveys.length && surveys[i].Source != surveyType) {
            i++;
        }

        return surveys[i];
    }


    /*
     * Get property value for the current project.
     * @param {object} context object with two mandotary fields: state and report
     * @param {string} propertyName
     * @returns {string} property value
     */

    static function getSurveyPropertyValueFromConfig (context, propertyName) {

        var state = context.state;
        var log = context.log;
        var surveyConfig = getSurveyConfig(context);

        if(surveyConfig[propertyName] === undefined) {
            throw new Error('DataSourceUtil.getSurveyPropertyValueFromConfig: property "'+propertyName+'" is not found. Check Config settings for '+getDsId (context));
        }

        if(surveyConfig[propertyName]) {
            return surveyConfig[propertyName];
        }

        return null;
    }

    /*
     * Get property value for the current page in the current project.
     * @param {object} context object with two mandotary fields: state and report
     * @param {string} pageId - should match config page property
     * @param {string} propertyName
     * @returns {string} property value
     */

    static function getPagePropertyValueFromConfig (context, pageId, propertyName) {

        var state = context.state;
        var log = context.log;
        var surveyConfig = getSurveyConfig(context);

        if(pageId.indexOf('Page_')<0) {
            pageId = 'Page_'+pageId; // transfrmation to match Config naming convence
        }

        if(surveyConfig[pageId] === undefined || !surveyConfig[pageId].hasOwnProperty(propertyName)) {
            throw new Error('DataSourceUtil.getPagePropertyValueFromConfig: property "'+propertyName+'" is not found. Check Config settings for page "'+pageId+'", '+getDsId (context));
        }

        return surveyConfig[pageId][propertyName];

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

    static function isProjectSelectorNeeded (context) {  // isProjectSelectorNeeded

        var log = context.log;
        var project : Project = getProject(context);
        var ifHide = false;

        if (project.GetQuestion('pid') == null) { // not pulse program -> hide baby survey selector
            ifHide = true;
        }

        return ifHide;
    }
}