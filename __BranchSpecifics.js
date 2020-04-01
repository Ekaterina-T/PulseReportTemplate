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
      var ids = dbTable.GetColumnValues("__l9" + Config.BranchIDTableColumnName, "id", selectedNodeId);
      if(ids.Count > 0){
         branchId = ids[0];
      }
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
     * @description get end users that belong to current hierarchy branch
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {StringCollection} - string array with end user ids
     * @example BranchSpecifics.getUserIdsByCurrentBranch({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getUserIdsByCurrentBranch(context, endUserId) {

        if(!Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled || !endUserId) {
            return [];
        }

        var log = context.log;
        var confirmit = context.confirmit;

        var schema : DBDesignerSchema = confirmit.GetDBDesignerSchema(Config.DBSchemaID_ForProject);
        var maxNTable : DBDesignerTable = schema.GetDBDesignerTable(Config.EndUserMaxNTableName);

        var userId = BranchSpecifics.getUserIdByLogin(context, endUserId, schema);
        var branchId = BranchSpecifics.getBranchIdFromUserId(context, userId);

        if (!branchId) {
            return [];
        }

        var maxN;
        var maxNValues = maxNTable.GetColumnValues("__l9"+Config.EndUserMaxNTableColumnName, "id", branchId);

        if (!maxNValues || maxNValues.Count <= 0) {
            maxNValues = maxNTable.GetColumnValues("__l9"+Config.EndUserMaxNTableColumnName, "id", "default");
        }

        maxN = maxNValues[0];

        var idsFromCurrentBranch = [];
        for (var i = 1; i <= maxN; i++ ) {
            idsFromCurrentBranch.push(branchId + '_' + i);
        }

        return idsFromCurrentBranch;
    }


    /**
     * @description get filter expression to filter end users that belong to current hierarchy branch
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {string} - filter expression
     * @example BranchSpecifics.getOnlyUsersFromCurrentBranch({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getOnlyUsersFromCurrentBranch(context) {

        if(!Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled || !Config.EndUserByBranch.endUserQuestionId) {
            return '';
        }

        var log = context.log;
        var confirmit = context.confirmit;

        var endUserQuestionId = Config.EndUserByBranch.endUserQuestionId;
        var userIds = BranchSpecifics.getUserIdsByCurrentBranch(context);
        if (!userIds || userIds.length <= 0) {
            return '';
        }

        return 'In(' + endUserQuestionId + ', "' + userIds.join('") OR In(' + endUserQuestionId + ', "') + '")';
    }


    /**
     * @description get end user's id by their login
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @param {string} login
     * @param {DBDesignerSchema} schema - if we've already got one
     * @returns {string} - end user id from Database table
     * @example BranchSpecifics.getUserIdByLogin({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getUserIdByLogin(context, login, schema) {
        var log = context.log;
        var confirmit = context.confirmit;

        if(!login || !Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled) {
            return '';
        }

        schema = schema ? schema : confirmit.GetDBDesignerSchema(Config.DBSchemaID_ForProject);
        var endUserTable : DBDesignerTable = schema.GetDBDesignerTable(Config.EndUserTableName);

        var userId = endUserTable.GetColumnValues("id", "__l9"+Config.EndUserTableLoginColumnName, login);

        return userId ? userId : '';
    }


    /**
     * @description get branch id from user id
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @param {string} userId
     * @returns {string} - branchId
     * @example BranchSpecifics.getBranchIdFromUserId({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getBranchIdFromUserId(context, userId) {
        if (!userId) {
            return '';
        }

        var idIndexLength = userId.split('_')[userId.split('_').length-1].length + 1;
        return userId.substr(0, userId.length - idIndexLength);
    }
  }