class CacheUtil {

    /**
     * Object that keeps options' lists for parameters
     * its item looks like that: key: {options: [{},{}] }
     */
    static public var cachedParameterOptions = {};

    /**
     * returns key for parameter cache
     * @param {Object} context
     * @param {String} param id
     * @returns {String}: userEmail_ds0_parameter0
     */
    static public function getParameterCacheKey(context, parameterId) {

        var log = context.log;
        var pageContext = context.pageContext;
        var lang = context.report.CurrentLanguage;
        var key = pageContext.Items['userEmail']+'_'+DataSourceUtil.getDsId(context)+'_'+parameterId;

        return key;
    }

    /**
     * checks if param was cached already
     * @param {Object} context
     * @param {String} param id
     * @returns {Boolean}
     */
    static public function isParameterCached(context, parameterId) {
        var log = context.log;
        var key = getParameterCacheKey(context, parameterId);

        return cachedParameterOptions.hasOwnProperty(key)
    }

    /**
     * get parameter options from cache
     * @param {Object} context
     * @param {String} parameterId
     * @returns {Array} array of options [{Code:, Label:}, ...]
     */
    static public function GetParameterOptions(context, parameterId) {
        var log = context.log;
        var key = CacheUtil.getParameterCacheKey(context, parameterId);
        return cachedParameterOptions[key]['options'];
    }

}