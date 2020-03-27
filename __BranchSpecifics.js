class BranchSpecifics{

    /**
    * @description get id of node depending on selector type
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @param {Object} branchDependentSettings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchLogoTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
    * @returns String
    * @example BranchSpecifics.getSelectedNodeId(context);
    * @inner
    */
    static function getSelectedNodeId(context){
    var log = context.log;
    var user = context.user;

    if(Config.BranchSelectorType == "hierarchy"){
      if(!PublicUtil.isPublic(context)){
         return user.PersonalizedReportBase;
      }
      else{
        throw new Error('BranchSpecifics.getSelectedNodeId: for public report Config BranchSelectorType should be "parameter".');
      }
    }

    if(Config.BranchSelectorType == "parameter"){
        var selectedNodes = ParamUtil.GetSelectedCodes(context, Config.BranchSelectorParameterName);
        if(selectedNodes.length != 1 ){
            throw new Error('BranchSpecifics.getSelectedNodeId: parameter mentioned in Config BranchSelectorType settings always must have one value.');
        }

        return  selectedNodes[0];
    }

    throw new Error('BranchSpecifics.getSelectedNodeId: check Config BranchDependentLogoSettings>BranchSelectorType settings. It should be "hierarchy" or "parameter".');
    }
  
    /**
    * @description get branch id from db table
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @param {String} selectedNodeId  id of the node selected in the report  
    * @param {Object} settings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchIDTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
    * @returns {Object} {branchId: branchId, logoLink: branchLogoLink}
    * @example BranchSpecifics.getSelectedBranchIdOrLogo(context, );
    */
   static function getSelectedBranchIdOrLogo(context, selectedNodeId, settings){
    var log = context.log;
    var confirmit = context.confirmit;
    
    var schema : DBDesignerSchema = confirmit.GetDBDesignerSchema(parseInt(Config.schemaId));
    var dbTable : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
    
    var branchId : String = "";
    var branchLogoLink : String ="";
    
    if(Config.BranchIDTableColumnName != ""){
      branchId = dbTable.GetColumnValues("__l9" + Config.BranchIDTableColumnName, "id", selectedNodeId)[0];
    }
    
    if(settings.BranchLogoLinkTableColumnName != "") {
      branchLogoLink = dbTable.GetColumnValues("__l9" + settings.BranchLogoLinkTableColumnName, "id", selectedNodeId)[0];
    }
    
    return {branchId: branchId, logoLink: branchLogoLink};
    
  }

  /**
    * @description get branch id from db table
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @param {String} selectedNodeId  id of the node selected in the report  
    * @param {Object} settings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchIDTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
    * @returns String - branch id 
    * @example BranchSpecifics.getSelectedBranchId(context);
    */
   static function getSelectedBranchId(context){
    var log = context.log;
    var confirmit = context.confirmit;

    var selectedNodeId = BranchSpecifics.getSelectedNodeId(context);
    
    var schema : DBDesignerSchema = confirmit.GetDBDesignerSchema(parseInt(Config.schemaId));
    var dbTable : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
    
    var branchId : String = "";
        
    if(Config.BranchIDTableColumnName != ""){
      branchId = dbTable.GetColumnValues("__l9" + Config.BranchIDTableColumnName, "id", selectedNodeId)[0];
    }
       
    return branchId;
    
  }
    /**
    * @description get branch logo link
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @param {String} defaultSettings  = { DefaultBranchLogoLink: "/isa/AAIHMPIBHONRJTKTPPCAEPPDORNRMQMV/hsologo.png", 
                                           ForceDefaultBranchLogoForAll: false};
    * @param {Object} branchDependentSettings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchIDTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
    * @returns String
    * @example BranchSpecifics.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
    * @inner
    */
    static function getBranchLogoImgLink(context, defaultSettings, branchDependentSettings){
    var log = context.log;
    
    if(defaultSettings.DefaultBranchLogoLink == undefined){
        defaultSettings.DefaultBranchLogoLink = "";
    }
    
    //default for all
    if(defaultSettings.ForceDefaultBranchLogoForAll) { 
      return defaultSettings.DefaultBranchLogoLink;
    }
    
    //branch dependent
    var selectedNodeId = getSelectedNodeId(context);
    var selectedBranchInfo = getSelectedBranchIdOrLogo(context, selectedNodeId, branchDependentSettings);
    
    //specified logo link has priority
    if(selectedBranchInfo.logoLink != undefined && selectedBranchInfo.logoLink != "undefined" && selectedBranchInfo.logoLink != "") { 
      return selectedBranchInfo.logoLink;
    }
   
    if(selectedBranchInfo.branchId != undefined && selectedBranchInfo.branchId != "undefined" && selectedBranchInfo.branchId != "") {
      var link =  branchDependentSettings.BranchLogoFileLibraryFolderLink + "/";
      link += branchDependentSettings.BranchLogoPrefix + selectedBranchInfo.branchId;
      link += "."+ branchDependentSettings.BranchLogoFilenameExtension;
      return link;
    } 
    
    return defaultSettings.DefaultBranchLogoLink;  
   }

    /**
    * @description generate html code for branch logo 
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @example BranchSpecifics.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
    */
    static function branchLogo_Render(context){
      var log = context.log;
      var text = context.text;

      if(!Config.IsBranchSpecificsOn && !Config.BranchLogo.enabled) {return;}
      
      var defaultSettings = Config.BranchLogo.DefaultBranchLogoSettings;
      var branchDependentSettings = Config.BranchLogo;
      
      var logoLink = getBranchLogoImgLink(context, defaultSettings, branchDependentSettings);
      
      if(logoLink == "") { return; }
      
      var htmlCode = '<img src="' + logoLink + '" class ="branchLogo-img" onerror = "branchLogoError(this);">';
      
      //to hide "broken img" icon if there are some issues with image in file library:
      htmlCode+= '<script> function branchLogoError(image){ image.onerror = ""; image.style.display = "none";  return true; }</script>';
     
      text.Output.Append(htmlCode); 
    }


    /**
     * @description get endusers that belong to current hierarchy branch
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
     * @param {String} reportUserId  current end user id
     * @returns {StringCollection} - string array with end user ids
     * @example BranchSpecifics.getUserIdsByCurrentBranch({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext}, reportUserId);
     */
    static function getUserIdsByCurrentBranch(context, endUserId) {

        if(!Config.IsBranchSpecificsOn && !Config.EndUserByBranch.enabled) {
            return [];
        }

        var log = context.log;

        var HFParentNodeID_lookup = Config.EndUserByBranch.BranchIDTableColumnName;
        var schemaId = Config.DBSchemaID_ForProject;
        var tableName = Config.EndUserTableName;
        var schema_HF : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(schemaId);
        var table_HF : DBDesignerTable = schema_HF.GetDBDesignerTable(tableName);

        var userid = endUserId.replace(/[^\w]/g,'_');

        var currentHFNumColection : StringCollection = table_HF.GetColumnValues("__l9"+HFParentNodeID_lookup, "id", userid);
        if (currentHFNumColection.Count <= 0) {
            throw new Error("There's no such user as " + userid + "in the Enduser table.");
        }

        var currentHFNum = currentHFNumColection[0];
        var idsWithCurrentHF : StringCollection = table_HF.GetColumnValues("id", "__l9"+HFParentNodeID_lookup, currentHFNum);

        return idsWithCurrentHF;
    }
    
  }