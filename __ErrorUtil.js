class ErrorUtil {

    /**
     * @description hide the page based on the combination of all possible error situations
     * @param {Object} context = {state: state, report: report, log: log, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {boolean} - flag that shows whether this page should be hidden or not
     * @example ErrorUtil.hidePage(context);
     */
    static function hidePage(context) {
        return hidePageByBranch(context) || hideByDuplicateUser(context);
    }

    /**
     * @description get the name of the error to show on the page based on the error occured
     * @param {Object} context = {state: state, report: report, log: log, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {String} - name of the error, should correspond to the Text Library
     * @example ErrorUtil.getErrorName(context);
     */
    static function getErrorName(context) {
        if (hidePageByBranch(context)) {
            return 'Branch';
        }

        if (hideByDuplicateUser(context)) {
            return 'Duplicated user';
        }

        return '';
    }

    /**
     * @description hide the page by branch id
     * @param {Object} context = {state: state, report: report, log: log, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {boolean} - flag that shows whether this page should be hidden or not
     * @example ErrorUtil.hidePageByBranch(context);
     */
    static function hidePageByBranch(context) {
        if (!Config.IsBranchSpecificsOn || !Config.EndUserByBranch.enabled || PublicUtil.isPublic(context)) {
            return false;
        }

        var user = context.user;

        var endUserId = user.UserId;
        var userId = BranchSpecifics.getUserIdByLogin(context, endUserId);

        // to check if user has a row in EndUser table
        if (!userId) {
            return true;
        }

        var branchId = BranchSpecifics.getSelectedBranchId(context);

        return !branchId;
    }


    /**
     * @description hide the page based on whether the user has multiple entries in the user table
     * @param {Object} context = {state: state, report: report, log: log, user: user, pageContext: pageContext, confirmit: confirmit}
     * @returns {boolean} - flag that shows whether this page should be hidden or not
     * @example ErrorUtil.hideByDuplicateUser(context);
     */
    static function hideByDuplicateUser(context) {
        var log = context.log;
        var user = context.user;
        var endUserId = user.UserId;

        var userID = BranchSpecifics.getAllUserIdsByLogin(context, endUserId);

        return userID.Count > 1;
    }

    /**
     * @description display error text based on the corresponding error name
     * @param {Object} context = {state: state, report: report, log: log, user: user, pageContext: pageContext, confirmit: confirmit}
     * @example ErrorUtil.displayErrorText(context);
     */
    static function displayErrorText(context) {
        var report = context.report;
        var log = context.log;
        var text = context.text;

        var errorObjName = 'ErrorPageSpecificMessage';
        var errorSpecificName = getErrorName(context);

        if (errorSpecificName) {
            text.Output.Append(TextAndParameterUtil.getTextTranslationByKeyAndSubkey(context, errorObjName, errorSpecificName));
        }
    }
}