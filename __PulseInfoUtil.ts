public interface IPulseSurveysInfo {

    function getAllPulseSurveys () {}

    function getVisiblePulseSurveys () {}
}

public class PulseSurveys_ReportalTable implements IPulseSurveysInfo {

    private var _allPulseSurveysTablePath : String; // "PulseSurveyData:PulseSurveys" = "pageId:tableName"
    private var _visiblePulseSurveysTablePath : String; // "PulseSurveyData:VisibleSurveys" = "pageId:tableName"

    /**
     * constructor
     * @param {String} allSurveysReportalTablePath - path to table that lists all existing pulse surveys (not filtered by userid)
     * @param {String} allSurveysReportalTablePath - path to table that lists all available for the user pulse surveys (filtered by userid)
     */
    private function PulseSurveys_ReportalTable(allPulseSurveysTablePath, visiblePulseSurveysTablePath) {
        _allPulseSurveysTablePath = allPulseSurveysTablePath ? allPulseSurveysTablePath : "PulseSurveyData:PulseSurveys";
        _visiblePulseSurveysTablePath = visiblePulseSurveysTablePath ? visiblePulseSurveysTablePath: "PulseSurveyData:VisibleSurveys";
    }

    /**
     * creates instance of PulseSurveys_ReportalTable class, should have check if instance is created already (singleton)
     */
    public static function getInstance(){        
        return new PulseSurveys_ReportalTable();
    }

    /**
     * implements interface
     * @param {Object} context {state: state, report: report, page: page, user:user, pageContext: pageContext, log: log, confirmit: confirmit}
     * @returns {Array} array of objects {Code: pid, Label: pname} for all existings pulse surveys
     */
    public function getAllPulseSurveys(context) {

        var report = context.report;
        var rawInfo = report.TableUtils.GetRowHeaderCategoryTitles(_allPulseSurveysTablePath);

        return transformTableHeaderTitlesIntoObj(rawInfo);
    }

    /**
     * implements interface
     * @param {Object} context {state: state, report: report, page: page, user:user, pageContext: pageContext, log: log, confirmit: confirmit}
     * @returns {Array} array of objects {Code: pid, Label: pname} for user's pulse surveys
     */
    public function getVisiblePulseSurveys(context) {

        var report = context.report;
        var rawInfo = report.TableUtils.GetRowHeaderCategoryTitles(_visiblePulseSurveysTablePath);

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

public class PulseSurveysInfoFabric {

    static function getPulseSurveysInfo(storageInfo) : IPulseSurveys {
        PulseSurveys_ReportalTable.getInstance();
    }
}

/*
public class PulseSurveys_DBDesignerTable implements IPulseSurveysInfo {

    private var _table : DBDesignerTable;

    function PulseInfoUtil_DBDesignerTable(context, schemaId, tableName) {

        var confirmit = context.confirmit;
        var schema : DBDesignerSchema = confirmit.GetDBDesignerSchema(schemaId);
        _table = schema.GetDBDesignerTable(tableName);
    }

}
*/