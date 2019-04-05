class FilterSummary {

    /*
    * Get string "parameter label: parameter value" instead of drop downs for PDF export.
    * @param {object} context object {state: state, report: report, log: log}
    * @param {paramName} parameter name
    * @param {filterText} key word for parameter label
    */

    static function filterSummaryText_Render (context, paramName, filterText) {

        var text = context.text;
        var report = context.report;
        var log = context.log;

        var filterName = TextAndParameterUtil.getTextTranslationByKey(context, filterText);
        var filterValues = ParamUtil.GetSelectedOptions(context, paramName);

        if(filterValues.length>0) { // do not print anything if parameter is empty

            var filterLabels = [];

            for(var i=0; i<filterValues.length; i++) {
                filterLabels.push(filterValues[i].Label);
            }
            text.Output.Append(filterName+" "+filterLabels.join(', ')+"<br>");
        }
    }


    /*
    * Get string "parameter label: parameter value" instead of drop downs for PDF export.
    * @param {object} context object {state: state, report: report, log: log, user: user, pageContext: pageContext}
    * @return {paramName} str to append to text component
    */
    static function globalReportFilterSummaryText_Render (context) {

        var log = context.log;
        var user = context.user;
        var pageContext = context.pageContext;
        var str = '';

        if(pageContext.Items['CurrentPageId'] === DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'DefaultPage')) {

            // data source
            str += Export.displayDataSourceInfo(context);

            //hierarchy
            str += '<div>'+TextAndParameterUtil.getTextTranslationByKey(context, 'ReportBase')+' '+user.PersonalizedReportBaseText+'</div>';

            //selected date period
            var datePeriod = DateUtil.defineDateRangeBasedOnFilters(context);
            var start: DateTime = datePeriod.startDate;
            var end: DateTime = datePeriod.endDate;

            str += '<div>'+TextAndParameterUtil.getTextTranslationByKey(context, 'TimePeriod')+' '+start.ToShortDateString()+' - '+end.ToShortDateString()+'</div>';

            //filter panel filters
            var filterOptions = Filters.GetFiltersValues(context);

            if(filterOptions) {
                for(var i=0; i<filterOptions.length; i++) {

                    var options = [];
                    for(var j=0; j<filterOptions[i].selectedOptions.length; j++) {
                        var option = filterOptions[i].selectedOptions[j];
                        options.push(option.Label);
                    }
                    str += '<div>'+filterOptions[i].Label+': '+options.join(', ')+'</div>';
                }
            }

            str = '<div class="material-card material-card_global-filter-summary">'+str+'</div>'
        }
        return str;
    }

}