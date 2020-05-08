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
        }
      	return toShow;
      } 
      
      return true;
    }
  
}