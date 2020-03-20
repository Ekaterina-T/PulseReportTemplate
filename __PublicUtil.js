class PublicUtil {

    /**
     * @memberof PublicUtil
     * @function isPublic
     * @description function to check if report is public (check in Config)
     */
    static function isPublic () {
        var isPublic = Config['isPublic'];
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