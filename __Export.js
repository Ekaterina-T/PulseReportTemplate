class Export {

    static function isExportMode (context) {
        var state = context.state;
        return (state.ReportExecutionMode === ReportExecutionMode.PdfExport || state.ReportExecutionMode === ReportExecutionMode.ExcelExport);
    }

    static function isExcelExportMode (context) {
        var state = context.state;
        return state.ReportExecutionMode === ReportExecutionMode.ExcelExport;
    }

    static function isPdfExportMode (context) {
      var state = context.state;
      return state.ReportExecutionMode === ReportExecutionMode.PdfExport;
    }

    /**
     * diaplay Program/Survey infor pdf export (dropdowns are not rendered in pdf exports)
     * @param {object} {state: state, report: report, text: text, log: log}
     * @return {paramName} str to append to text component
     */
    static function displayDataSourceInfo(context) {

        var state = context.state;
        var log = context.log;
        var str = '';
        
        var selectedProject: Project = DataSourceUtil.getProject(context);
        str+='Program Name: '+selectedProject.ProjectName+' ';

        if(!state.Parameters.IsNull('p_projectSelector')) {
            var selectedSurvey: ParameterValueResponse = state.Parameters['p_projectSelector'];
            if(selectedSurvey.StringKeyValue!=='none') {
                str+= 'Survey Name: '+selectedSurvey.DisplayValue+' ';
                str = '<div class="data-source-info">'+str+'</div>';
            }
        }

        return str;
    }


}