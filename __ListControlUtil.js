class ListControlUtil {

    /*
     * Hide list if parameter is not needed.
     * @param {object} context object {state: state, report: report, pageContext: pageContext, log: log}
     * @param {string} parameterName
     * @return {boolean}
     */

    static function hideListControl(context, parameterName) {

        var log = context.log;
        var pageContext = context.pageContext;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

		if(parameterName === 'p_KPIHierarchyBasedComparisons') {

            return (ParamUtil.isParameterEmpty(context, 'p_OrgOverviewBreakBy') || !PageKPI.isKPIBreakByHierarchy(context));
        }

        if(parameterName === 'p_HierarchyBasedComparisons') {

			var reportBases = context.user.PersonalizedReportBase.split(',');
            return reportBases.length > 1;
            
        }

        if(parameterName === 'p_Results_TableTabSwitcher') {

            return (DataSourceUtil.isProjectSelectorNotNeeded(context) && !PageResults.isDimensionsMode(context)); // only needed for pulse programs
        }

        var kpiQids = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'KPI');

        if(parameterName === 'p_QsToFilterBy' && kpiQids.length == 1) {

            return true;
        }

    }
}