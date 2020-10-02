class Access {

    /**
     * @memberof Access
     * @function AllFiltersHidden
     * @description function checks if all filters are hidden for current user
     * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
     * @returns {Boolean}
     */
    static function AllFiltersHidden(context) {

        var log = context.log;
        var filters = Filters.GetFilterQuestionsListByType(context);

        for (var i=0; i<filters.length; i++) {
            if (isQuestionAllowed(context, filters[i], 'all filters')) {
                return false;
            }
        }

        return true;
    }

    /**
     * @memberof Access
     * @example Access.isElementAllowed({user:user, state: state, report: report, log: log, pageContext: pageContext}, "elementId", "elementType")
     * @description function checks if question is allowed for current user
     * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
     * @param {String} elementId - id of question or control which is checked
     * @param {String} elementType - 'Questions' or 'Controls' as groups in AccessConfig
     * @returns {Boolean}
     */
    static function isElementAllowed(context, elementId, elementType, from) {

        var log = context.log;
        var pageContext = context.pageContext;

        //do not calc this many times
        var key = 'access_'+elementType+'_'+elementId;

        if(!!pageContext.Items[key]) {
            return pageContext.Items[key];
        }

        var elementConfig = getAccessConfigForElement(context, elementId, elementType);
        var isEntityAllowed  = Access.isEntityAllowed(context, elementConfig, from);
        pageContext.Items[key] = isEntityAllowed;

        return isEntityAllowed
    }


    /**
     * @author EkaterinaT
     * @example Access.getAccessConfigForElement({user:user, state: state, report: report, log: log, pageContext: pageContext}, "elementId", "elementType")
     * @description function gets access config for particular question or control
     * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
     * @param {String} elementId - id of question or control which is checked
     * @param {String} elementType - 'Questions' or 'Controls' as groups in AccessConfig
     * @returns {Object}: null or {show: 'hidden/visible', exception: [roles]}
     */
    static function getAccessConfigForElement(context, elementId, elementType) {

        var log = context.log;
        var elementConfig;

        switch(elementType) {
            case 'Questions': elementConfig = AccessConfig.Questions; break;
            case 'Controls': elementConfig = AccessConfig.Controls; break;
        }

        if(!elementConfig) {
            throw new Error("Access.isElementAllowed: unknown elementType");
        }

        //element has no special visibility rules
        if(!elementConfig.hasOwnProperty(elementId)) {
            return null;
        }

        return elementConfig[elementId];
    }

    /**
     * @memberof Access
     * @author EkaterinaT
     * @function isQuestionAllowed
     * @description function checks if validated entity is allowed for current user based on its access Rules
     * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
     * @param {Object} accessRules {show: ['visible' || 'hidden'], exception: ['Role']}
     * @returns {Boolean}
     */
    static function isEntityAllowed(context, accessRules, from) {

        var log = context.log;
        var user = context.user;

        //prof users see everything, if elem is not described in config -> show it
        if(user.UserType === ReportUserType.Confirmit || !accessRules) {
            return true;
        }

        var toShow = accessRules.show == 'visible' ? true : false;
        var exceptions = accessRules.exception;//role related exceptions

        //log.LogDebug('from='+from)

        var roles = UserUtil.getUserRoles(context);

        for (var i=0; i<exceptions.length; i++) {

            var exception = exceptions[i].toLowerCase();

            //hierarchy related exceptions: top, lowest
            if (exception == 'top' && HierarchyUtil.topNodeAssigned(context)) {
                return !toShow;
            }

            if (exception == 'lowest' && HierarchyUtil.allAssignedNodesLowest(context)) {
                return !toShow;
            }

            if(ArrayUtil.itemExistInArray(roles, exception)) {
                return !toShow;
            }
        }

        return toShow;
    }

    /**
     * @deprecated - isElementAllowed should be used instead, remains in old code as no time to re-qa
     * @memberof Access
     * @function isQuestionAllowed
     * @description function checks if question is allowed for current user
     * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
     * @returns {Boolean}
     */
    static function isQuestionAllowed(context, qid, from) {

        var log = context.log;
        var questionsConfig = AccessConfig.Questions;

        //question has no special visibility rules
        if(!questionsConfig.hasOwnProperty(qid)) {
            return true;
        }

        return isEntityAllowed(context, questionsConfig[qid], from)
    }


    /**
     * @memberof Access
     * @function hideHierarchyFilter
     * @description function checks if hierarchy selector should be hidden for current user
     * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
     * @returns {Boolean}
     */
    static function hideHierarchyFilter(context) {

        var log = context.log;
        var user = context.user;

        var nodesAssigned = user.GetNodeAssignments();

        if (nodesAssigned.length == 1 && HierarchyUtil.allAssignedNodesLowest(context)) {
            return true;
        }

        return false;
    }


}