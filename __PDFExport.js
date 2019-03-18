class PDFExport {

    /*
     * Show Break By parameter value in pdf export (dropdowns are not rendered in pdf exports)
     * @param {object} context
     * @param {string} parameterName
     */

    static function breakByLabelForPdfExport (context, parameterName){

        var state = context.state;
        var breakBy = 'Break by: ';

        if (state.ReportExecutionMode == ReportExecutionMode.PdfExport) {

            if (state.Parameters.IsNull(parameterName)) {
                return breakBy+='none';
            }
            var selectedOption : ParameterValueResponse = state.Parameters[parameterName];
            return breakBy+= selectedOption.DisplayValue;
        }

    }


    /*static function displayParamValueForPdfExport (context, parameterName) {
      var state = context.state;
      var text = context.text;
      var log = context.log;
      if (state.ReportExecutionMode == ReportExecutionMode.PdfExport) {
        log.LogDebug("PDF");
        var options = ParamUtil.GetSelectedCodes (context, parameterName);
        log.LogDebug("options.length "+options.length);
        for (var i=0; i< options.length; i++) {

          var label = options[i]; log.LogDebug("label "+label);
         // text.Output.Append(label);
        }


       // var selectedOption : ParameterValueResponse = state.Parameters[parameterName];
       // return breakBy+= selectedOption.DisplayValue;
      }
    }*/


}