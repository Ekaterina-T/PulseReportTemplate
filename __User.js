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
        var pageContext = context.pageContext;
        var allRoles = [];

        //log.LogDebug(!!pageContext.Items['allUserRoles'])
        //do not calc this many times
        if(!!pageContext.Items['allUserRoles']) {
            //log.LogDebug('user roles from cache')
            return pageContext.Items['allUserRoles'];
        }

        //standard roles
        allRoles = allRoles.concat(user.Roles);

        //roles from User Roles table
        allRoles = allRoles.concat(getRolesFromUserRolesTable(context));

        //super special role
        if(UserUtil.isViewerManager(context)) {
            allRoles = allRoles.concat(SystemConfig.USER_ROLES.VIEWER_MANAGER);
        }

        //hierarchy-based role (additional column)
        if(AccessConfig.hasRolesInHierarchyAdditionalColumn) {
            var additionalColumnName = AccessConfig.additionalColumnName;
            var rolesInHier = HierarchyUtil.getAdditionalNodeValueForCurrentReportBase(context, additionalColumnName);
            allRoles = allRoles.concat(rolesInHier);
        }

        //calculatable custom role
        allRoles = allRoles.concat(UserUtil.getUserCustomRoles(context, AccessConfig.customRoles, allRoles));

        pageContext.Items.Add('allUserRoles', allRoles);

        return allRoles;
    }

    /**
     * @author - EkaterinaT
     * @example - UserUtil.getUserCustomRoles({state: state, report: report, user:user, pageContext: pageContext, log: log, confirmit: confirmit}, [], [])
     * @param {object} context
     * @param {Object} customRoles - custom roles object defined in the Access config {CR1: [], CR2: []}
     * @param {Array} userRoles - all +- standard roles that user has
     * @return {Array} - array of custom roles that user has
     */
    static function getUserCustomRoles(context, customRoles, userRoles) {

        if(!customRoles) {
            customRoles = AccessConfig.customRoles;
        }

        var userCustomRoles = [];

        for(var role in customRoles) {
            var list = customRoles[role];
            var hasRole = true;
            var i = 0;

            while (hasRole && i < list.length) {
                hasRole = hasRole && ArrayUtil.itemExistInArray(userRoles, String(list[i]).toLowerCase());
                i++;
            }

            if(hasRole) {
                userCustomRoles.push(role);
            }
        }

        return userCustomRoles;
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

        if(user.UserType === ReportUserType.Confirmit || user.HasRole(hrRole)) {
            isViewerManager = false;
        } else {
            isViewerManager = !UserUtil.hasRoleInCustomTable(context, hrRole);
        }

        pageContext.Items['isViewerManager'] = isViewerManager;
        return isViewerManager;
    }

    /**
     * @author - EkaterinaT
     * @example - UserUtil.getRolesFromUserRolesTable({state: state, report: report, user:user, pageContext: pageContext, log: log, confirmit: confirmit})
     * @description - this function checks if customTables:CT_EndUserRoles has some role;
     * @param {object} context
     * @return {boolean}
     */
    static function getRolesFromUserRolesTable(context) {

        var log = context.log;
        var report = context.report;
        var usernameFilter = Filters.currentUsername(context);

        if(usernameFilter.length > 0) {
            var userRoles = report.TableUtils.GetRowHeaderCategoryIds('customTables:CT_EndUserRoles');
            return !userRoles.length ? [] : userRoles;
        } else {
            return []; //no table, no role
        }
    }

    /**
     * @author - EkaterinaT
     * @example - UserUtil.hasRoleInCustomTable({state: state, report: report, user:user, pageContext: pageContext, log: log, confirmit: confirmit})
     * @description - this function checks if customTables:CT_EndUserRoles has some role;
     * @param {object} context
     * @param {String} - role to check
     * @return {boolean}
     */
    static function hasRoleInCustomTable(context, role) {

        var log = context.log;
        var report = context.report;
        var usernameFilter = Filters.currentUsername(context);

        if(usernameFilter.length > 0) {
            var userRoles = report.TableUtils.GetRowHeaderCategoryIds('customTables:CT_EndUserRoles');
        } else {
            return false; //no table, no role
        }

        if(!userRoles.length) {
            return false;
        }

        return ArrayUtil.itemExistInArray(userRoles, role);
    }


}