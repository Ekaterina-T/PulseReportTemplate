class PublicUtil {

    /**
     * @memberof PublicUtil
     * @function isPublic
     * @description function to check if report is public (check in Config)
     * @param {Object} context - {user}
     * @returns Boolean
     * @example PublicUtil.isPublic(context)
     */
    static function isPublic (context) {
        var user = context.user;
        var isPublic = Config.isPublic;
        if (!!isPublic) {
            return true;
        } else {
            if (!user || !user.UserId) {
                throw new Error("Report seems to be in public mode. Please check Config, so that it has 'isPublic: true'.");
            }
            return false;
        }
    }
}