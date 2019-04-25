class Export {

    static function

    isExportMode(context) {

        var state = context.state;
        return (state.ReportExecutionMode === ReportExecutionMode.PdfExport || state.ReportExecutionMode === ReportExecutionMode.ExcelExport) ? true : false;
    }

    /*
     * Show Break By parameter value in pdf export (dropdowns are not rendered in pdf exports)
     * @param {object} context
     * @param {string} parameterName
  *@returns {}
     */
    /*
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
    */
    /*
     * diaplay Program/Survey infor pdf export (dropdowns are not rendered in pdf exports)
     * @param {object} {state: state, report: report, text: text, log: log}
     * @return {paramName} str to append to text component
     */

    static function

    displayDataSourceInfo(context) {

        var state = context.state;
        var log = context.log;
        var str = '';


        var selectedProject: Project = DataSourceUtil.getProject(context);
        str += 'Program Name: ' + selectedProject.ProjectName + ' ';

        if (!state.Parameters.IsNull('p_projectSelector')) {
            var selectedSurvey: ParameterValueResponse = state.Parameters['p_projectSelector'];
            str += 'Survey Name: ' + selectedSurvey.DisplayValue + ' ';
            str = '<div class="data-source-info">' + str + '</div>';
        }

        return str;
    }


}