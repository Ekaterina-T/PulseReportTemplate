public interface ICustomTable {

    function getFullListOfSurveys () {
    }

    function getFilteredListOfSurveys () {
    }

    function isPulseSurvey() {
    }
}

public class PulseReportalTable implements ICustomTable {

    private var _allSurveysReportalTablePath : String; // "PulseSurveyData:PulseSurveys" = "pageId:tableName"
    private var _visibleSurveysReportalTablePath : String; // "PulseSurveyData:VisibleSurveys" = "pageId:tableName"

    /**
     * cunstructor
     * @param {String} allSurveysReportalTablePath - path to table that lists all existing pulse surveys (not filtered by userid)
     * @param {String} allSurveysReportalTablePath - path to table that lists all available for the user pulse surveys (filtered by userid)
     */
    private function PulseReportalTable(allSurveysReportalTablePath, visibleSurveysReportalTablePath) {
        _allSurveysReportalTablePath = allSurveysReportalTablePath ? allSurveysReportalTablePath : "PulseSurveyData:PulseSurveys";
        _visibleSurveysReportalTablePath = visibleSurveysReportalTablePath ? visibleSurveysReportalTablePath: "PulseSurveyData:VisibleSurveys";
    }

    public static function getInstance(){
        /*

         */
    }

    /**
     * @param {Object} context {state: state, report: report, page: page, user:user, pageContext: pageContext, log: log, confirmit: confirmit}
     * @returns {Boolean} flags if current project is a pulse program
     */
    public function isPulseSurvey(context) {

        return !!getFullListOfSurveys(context).length;
    }

    /**
     * @param {Object} context {state: state, report: report, page: page, user:user, pageContext: pageContext, log: log, confirmit: confirmit}
     * @returns {Array} array of objects {Code: pid, Label: pname} for all existings pulse surveys
     */
    public function getFullListOfSurveys (context) {

        var log = context.log;
        var report = context.report;
        var rawInfo = report.TableUtils.GetRowHeaderCategoryTitles(_allSurveysReportalTablePath);

        return transformTableHeaderTitlesIntoObj(rawInfo);
    }

    /**
     * @param {Object} context {state: state, report: report, page: page, user:user, pageContext: pageContext, log: log, confirmit: confirmit}
     * @returns {Array} array of objects {Code: pid, Label: pname} for user's pulse surveys
     */
    public function getFilteredListOfSurveys (context) {

        var report = context.report;
        var rawInfo = report.TableUtils.GetRowHeaderCategoryTitles(_visibleSurveysReportalTablePath);

        return transformTableHeaderTitlesIntoObj(rawInfo);
    }

    /**
     * help function that transforms string[][] array of row headers into array of standard objects
     * @param {String[][]} string[][] array of row headers
     * @returns {Array} array of objects {Code: pid, Label: pname} for user's pulse surveys
     */
    private function transformTableHeaderTitlesIntoObj(HeaderCategoryTitles) {

        var surveyList = [];

        for(var i=HeaderCategoryTitles.length-1; i>=0; i--) { // reverse order
            var surveyInfo = {};
            surveyInfo.Label = HeaderCategoryTitles[i][0]; //label - inner header
            surveyInfo.Code = HeaderCategoryTitles[i][1]; // pid - outer header
            surveyList[i] = surveyInfo;
        }

        return surveyList;
    }
}

public class CustomTableFabric {

    static function createCustomTable (storageInfo) : ICustomTable {
        return new PulseReportalTable();
    }
}


/*
public class PulseInfoUtil_DBDesignerTable implements ICustomTable {

    private var _table : DBDesignerTable;

    function PulseInfoUtil_DBDesignerTable(context, schemaId, tableName) {

        var confirmit = context.confirmit;
        var schema : DBDesignerSchema = confirmit.GetDBDesignerSchema(schemaId);
        _table = schema.GetDBDesignerTable(tableName);
    }

}
*/