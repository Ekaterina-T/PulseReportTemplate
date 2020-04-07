class BranchSpecifics {

    static private var _hierarchySchema: DBDesignerSchema;
    static private var _hierarchyTable: DBDesignerTable;
    static private var _databaseSchema: DBDesignerSchema;
    static private var _endUserTable: DBDesignerTable;
    static private var _branchConfigTable: DBDesignerTable;

    /**
     * @description set private database table (and/or schema)
     * @param {Object} context = {confirmit: confirmit}
     * @param {String} tableType - "hierarchy", "enduser", "branchconfig"
     * @example BranchSpecifics.setDatabaseTable(context, "Hierarchy");
     */
    static private function setDatabaseTable(context, tableType) {
        var confirmit = context.confirmit;

        switch (tableType) {
            case "hierarchy":
                if (!_hierarchySchema) {
                    _hierarchySchema = confirmit.GetDBDesignerSchema(parseInt(Config.schemaId));
                }
                _hierarchyTable = _hierarchySchema.GetDBDesignerTable(Config.tableName);
                break;
            case "enduser":
                if (!_databaseSchema) {
                    _databaseSchema = confirmit.GetDBDesignerSchema(Config.DBSchemaID_ForProject);
                }
                _endUserTable = _databaseSchema.GetDBDesignerTable(Config.EndUserTableName);
                break;
            case "branchconfig":
                if (!_databaseSchema) {
                    _databaseSchema = confirmit.GetDBDesignerSchema(Config.DBSchemaID_ForProject);
                }
                _branchConfigTable = _databaseSchema.GetDBDesignerTable(Config.BranchConfigTableName);
                break;
        }
    }

    /**
     * @description get end user's id by their login
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @param {string} login
     * @param {DBDesignerSchema} existingSchema - if we've already got one
     * @returns {string} - end user id from Database table
     * @example BranchSpecifics.getUserIdByLogin({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getUserIdByLogin(context, login) {
        var log = context.log;

        if (!login || !Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled) {
            return '';
        }

        if (!_endUserTable) {
            setDatabaseTable(context, "enduser");
        }

        var userId = _endUserTable.GetColumnValues("id", "__l9" + Config.EndUserTableLoginColumnName, login);

        return userId && userId.Count > 0 ? userId[0] : '';
    }

    /**
     * @description get id of node depending on selector type
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
     * @param {Object} branchDependentSettings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchLogoTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
     * @returns String
     * @example BranchSpecifics.getSelectedNodeIdFromHierarchy(context);
     * @inner
     */
    static function getSelectedNodeIdFromHierarchy(context) {
        var log = context.log;
        var user = context.user;

        if (Config.BranchSelectorType == "hierarchy") {
            if (!PublicUtil.isPublic(context)) {
                return user.PersonalizedReportBase;
            } else {
                throw new Error('BranchSpecifics.getSelectedNodeIdFromHierarchy: for public report Config BranchSelectorType should be "parameter".');
            }
        }

        if (Config.BranchSelectorType == "parameter") {
            var selectedNodes = ParamUtil.GetSelectedCodes(context, Config.BranchSelectorParameterName);
            if (selectedNodes.length != 1) {
                throw new Error('BranchSpecifics.getSelectedNodeIdFromHierarchy: parameter mentioned in Config BranchSelectorType settings always must have one value.');
            }

            return selectedNodes[0];
        }

        throw new Error('BranchSpecifics.getSelectedNodeIdFromHierarchy: check Config BranchDependentLogoSettings>BranchSelectorType settings. It should be "hierarchy" or "parameter".');
    }

    /**
     * @description get branch id from db table
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
     * @param {String} selectedNodeId  id of the node selected in the report
     * @param {Object} settings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchIDTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
     * @returns String - branch id
     * @example BranchSpecifics.getSelectedBranchIdFromHierarchy(context);
     */
    static function getSelectedBranchIdFromHierarchy(context) {
        var log = context.log;
        var confirmit = context.confirmit;

        var selectedNodeId = BranchSpecifics.getSelectedNodeIdFromHierarchy(context);
        var branchId: String = "";

        if (!_hierarchyTable) {
            setDatabaseTable(context, "hierarchy");
        }

        if (Config.BranchIDTableColumnName != "") {
            var ids = _hierarchyTable.GetColumnValues("__l9" + Config.BranchIDTableColumnName, "id", selectedNodeId);
            if (ids.Count > 0) {
                branchId = ids[0];
            }
        }

        return branchId;
    }

    /**
     * @description get branch id from user id; if there's no branch id, get it from hierarchy node
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns branch id or "", if there's no branch id
     * @example BranchSpecifics.getSelectedBranchId(context);
     * @inner
     */
    static function getSelectedBranchId(context) {
        var log = context.log;
        var user = context.user;

        var endUserId = user.UserId;
        var userId = BranchSpecifics.getUserIdByLogin(context, endUserId);

        //get branchId by user's login
        var branchId = BranchSpecifics.getBranchIdFromUserId(context, userId);
        if (!branchId) { //if there's no branch id in user's login
            // use hierarchy branchId
            branchId = BranchSpecifics.getSelectedBranchIdFromHierarchy(context);
            if (!branchId) {
                return "";
            }
        }

        return branchId;
    }

    /**
     * @description get branch id from db table
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
     * @param {String} selectedNodeId  id of the node selected in the report
     * @param {Object} settings = {BranchLogoFileLibraryFolderLink: link,  BranchLogoFilenameExtension: "svg",
                                               BranchSelectorType: "hierarchy"("parameter"), BranchSelectorParameterName: "",
                                               BranchIDTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
     * @returns {Object} {branchId: branchId, logoLink: branchLogoLink}
     * @example BranchSpecifics.getSelectedBranchIdOrLogo(context);
     */
    static function getSelectedBranchIdOrLogo(context, selectedNodeId, settings) {
        var log = context.log;
        var confirmit = context.confirmit;

        var branchId: String = "";
        var branchLogoLink: String = "";

        if (!_hierarchyTable) {
            setDatabaseTable(context, "hierarchy");
        }

        branchId = getSelectedBranchId(context);

        if (settings.BranchLogoLinkTableColumnName != "") {
            branchLogoLink = _hierarchyTable.GetColumnValues("__l9" + settings.BranchLogoLinkTableColumnName, "id", selectedNodeId)[0];
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
                                               BranchIDTableColumnName: "HfNodeId", BranchLogoLinkTableColumnName:"" };
     * @returns String
     * @example BranchSpecifics.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     * @inner
     */
    static function getBranchLogoImgLink(context, defaultSettings, branchDependentSettings) {
        var log = context.log;

        if (defaultSettings.DefaultBranchLogoLink == undefined) {
            defaultSettings.DefaultBranchLogoLink = "";
        }

        //default for all
        if (defaultSettings.ForceDefaultBranchLogoForAll) {
            return defaultSettings.DefaultBranchLogoLink;
        }

        //branch dependent
        var selectedNodeId = getSelectedNodeIdFromHierarchy(context);
        var selectedBranchInfo = getSelectedBranchIdOrLogo(context, selectedNodeId, branchDependentSettings);

        //specified logo link has priority
        if (selectedBranchInfo.logoLink != undefined && selectedBranchInfo.logoLink != "undefined" && selectedBranchInfo.logoLink != "") {
            return selectedBranchInfo.logoLink;
        }

        if (selectedBranchInfo.branchId != undefined && selectedBranchInfo.branchId != "undefined" && selectedBranchInfo.branchId != "") {
            var link = branchDependentSettings.BranchLogoFileLibraryFolderLink + "/";
            link += branchDependentSettings.BranchLogoPrefix + selectedBranchInfo.branchId;
            link += "." + branchDependentSettings.BranchLogoFilenameExtension;
            return link;
        }

        return defaultSettings.DefaultBranchLogoLink;
    }

    /**
     * @description generate html code for branch logo
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext}
     * @example BranchSpecifics.branchLogo_Render({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function branchLogo_Render(context) {
        var log = context.log;
        var text = context.text;

        if (!Config.IsBranchSpecificsOn && !Config.BranchLogo.enabled) {
            return;
        }

        var defaultSettings = Config.BranchLogo.DefaultBranchLogoSettings;
        var branchDependentSettings = Config.BranchLogo;

        var logoLink = getBranchLogoImgLink(context, defaultSettings, branchDependentSettings);

        if (logoLink == "") {
            return;
        }

        var htmlCode = '<img src="' + logoLink + '" class ="branchLogo-img" onerror = "branchLogoError(this);">';

        //to hide "broken img" icon if there are some issues with image in file library:
        htmlCode += '<script> function branchLogoError(image){ image.onerror = ""; image.style.display = "none";  return true; }</script>';

        text.Output.Append(htmlCode);
    }

    /**
     * @description get end users that belong to current branch
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {StringCollection} - string array with end user ids
     * @example BranchSpecifics.getUserIdsByCurrentBranch({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getUserIdsByCurrentBranch(context, endUserId) {
        if (!Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled || !endUserId) {
            return [];
        }

        var log = context.log;

        var branchId = getSelectedBranchId(context);

        if (!branchId) {
            return [];
        }

        if (!_branchConfigTable) {
            setDatabaseTable(context, "branchconfig");
        }

        var maxN;
        var maxNValues = _branchConfigTable.GetColumnValues("__l9" + Config.BranchConfigTableColumnNames.MaxN, "id", branchId);

        if (!maxNValues || maxNValues.Count <= 0) {
            maxNValues = _branchConfigTable.GetColumnValues("__l9" + Config.BranchConfigTableColumnNames.MaxN, "id", Config.BranchConfigTableDefaultId);
        }

        maxN = maxNValues[0];

        var idsFromCurrentBranch = [];
        for (var i = 1; i <= maxN; i++) {
            idsFromCurrentBranch.push(branchId + '_' + i);
        }

        return idsFromCurrentBranch;
    }

    /**
     * @description get filter expression to filter end users that belong to current branch
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {string} - filter expression
     * @example BranchSpecifics.getOnlyUsersFromCurrentBranch({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getOnlyUsersFromCurrentBranch(context) {
        if (!Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled || !Config.EndUserByBranch.endUserQuestionId) {
            return '';
        }

        var log = context.log;
        var user = context.user;

        var endUserQuestionId = Config.EndUserByBranch.endUserQuestionId;
        var userIds = getUserIdsByCurrentBranch(context, user.UserId);
        if (!userIds || userIds.length <= 0) {
            return '';
        }

        return 'In(' + endUserQuestionId + ', "' + userIds.join('") OR In(' + endUserQuestionId + ', "') + '")';
    }

    /**
     * @description get dimensions that associated with current branch
     * @param {Object} context = {state: state, report: report, log: log, text: text, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {string} - filter expression
     * @example BranchSpecifics.getDimensionsByBranch({confirmit: confirmit, user: user, report: report, state: state, log: log, pageContext: pageContext});
     */
    static function getDimensionsByBranch(context) {
        if (!Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled || !Config.BranchConfigTableColumnNames || !Config.BranchConfigTableColumnNames.Dimensions) {
            return '';
        }
        var branchId = getSelectedBranchId(context);

        if (!branchId) {
            branchId = Config.BranchConfigTableDefaultId;
        }

        if (!_branchConfigTable) {
            setDatabaseTable(context, "branchconfig");
        }

        var dimensionsStr = _branchConfigTable.GetColumnValues("__l9"+Config.BranchConfigTableColumnNames.Dimensions, "id", branchId)[0];
        return dimensionsStr.split(",");
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

        var idIndexLength = userId.split('_')[userId.split('_').length - 1].length + 1;
        return userId.substr(0, userId.length - idIndexLength);
    }
}