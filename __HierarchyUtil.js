class HierarchyUtil {

    // cached hierarchy DB table
    // check page initialize script
    static var dbTable : DataTable = new DataTable();

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
     * @function getHierarchyFilterExpressionForNode
     * @description function to form expression for scripted Hierarchy filter for the provided hierarchy node id. Since the global Personalised Filter setting is turned off, custom filter is applied depending on whether a survey has Hierarchy question or not (must be specified in Config)
     * @param {Object} context - {report: report, user: user, state: state, log: log}
     * @param {string} hierarchyNodeId - not mandotary, default value: current report base
     * @returns {String} filter expression.
     */

    static function getHierarchyFilterExpressionForNode (context, hierarchyNodeId) {

        var hierarchyQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');

        if(hierarchyQId && hierarchyNodeId) {
            var bases = hierarchyNodeId.split(',');
            var expr = [];
            for(var i = 0; i < bases.length; i++) {
                expr.push('InHierarchy('+hierarchyQId+',"' + bases[i] + '")');
            }
            return expr.join(' OR ');
        }

        return '';
    }

    /**
     * @memberof HierarchyUtil
     * @function getHierarchyFilterExpressionForCurrentRB
     * @description function to form expression for scripted Hierarchy filter based on current report base. Since the global Personalised Filter setting is turned off, custom filter is applied depending on whether a survey has Hierarchy question or not (must be specified in Config)
     * @param {Object} context - {report: report, user: user, state: state, log: log}
     * @returns {String} filter expression.
     */

    static function getHierarchyFilterExpressionForCurrentRB (context) {

        var hierarchyQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'HierarchyQuestion');

        if(hierarchyQId) {
            var bases = context.user.PersonalizedReportBase.split(','); //multi nodes
            var filterExpr = [];

            for(var i=0; i< bases.length; i++) {
                filterExpr.push(getHierarchyFilterExpressionForNode (context, bases[i]))
            }
            return '(' + filterExpr.join(' OR ') + ')';
        }

        return '';
    }

    /**
     * @memberof HierarchyUtil
     * @function isDataTableEmpty
     * @description check if DB table already populated
     * @returns {Boolean}
     */

    static function isDataTableEmpty() {
        if(dbTable.Rows.Count > 0) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * @memberof HierarchyUtil
     * @function setDataTable
     * @description sets static variable that holds hierarchy data table
     * @param {Object} context {confirmit: confirmit}
     */

    static function setDataTable(context) {

        if(isDataTableEmpty()) {
            var schema : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(Config.schemaId);
            var dbTableNew : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
            dbTable = dbTableNew.GetDataTable();
        }
    }

    /**
     * @memberof HierarchyUtil
     * @function setDataTable
     * @description gets static variable that holds hierarchy data table
     * @returns {Object}
     */
    static function getDataTable() {
        return dbTable;
    }

    /**
     * @memberof HierarchyUtil
     * @function getParentsForHierarchyNode
     * @description gets array of parent nodes for the specified hierarchy node
     * @param {Object} context {confirmit: confirmit, log: log}
     * @param {string} hierarchyNodeId
     * @param {numberOfLevelsUp} number of levels to go up the hierarchy
     * @returns {Array} item of array is an object {parent: parent, label: parentLabel}
     */
    static function getParentsForHierarchyNode(context, hierarchyNodeId, numberOfLevelsUp) {

        var log = context.log;
        var nodeList = {};
        var parentArray = [];
        var rows = dbTable && dbTable.Rows;

        if(!rows || rows.Count === 0) {
            throw new Error('HierarchyUtil.getParentsForHierarchyNode: hierarchy dbTable is not set although requested.');
        }

        //object of all nodes and their parents
        for (var i = 0; i < rows.Count; i++) {
            var row : DataRow = rows[i];
            nodeList[row['id']] = {};
            nodeList[row['id']].label = row['__l9'];
            nodeList[row['id']].parent = !row[Config.relationName] ? row['id'] : row[Config.relationName];
        }

        if(!numberOfLevelsUp) {
            numberOfLevelsUp=rows.Count; // max possible value
        }

        do {
            var currentParent = {};
            var prevNodeId = hierarchyNodeId;

            currentParent.id = nodeList[hierarchyNodeId].parent;
            currentParent.label = currentParent.id ? nodeList[currentParent.id].label : nodeList[hierarchyNodeId].label;
            parentArray.push(currentParent);

            hierarchyNodeId = currentParent.id;
            numberOfLevelsUp-=1;

        } while(hierarchyNodeId && prevNodeId !== hierarchyNodeId && numberOfLevelsUp)

        return parentArray;
    }

    /**
     * @memberof HierarchyUtil
     * @function getParentsForCurrentHierarchyNode
     * @description gets array of parent nodes for the specified hierarchy node
     * @param {Object} context {confirmit: confirmit, log: log}
     * @param {numberOfLevelsUp} number of levels to go up the hierarchy
     * @returns {Array}
     */
    static function getParentsForCurrentHierarchyNode(context, numberOfLevelsUp) {

        var log = context.log;
        var bases = context.user.PersonalizedReportBase.split(','); //multi nodes
        var parents = [];

        for(var i=0; i< bases.length; i++) {
            parents.push(getParentsForHierarchyNode(context, bases[i], numberOfLevelsUp))
        }

        return parents;
    }

    /**
     * @memberof HierarchyUtil
     * @function getParentLevelsForCurrentHierarchyNode
     * @description gets array of levels for parent nodes for the specified hierarchy node
     * @param {Object} context {confirmit: confirmit, log: log}
     * @param {numberOfLevelsUp} number of levels to go up the hierarchy
     * @returns {Array}
     */
    static function getParentLevelsForCurrentHierarchyNode(context, numberOfLevelsUp) {

        var log = context.log;
        var parents = getParentsForCurrentHierarchyNode(context, numberOfLevelsUp);
        var levels = [];

        for(var i=0; i< parents.length; i++) {
            levels.push(parents[i].length+1);
        }

        //log.LogDebug(JSON.stringify(levels))

        return levels;
    }

    /**
     * @memberof HierarchyUtil
     * @function getHierarchyLevelToCompare
     * @description gets BA level from DB table for the current node
     * @param {Object} context {confirmit: confirmit, log: log}
     * @returns {String}
     */
    static function getHierarchyLevelToCompare(context) {

        var log = context.log;
        var level = {};
        var bases = context.user.PersonalizedReportBase.split(','); //multi nodes
        var filteredRow: DataRow[] = dbTable.Select("id='"+ bases[0] +"'");
        
        if (filteredRow.length > 0) 
        {
          level['id'] = filteredRow[0]['upperlevelba'];
          var BARow: DataRow[] = dbTable.Select("id='"+ level['id'] +"'");
          if (BARow.length > 0) {
            level['label'] = BARow[0]['__l9'];
          }
          if (level['id']) return level;
        }
              
      	return null;
    }

    	/**
     * @memberof HierarchyUtil
     * @function isLowestLevelInHierarchyAnyNode
     * @description checks if the specified node is lowest level in hierarchy
     * @param {String} nodeID 
     * @param {Object} context {confirmit: confirmit, log: log}
     * @returns {Boolean} isLowest
     */  
    static function isLowestLevelInHierarchyAnyNode(nodeID, context) {
        
         var rows = dbTable.Rows;
         var isLowest = true;
 
         for (var i = 0; i < rows.Count; i++) {
           var row : DataRow = rows[i];
           if(row[Config.relationName] === nodeID) {
             isLowest = false;
             break;
           }
         }
         return isLowest;
       }
 
       /**
      * @memberof HierarchyUtil
      * @function allAssignedNodesLowest
      * @description checks if all nodes user is assigned to are lowest level in hierarchy
      * @param {Object} context {confirmit: confirmit, user: user, log: log}
      * @returns {Boolean} allLowest
      */  
       static function allAssignedNodesLowest(context) {
         
       var user = context.user;
       var log = context.log;
       
       if (user.UserType == ReportUserType.Confirmit) {
         return false;
       }
       
       var allLowest = true;
       var nodesAssigned = user.GetNodeAssignments();
       for (var i=0; i<nodesAssigned.length; i++) {

         var nodeId = nodesAssigned[i];
         
         if (isLowestLevel[nodeId] === undefined) {
           isLowestLevel[nodeId] = isLowestLevelInHierarchyAnyNode(nodeId, context);
         }
         if (!isLowestLevel[nodeId]) {
           allLowest = false;
           break;
         }
         
       }
        return allLowest;
       
     }

    /*
      static function getLevel(user) {
        return getParents(user).length;
      }

      static function isLowestLevelInHierarchy(user, confirmit) {
        var reportBase = user.PersonalizedReportBase;
        var rows = dbTable.Rows;
        var isLowest = true;

        for (var i = 0; i < rows.Count; i++) {
          var row : DataRow = rows[i];
          if(row['parent'] === reportBase) {
            isLowest = false;
            break;
          }
        }
        return isLowest;
      }

     */


}
