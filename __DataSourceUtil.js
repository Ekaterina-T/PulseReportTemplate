class DataSourceUtil {

    /*
     * Since data source can be hidden (isHidden property is true),
     * need to define 1st not hidden ds as default ds.
     * @param {object} context object {state: state, report: report, user:user, log: log}
     * @returns {string} Source ds id
     */
    static function getDefaultDSFromConfig (context) {

        var log = context.log;
        var surveys = Config.Surveys;
        var i = 0;

        while (i< surveys.length && (surveys[i].isHidden || !User.isUserValidForSurveybyRole(context, surveys[i].AvailableForRoles, 'getDefaultDSFromConfig'))) {
            i++;
        }

        if(i === surveys.length) {
            throw new Error('DataSourceUtil.getDefaultDSFromConfig: No active data sources found in Config for the user.');
        }

        return surveys[i].Source;
    }

    /**
      * Get current ds id from Config library on basis of p_SurveyType.
      * @param {object} context object {state: state, report: report, log: log}
      * @returns {string} surveyType : ds0
      */
     static function getProgramDsId(context) {
        
        var state = context.state;
        var log = context.log;
        
        //ds is defined report-wide
        if (!state.Parameters.IsNull('p_SurveyType')) {
            return state.Parameters.GetDataSourceNodeId("p_SurveyType"); // selected survey/program
        }

        return getDefaultDSFromConfig(context);
    }

    /**
      * Get current page's ds id.
      * In general case matches program ds, but in some cases can dbe different (for built-in Action Planner for instance)
      * @param {object} context object {state: state, report: report, log: log, pageContext: pageContext}
      * @returns {string} surveyType : ds5
      */
     static function getPageDsId(context) {
        
        var log = context.log;
        var pageContext = context.pageContext;

        //ds is defined page-wide
        if (PageUtil.PageHasSpefcificDS(context)) {
            return pageContext.Items['PageSource'];
        }

        return getProgramDsId(context);
    }

    /**
      * Gets ds id for a component, i.e the one to get reportal Project instance 
      * that contains project name, all questions and their information.
      * This is the ds to be used for HeaderSegments and HeaderCategorizations
      * @param {object} context object {state: state, report: report, log: log}getPageDsId(context)
      * @returns {string} surveyType : ds0
      */
    static function getDsId(context) {
        
        var log = context.log;
        var pageContext = context.pageContext;

        //ds is defined for particular element (table for instance)
        if(context['ComponentSource']) { 
            return context['ComponentSource'];
        }   

        //else return page ds id which in turn will go to program ds id if there's no specific page ds specified
        return getPageDsId(context);
    }

    /**
     * Get current Project from Config library on basis of p_SurveyType.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} dsId - optional, if provided project for this dsId is returned
     * @returns {object}
     */
    static function getProject (context, dsId) {
        var report = context.report;
        return !dsId ? report.DataSource.GetProject(getDsId(context)) : report.DataSource.GetProject(dsId);
    }

    /*
     * Get Config object for the current survey.
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {object} config
     */
    static function getSurveyConfig (context) {

        var log = context.log;
        var surveyType = getProgramDsId(context);
        var surveys = Config.Surveys;
        var i = 0;

        // loop through array of survey configs
        while (i<surveys.length && surveys[i].Source != surveyType) {
            i++;
        }
        
        return surveys[i];
    }

    /**
     * Get property value for the current project.
     * @param {object} context object with two mandotary fields: state and report
     * @param {string} propertyName
     * @returns {object|array|string|number} property value
     */
    static function getSurveyPropertyValueFromConfig (context, propertyName) {

        var log = context.log;
        var surveyConfig = getSurveyConfig(context);

        if(surveyConfig[propertyName] === undefined) {
            throw new Error('DataSourceUtil.getSurveyPropertyValueFromConfig: property "'+propertyName+'" is not found. Check Config settings for '+ getProgramDsId(context));
        }

        if(surveyConfig[propertyName]) {
            return surveyConfig[propertyName];
        }

        return null;
    }

    /**
     * Get property value for the current page in the current project.
     * @param {object} context object with two mandotary fields: state and report
     * @param {string} pageId - should match config page property
     * @param {string} propertyName
     * @param {boolean} isMandatory - throw error if prop is not found or not
     * @returns {string} property value
     */
    static function getPagePropertyValueFromConfig(context, pageId, propertyName, isMandatory) {

        var state = context.state;
        var log = context.log;
        var surveyConfig = getSurveyConfig(context);

        if(pageId.indexOf('Page_')<0) {
            pageId = 'Page_'+pageId; // transfrmation to match Config naming convence
        }

        if(surveyConfig.hasOwnProperty(pageId) && surveyConfig[pageId].hasOwnProperty(propertyName)) {
            return surveyConfig[pageId][propertyName];
        }

        //property is not found but it's mandatory for that case
        if(isMandatory) {
            throw new Error('DataSourceUtil.getPagePropertyValueFromConfig: property "'+propertyName+'" is not found. Check Config settings for page "'+pageId+'", '+ getProgramDsId(context));
        }

        return null;

    }

    /*
     * Get property value from config. Performs double check: if a property exists on a page level, get it from the page config.
     * Otherwise, search this property among global settings in project config
     * @param {object} context object with two mandotary fields: state and report
     * @param {string} pageId - should match config page property
     * @param {string} propertyName
     * @returns {string} property value
     */
    static function getPropertyValueFromConfig (context, pageId, propertyName) {

        var log = context.log;
        var value = getPagePropertyValueFromConfig (context, pageId, propertyName, false);

        // if the property isn't defined on the page level, grab it from the survey config
        if(!value) {
            value = getSurveyPropertyValueFromConfig (context, propertyName);
        }

        return value;
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

    static function isProjectSelectorNotNeeded (context) {

        var log = context.log;
        var report = context.report;

        context.isCustomSource = false;  // here always use the global source, so reset the custom source property for safety reasons
        var surveyConfig = getSurveyConfig(context);
        var ifHide = false;

        if (!surveyConfig.hasOwnProperty('PulseSurveyData')) { // not pulse program -> hide baby survey selector
            ifHide = true;
        }
        return ifHide;
    }

}
