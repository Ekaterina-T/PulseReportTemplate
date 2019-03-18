class HierarchyUtil {

    /**
     * @memberof HierarchyUtil
     * @function Hide
     * @description function to hide the Hierarchy component depending on Config settings
     * @param {Object} context - {report: report, state: state, log: log}
     * @returns {Boolean}
     */

    static function Hide(context){

        var hierarchyQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');

        if(hierarchyQId) {
            return false;
        }

        return true;
    }



    /**
     * @memberof HierarchyUtil
     * @function getHierarchyFilterExpression
     * @description function to form expression for scripted Hierarchy filter. Since the global Personalised Filter setting is turned off, custom filter is applied depending on whether a survey has Hierarchy question or not (must be specified in Config)
     * @param {Object} context - {report: report, user: user, state: state, log: log}
     * @returns {String} filter expression. If no hierarchy is specified for a survey in Config, an empty string will be returned.
     */

    static function getHierarchyFilterExpression (context) {

        var hierarchyQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');

        if(hierarchyQId) {
            return 'INHIERARCHY('+hierarchyQId+',"' + context.user.PersonalizedReportBase + '")';
        }

        return '';

    }



}