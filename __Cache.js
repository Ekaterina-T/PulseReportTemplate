class CacheUtil {

    /**
     *
     */
    public static function getParameterCacheKey(context, parameterId) {

        var log = context.log;
        var pageContext = context.pageContext;
        var key = pageContext.Items['userEmail']+'_'+DataSourceUtil.getDsId(context)+'_'+parameterId;

        return key;
    }

}