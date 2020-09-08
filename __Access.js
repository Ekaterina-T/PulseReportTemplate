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
            if (isQuestionAllowed(context, filters[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * @memberof Access
     * @function isQuestionAllowed
     * @description function checks if question is allowed for current user
     * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
     * @returns {Boolean}
     */
    static function isQuestionAllowed(context, qid) {

        var log = context.log;
        var questionsConfig = AccessConfig.Questions;

        //question has no special visibility rules
        if(!questionsConfig.hasOwnProperty(qid)) {
            return true;
        }

        var questionAccessRules = questionsConfig[qid];
        var toShow = (questionAccessRules.show == 'visible') ? true : false;
        var exceptions = questionAccessRules.exception;


        for (var i=0; i<exceptions.length; i++) {

            var exception = exceptions[i];

            //hierarchy related exceptions: top, lowes
            if (exception == 'top' && HierarchyUtil.topNodeAssigned(context)) {
                return !toShow;
            }

            if (exception == 'lowest' && HierarchyUtil.allAssignedNodesLowest(context)) {
                return !toShow;
            }

            //role related exceptions
            var roles = UserUtil.getUserRoles(context);
            if(ArrayUtil.itemExistInArray(roles, exception)) {
                return !toShow;
            }
        }
        return toShow;

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