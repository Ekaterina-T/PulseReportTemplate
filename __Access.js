class Access {

    /**
    * @memberof Access
    * @function isQuestionAllowed
    * @description function checks if question is allowed for current user
    * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
    * @returns {Boolean}
    */
    static function isQuestionAllowed(qid, context) {
      
      var log = context.log;
      var questionsConfig = AccessConfig.Questions;
      
      if(questionsConfig.hasOwnProperty(qid)) {
        
        var questionAccessRules = questionsConfig[qid];
        var toShow = (questionAccessRules.show == 'visible') ? true : false;
        var exceptions = questionAccessRules.exception;
        
        for (var i=0; i<exceptions.length; i++) {
          if (exceptions[i] == 'top' && HierarchyUtil.topNodeAssigned(context)) {
            return !toShow;
          }
          else if (exceptions[i] == 'lowest' && HierarchyUtil.allAssignedNodesLowest(context)) {
            return !toShow;
          }
          else if (exceptions[i] == 'topMinusOne' && HierarchyUtilNEW.topMinusOneLevelAssigned(context)) {
            return !toShow;
          }
        }
      	return toShow;
      } 
      
      return true;
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

  /**
  * @memberof Access
  * @function AllFiltersHidden
  * @description function checks if all filters are hidden for current user
  * @param {Object} context {confirmit: confirmit, user: user, state:state, report:report, log: log}
  * @returns {Boolean}
  */
  static function AllFiltersHidden(context) {
      
      var log = context.log;
  
      var filters = Filters.GetGlobalFilterList(context);
      for (var i=0; i<filters.length; i++) {
        if (isQuestionAllowed(filters[i], context)) {
          return false;
        }
      }
      
      return true;
    }
  
}