class FilterSummary {

    static function filterSummaryText_Hide (context) {

        var state = context.state;

        if (state.ReportExecutionMode == ReportExecutionMode.PdfExport) {
            return false;
        }
        return true;
    }

    static function filterSummaryText_Render (context, paramName, filterText) {

        var text = context.text;
        var log = context.log;

        var filterName = TextAndParameterUtil.getTextTranslationByKey(context, filterText);
        filterName = (filterName.charAt(filterName.length - 1) !== ':') ? (filterName + ': ') : (filterName + ' ');

        var filterValues = [];

        var options = ParamUtil.GetParameterOptions (context, paramName);
        var selected_codes = ParamUtil.GetSelectedCodes (context, paramName);
        for (var i=0; i<selected_codes.length; i++) {
            for (var j=0; j<options.length; j++) {
                if (selected_codes[i] === options[j].Code) {
                    filterValues.push(options[j].Label);
                    break;
                }
            }
        }


        /*var parameterResource = ParamUtil.reportParameterValuesMap[paramName];
        if(parameterResource.locationType === 'TextAndParameterLibrary') {
            var options = ParamUtil.GetSelectedOptions (context, paramName);

            for (var i=0; i<options.length; i++) {
              filterValues.push(options[i].Label);
            }

        }
        else if(parameterResource.locationType === 'Page') {
           var qIds = ParamUtil.GetSelectedCodes (context, paramName);
           for (var i=0; i<qIds.length; i++) {
             filterValues.push(QuestionUtil.getQuestionTitle (context, qIds[i]));
           }

        }*/
        text.Output.Append(filterName+" "+filterValues.join(', ')+"<br>");
    }

}