class UserUtil {

    /**
     * @param {object} context {}
     * @param {Array} list of valid roles (from Config)
     * @return {boolean}
     */
    static function isUserValidForSurveybyRole(context, validRoles, from) {

        var log = context.log;
        var user = context.user;

        //confirmit user (has access to all surveys for QA) or survey is available for all end users (validRoles is null)
        if(user.UserType === ReportUserType.Confirmit || !validRoles) {
            return true;
        }

        // survey is not available for any role
        if(validRoles.length === 0) {
            return false;
        }

        for(var i=0; i<validRoles.length; i++) {
            if(user.HasRole(validRoles[i])) {
                return true;
            }
        }
        return false;

    }

    /**
     * @author - EkaterinaT
     * @example - UserUtil.getUserRoles({state: state, report: report, user:user, pageContext: pageContext, log: log, confirmit: confirmit})
     * @description - get full list of user roles: from end user permissions + any calc-ed role
     * @param {object} context
     * @return {Array} array of user roles both hardcoded in permissions and calculated
     */
    static function getUserRoles (context) {

        var log = context.log;
        var user = context.user;
        var roles = [];

        if(UserUtil.isViewerManager(context)) {
            roles = [SystemConfig.USER_ROLES.VIEWER_MANAGER].concat(user.Roles);
        }

        return roles;
    }

    /**
     * @author - EkaterinaT
     * @example - UserUtil.isViewerManager({state: state, report: report, user:user, pageContext: pageContext, log: log, confirmit: confirmit})
     * @description - function checks if user a ViewerManager or not (has 'hr' role in end user permissions or has hr role in UserRoles table in hub)
     * @param {object} context
     * @return {boolean}
     */
    static function isViewerManager (context) {

        var user = context.user;
        var log = context.log;
        var pageContext = context.pageContext;

        //do not calc this many times
        if(!!pageContext.Items['isViewerManager']) {
            return pageContext.Items['isViewerManager'];
        }

        var isViewerManager = true;
        var hrRole = SystemConfig.USER_ROLES.HR;

        if(user.HasRole(hrRole)) {
            isViewerManager = false;
        } else {
            isViewerManager = !UserUtil.hasRoleInCustomTable(context, hrRole);
        }

        pageContext.Items['isViewerManager'] = isViewerManager;
        return isViewerManager;
    }

    /**
     * @author - EkaterinaT
     * @example - UserUtil.hasHRRoleInCustomTable({state: state, report: report, user:user, pageContext: pageContext, log: log, confirmit: confirmit})
     * @description - this function checks if customTables:CT_EndUserRoles has some role;
     * @param {object} context
     * @return {boolean}
     */
    static function hasRoleInCustomTable(context, role) {

        var log = context.log;
        var report = context.report;
        var userRoles = report.TableUtils.GetRowHeaderCategoryIds('customTables:CT_EndUserRoles');

        if(!userRoles.length) {
            return false;
        }

        return ArrayUtil.itemExistInArray(userRoles, role);
    }


}