class User {

    /*
     * @param {object} context {}
     * @param {Array} list of valid roles (from Config)
     * @return {boolean}
     */
    static function isUserValidForSurveybyRole(context, validRoles) {

        var log = context.log;
        var user = context.user;

        log.LogDebug('1')
        //confirmit user (has access to all surveys for QA) or survey is available for all end users (validRoles is null)
        if(user.UserType === ReportUserType.Confirmit || !validRoles) {
            return true;
        }

        log.LogDebug('2')
        // survey is not available for any role
        if(validRoles.length === 0) {
            return false;
        }

        log.LogDebug('3')
        for(var i=0; i<validRoles.length; i++) {
            if(user.HasRole(validRoles[i])) {
                return true;
            }
        }

        log.LogDebug('4')
        return false;

    }
}