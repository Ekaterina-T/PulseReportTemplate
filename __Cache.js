class CacheUtil {


    static public var cachedParameterOptions = {};

    /**
     *
     */
    public static function getParameterCacheKey(context, parameterId) {

        var log = context.log;
        var pageContext = context.pageContext;
        var key = pageContext.Items['userEmail']+'_'+DataSourceUtil.getDsId(context)+'_'+parameterId;

        return key;
    }

    /**
     *
     */
    static public function isParameterCached(context, parameterId) {
        var log = context.log;
        var key = getParameterCacheKey(context, parameterId);
        log.LogDebug('key='+key)

        return cachedParameterOptions.hasOwnProperty(key)
    }

    /**
     * get copy of parameter options from cache
     * @param {Object} context
     * @param {String} parameterId
     * @returns {Array} array of options [{Code:, Label:}, ...]
     */
    static public function GetParameterOptions(context, parameterId) {
        //copy needed to avoid 'spoiling' full list

        var log = context.log;
        var key = CacheUtil.getParameterCacheKey(context, parameterId);

        return cachedParameterOptions[key]['options'];
    }

}