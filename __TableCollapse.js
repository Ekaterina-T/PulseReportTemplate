class cfg
{
  static var databaseSchema = Config.schemaId;
  static var hierTable = Config.tableName;
  static var hierParentColumn = Config.relationName;
  static var hier = [];
}

class TableCollapse 
{

  //setup collapsible structure for table without hierarchy
  static function setupCollapsibleTable(table, divId, text, report, confirmit) 
  {
    var headers = report.TableUtils.GetRowHeaderCategoryTitles(table); // table row header titles
    var hier = [], parentName = [], parentId = [], levels, diff;
    // iterate through table rows
    for (var i=0; i<headers.length; i++) {
      diff = i>0 ? levels-(headers[i].length-1) : 0;  // difference in N of levels with previous row
      levels = headers[i].length-1;                   // N of levels in current row
      if (i==0 || diff!=0) for (var j=levels; j>=0; j--) {parentName[j]=''; parentId[j]='';}  // reset all parents if N of levels changed
      // iterate through hier levels
      for (var j=levels; j>=0; j--) {
        if (parentName[j]==headers[i][j]) continue; // skip if current row has the same parent at j-level as previous one
        else {                                      // current row has different parent
          parentName[j] = headers[i][j];                                 // set new parent for j-level 
          for (var k=j-1; k>=0; k--) {parentName[k]=''; parentId[k]='';} // reset parents for lower levels
        }
        if (j<levels && parentId[j]=='') parentId[j]=hier.length;  // set unique parentID for j-level of current hier brunch, no parent for top level
        addElement(hier, hier.length+1, parentId[j], levels-j, j); // add element to hier array
       }
    }
    //call setTableCollapse() function for table 
    printHierScript(hier,divId,text);
  }
  
  //setup collapsible structure for table with flat hierarchy (no other headers)
  static function setupCollapsibleTable_Hier(table, divId, text, report, confirmit) 
  {
    if (cfg.hier.length==0) getHier(confirmit);                     // get hier from DB designer
    var headers = report.TableUtils.GetRowHeaderCategoryIds(table); // table row header ids
    var hier = []; 
    // iterate through table rows
    for (var i=0; i<headers.length; i++) {
      var parent = cfg.hier[headers[i][0]], level = 0;  // set parent & level for current row
      if (i>0 && parent==hier[i-1].id) {  // if current row is the child of previous one
        level = hier[i-1].level+1;        // change the level for current row to level of previous row + 1
        hier[i-1].hasChildren = true;     // previous row has children
      }
      else {                              // if current row is not the child of previous one
        for (var j=i-1; j>=0; j--)        // iterate through previous rows to define level for current row
          if (parent==hier[j].parent) {level = hier[j].level; break;} 
      }
      addElement(hier, headers[i][0], parent, level, 0); // add element to hier array
    }
    //call setTableCollapse() function for table 
    printHierScript(hier,divId,text);
  }

  //setup collapsible structure for table with flat\nested hierarchy and with 1 subheaders level
  static function setupCollapsibleTable_HierMix(table, divId, text, report, confirmit) 
  {
    if (cfg.hier.length==0) getHier(confirmit);                     // get hier from DB designer
    var headers = report.TableUtils.GetRowHeaderCategoryIds(table); // table row header ids
    var hier = []; 
    var i=0, levels, diff, parent, level, child;
    // iterate through table rows
    while (i<headers.length) {
      diff = i>0 ? levels-(headers[i].length-1) : 0;  // difference in N of levels (for unbalanced hier) with previous row
      levels = headers[i].length-1;                   // N of levels for hier brunch in current row
      // iterate through hier levels
      for (var j=levels; j>0; j--) {
        if (i>0 && j+diff>0 && headers[i][j]==headers[i-1][j+diff]) continue;  // skip if current row has the same hier node as previous one
        parent = cfg.hier[headers[i][j]];  // set parent for current row
        if (i==0 && j==levels) level = 0;  // top node
        else {                              
          if (parent==hier[hier.length-1].id) {      // if current row is the child of previous one
            level = hier[hier.length-1].level+1;     // change the level for current row to level of previous row + 1
            hier[hier.length-1].hasChildren = true;  // previous row has children
          }
          else {                                     // if current row is not the child of previous one
            for (var k=hier.length-1; k>=0; k--)     // iterate through previous rows to define level for current hier node
              if (parent==hier[k].parent) {level = hier[k].level; break;}
          }
        }
        addElement(hier, headers[i][j], parent, level, j); // add hier element to hier array
      }
      // iterate through subheaders of the current hier node
      child=1; 
      parent=hier.length-1;
      for (var k=i; k<headers.length; k++) {
        addElement(hier, hier[parent].id+'_'+child, hier[parent].id, hier[parent].level+1, 0); // add subheader element to hier array
        hier[parent].hasChildren = true;                                                       // hier node always has children
        if (k==headers.length-1 || headers[k][1]!=headers[k+1][1]) break;                      // table end or parent change
        else child++;
      }
     i+=child;
    }    
    //call setTableCollapse() function for table 
    printHierScript(hier,divId,text);
  }
  
  // get hier from DB designer - set hier[id]=parentId
  private static function getHier(confirmit) 
  {
    var db = confirmit.GetDBDesignerSchema(cfg.databaseSchema);
    var t = db.GetDBDesignerTable(cfg.hierTable);
    var rows = t.GetDataTable().Rows;
    var hier = []; 
    for (var i=0; i<rows.Count; i++) hier[rows[i]['id'].toLowerCase()] = rows[i][cfg.hierParentColumn] ? rows[i][cfg.hierParentColumn].toLowerCase() : '';
    cfg.hier = hier;
   }
  
  // add element to the hier array, top hier level = 0
  // each hier element should match the corresponding table row
  private static function addElement(hier, id, parent, level, j) 
  {
    var el = {id: id, parent: parent, level: level, hasChildren: (j>0 ? true : false)};
    hier.push(el);
  }
  
  // print script with setTableCollapse() function for table 
  private static function printHierScript(hier,divId,text) 
  {
    text.Output.Append('<script>setTableCollapse("'+divId+'",'+JSON_stringify(hier)+');</script>');
  }
  
  // revert object to JSON array
  static function JSON_stringify(obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
      // simple data type
      if (t == "string") obj = '"'+ _escapeEntities(obj) +'"';
      else if(t=="number") obj = '"'+obj+'"';
      return String(obj);
    }
    else {
      // recurse array or object
      var n, v, json = [], arr = (obj && obj.constructor == Array);
      for (n in obj) {
        v = obj[n]; t = typeof(v);
        if (t == "string") v = '"'+ _escapeEntities(v) +'"';
        else if (t == "object" && v !== null) v = JSON_stringify(v);
        json.push((arr ? "" : '"' + n + '":') + String(v));
      }
      return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
  };

  private static function _escapeEntities(str) {
    var entitiesMap = {'<': '&lt;', '>': '&gt;', '&': '&amp;', '\"': '\\&quot;', '\'':'&amp;apos;'};
    return str.replace( /[&<>\"\']/g, function(key){return entitiesMap[key];} );
  }
  
}