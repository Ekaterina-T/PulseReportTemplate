class Export {

    static function isExportMode (context) {
        var state = context.state;
        return (state.ReportExecutionMode == ReportExecutionMode.PdfExport || state.ReportExecutionMode == ReportExecutionMode.ExcelExport);
    }

    static function isExcelExportMode (context) {
        var state = context.state;
        return state.ReportExecutionMode == ReportExecutionMode.ExcelExport;
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

        log.LogDebug('displayDataSourceInfo 1');

        if(Config.Surveys.length>1) {
            var selectedProject: Project = DataSourceUtil.getProject(context);
            str+='Program Name: '+selectedProject.ProjectName+' ';
            str += System.Environment.NewLine; // for Excel export
        }
        log.LogDebug('displayDataSourceInfo 2');

        if(!state.Parameters.IsNull('p_projectSelector')) {
            log.LogDebug('displayDataSourceInfo 3 ');
            var selectedSurvey = ParamUtil.GetSelectedOptions(context, 'p_projectSelector')[0];
            log.LogDebug('displayDataSourceInfo 4');
            if(selectedSurvey.Code!=='none') {
                str+= 'Survey Name: '+selectedSurvey.Label+' ';
                str = '<div class="data-source-info">'+str+'</div>';
                str += System.Environment.NewLine; // for Excel export
            }
        }
        log.LogDebug('displayDataSourceInfo 5');
        return str;
    }

}
