class BranchLogo{

    /**
    * @description get id of node depending on selector type
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @param {Object} branchDependentSettings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchLogoTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
    * @returns String
    * @example BranchLogoTest.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
    * @inner
    */
    static function getSelectedNodeId(context, branchDependentSettings){
    var log = context.log;
    var user = context.user;
    
    if(branchDependentSettings.BranchSelectorType == "hierarchy"){   
      if(!PublicUtil.isPublic(context)){     
         return user.PersonalizedReportBase;
      }
      else{
        throw new Error('PageActions.getSelectedNodeId: for public report Config BranchDependentLogoSettings>BranchSelectorType should be "parameter".'); 
      }
    }
    
    if(branchDependentSettings.BranchSelectorType == "parameter"){
        var selectedNodes = ParamUtil.GetSelectedCodes(context, branchDependentSettings.BranchSelectorParameterName);
        if(selectedNodes.length != 1 ){
            throw new Error('PageActions.getSelectedNodeId: parameter mentioned in Config BranchDependentLogoSettings>BranchSelectorType settings always must have one value.');
        }

        return  selectedNodes[0];
    }  
    
    throw new Error('PageActions.getSelectedNodeId: check Config BranchDependentLogoSettings>BranchSelectorType settings. It should be "hierarchy" or "parameter".');
    }
  
    /**
    * @description get branch id from db table
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @param {String} selectedNodeId  id of the node selected in the report  
    * @param {Object} settings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchLogoTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
    * @returns String
    * @example BranchLogoTest.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
    * @inner
    */
   static function getSelectedBranchId(context, selectedNodeId, settings){
    var log = context.log;
    var confirmit = context.confirmit;
    
    var schema : DBDesignerSchema = confirmit.GetDBDesignerSchema(parseInt(Config.schemaId));
    var dbTable : DBDesignerTable = schema.GetDBDesignerTable(Config.tableName);
    
    var branchId : String = "";
    var branchLogoLink : String ="";
    
    if(settings.BranchLogoTableColumnName != ""){ 
      branchId = dbTable.GetColumnValues("__l9" + settings.BranchLogoTableColumnName, "id", selectedNodeId)[0];
    }
    
    if(settings.BranchLogoLinkTableColumnName != "") {
      branchLogoLink = dbTable.GetColumnValues("__l9" + settings.BranchLogoLinkTableColumnName, "id", selectedNodeId)[0];
    }
    
    return {branchId: branchId, logoLink: branchLogoLink};
    
  }
    /**
    * @description get branch logo link
    * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
    * @param {String} defaultSettings  = { DefaultBranchLogoLink: "/isa/AAIHMPIBHONRJTKTPPCAEPPDORNRMQMV/hsologo.png", 
                                           ForceDefaultBranchLogoForAll: false};
    * @param {Object} branchDependentSettings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchLogoTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
    * @returns String
    * @example BranchLogoTest.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
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
    var selectedNodeId = getSelectedNodeId(context, branchDependentSettings);
    var selectedBranchInfo = getSelectedBranchId(context, selectedNodeId, branchDependentSettings);
    
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
    * @example BranchLogoTest.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
    */
    static function branchLogo_Render(context){
      var log = context.log;
      var text = context.text;
  
      
      if(!Config.IsBranchLogoOn) {return;} 
      
      var defaultSettings = Config.DefaultBranchLogoSettings;
      var branchDependentSettings = Config.BranchDependentLogoSettings;
      
      var logoLink = getBranchLogoImgLink(context, defaultSettings, branchDependentSettings);
      
      if(logoLink == "") { return; }
      
      var htmlCode = '<img src="' + logoLink + '" class ="branchLogo-img" onerror = "branchLogoError(this);">';
      
      //to hide "broken img" icon if there are some issues with image in file library:
      htmlCode+= '<script> function branchLogoError(image){ image.onerror = ""; image.style.display = "none";  return true; }</script>';
     
      text.Output.Append(htmlCode); 
    }
    
  }