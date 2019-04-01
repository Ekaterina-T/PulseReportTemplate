class PDFExport {

    /*
     * Show Break By parameter value in pdf export (dropdowns are not rendered in pdf exports)
     * @param {object} context
     * @param {string} parameterName
     */

    static function breakByLabelForPdfExport (context, parameterName){

        var state = context.state;
        var breakBy = 'Break by: ';

        if (state.ReportExecutionMode === ReportExecutionMode.PdfExport) {

            if (state.Parameters.IsNull(parameterName)) {
                return breakBy+='none';
            }
            var selectedOption : ParameterValueResponse = state.Parameters[parameterName];
            return breakBy+= selectedOption.DisplayValue;
        }

    }

    /*
     * diaplay Program/Survey infor pdf export (dropdowns are not rendered in pdf exports)
     * @param {object} {state: state, report: report, text: text, log: log}
     */

    static function displayDataSourceInfo(context) {

        var state = context.state;
        var text = context.text;
        var log = context.log;
        var str = '';

        if (state.ReportExecutionMode === ReportExecutionMode.PdfExport) {

            var selectedProject: Project = DataSourceUtil.getProject(context);
            str+='Program Name: '+selectedProject.ProjectName+' ';

            if(!state.Parameters.IsNull('p_projectSelector')) {
                str+= 'Survey Name: '+state.Parameters.GetString('p_projectSelector')+' ';
            }
            text.Output.Append(str);
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