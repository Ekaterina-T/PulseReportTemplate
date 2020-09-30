class HierarchyUtil {

    // cached hierarchy DB table
    // check page initialize script
    static var dbTable : DataTable = new DataTable();
    static var isLowestLevel = {};    
    static var topNode = "";

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

            saveTopNode(context);
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
     * @function saveTopNode
     * @description saves top hierarchy node to static var topNode
     * @param {Object} context {confirmit: confirmit, log: log}
     */
    static function saveTopNode(context) {

        var log = context.log;
        var rows = dbTable && dbTable.Rows;

        if(!rows || rows.Count === 0) {
            throw new Error('HierarchyUtil.getParentsForHierarchyNode: hierarchy dbTable is not set although requested.');
        }

        for (var i = 0; i < rows.Count; i++) {
            var row : DataRow = rows[i];
            if(!row[Config.relationName]) {
                topNode = row['id'];
                break;
            }
        }
    }

    /**
     * @memberof HierarchyUtil
     * @function getParentsForHierarchyNode
     * @description gets array of parent nodes for the specified hierarchy node
     * In case there's no parent for the node (or it's a top node), the same element is added as a parent to avoid having 'null' in array
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
     * @description gets benchmark level from DB table/HM for the current node
     * @param {Object} context {confirmit: confirmit, log: log}
     * @returns {Object}
     */
    static function getHierarchyLevelToCompare(context) {

        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var level = {};

        var bases = context.user.PersonalizedReportBase.split(','); //multi nodes
        var benchColumn = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'HierarchyBenchmarkDBColumn');
        var colName = benchColumn.name;
        var colType = benchColumn.type;        
        if (colType == "HMcolumn" || colType == "DDcolumn") colName = "__l9" + colName;
      
        var schema : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(Config.schemaId);
        var dbTableNew : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
        var StringColl = dbTableNew.GetColumnValues(colName, 'id', bases[0]);
      
        if (StringColl.Count > 0) 
        {
          level['id'] = StringColl[0];
          var BARow: DataRow[] = dbTable.Select("id='"+ level['id'] +"'");
          if (BARow.length > 0) {
            level['label'] = BARow[0]['__l9'];
            return level;
          }
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

       setDataTable(context); //temp for using in page hide scripts
       
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

     /**
     * @memberof HierarchyUtil
     * @function topNodeAssigned
     * @description checks if user is assigned to top level of hierarchy
	 * @param {Object} context {confirmit: confirmit, user: user, log: log}
     * @returns {Boolean} 
     */  
  	static function topNodeAssigned(context) {
        
        var user = context.user;
        var log = context.log;
        
        if (user.UserType == ReportUserType.Confirmit) {
          return true;
        }
        
        setDataTable(context); //temp for using in page hide scripts

        var nodesAssigned = user.GetNodeAssignments();
        for (var i=0; i<nodesAssigned.length; i++) {
          var nodeId = nodesAssigned[i];
          if (nodeId == topNode) {
            return true;
          }
        }
      return false; 
    }

    /**
     * @memberof HierarchyUtil
     * @function isTopMinusOneLevel
     * @description checks if the specified node is top-1 level in hierarchy
     * @param {String} nodeID 
     * @param {Object} context {confirmit: confirmit, log: log}
     * @returns {Boolean} 
     */  
    static function isTopMinusOneLevel(nodeID, context) {
      
      var log = context.log;

      var row: DataRow[] = dbTable.Select("id='"+ nodeID +"'");
      if (row.length > 0) {
        if (row[0][Config.relationName] === topNode){
          return true;
        }
      }
      return false;
    }
  
  /**
   * @memberof HierarchyUtil
   * @function topMinusOneLevelAssigned
   * @description checks if user is assigned to top-1 level of hierarchy
   * @param {Object} context {confirmit: confirmit, user: user, log: log}
   * @returns {Boolean} 
   */  
  static function topMinusOneLevelAssigned(context) {
      
      var user = context.user;
      var log = context.log;
      
      if (user.UserType == ReportUserType.Confirmit) {
        return true;
      }
      
      setDataTable(context); //temp for using in page hide scripts

      var nodesAssigned = user.GetNodeAssignments();
      for (var i=0; i<nodesAssigned.length; i++) {
        var nodeId = nodesAssigned[i];
        if (isTopMinusOneLevel(nodeId, context)) {
          return true;
        }
      }
       return false; 
  }
  

    /**
     * @memberof HierarchyUtil
     * @function getDirectChildren
     * @description gets direct children of the node
     * @param {Object} context {confirmit: confirmit}
     * @param {String} nodeId
     */

    static function getDirectChildren(context, nodeId) {

        var schema : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(Config.schemaId);
        var dbTableNew : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
        var relation = Config.relationName;
        var stringColl = dbTableNew.GetColumnValues('id', relation, nodeId);
        var nodes = [];

        for(var i=0; i<stringColl.Count; i++) {
            nodes.push(stringColl[i]);
        }

        return nodes;
    }

    /**
     * @memberof HierarchyUtil
     * @function getDirectChildren
     * @description gets direct children of the node
     * @param {Object} context {confirmit: confirmit}
     * @param {String} nodeId
     */

    static function getDirectChildrenForCurrentReportBase(context) {

        var log = context.log;
        var bases = context.user.PersonalizedReportBase.split(','); //multi nodes
        var nodes = [];

        for(var i=0; i< bases.length; i++) {
            nodes = nodes.concat(getDirectChildren(context, bases[i]))
        }

        return nodes;
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
