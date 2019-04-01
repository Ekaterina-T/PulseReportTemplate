class ParamUtil {

    /*
     * Object with resources (values) for parameters.
     * - propertyName: name of property (the lowest level of the path so to say) that keeps the value
     * - type (type of data): StaticArrayofObjects (static array text values in format {Code: code, Label: label}), QuestionList (array of question ids), QuestionId (sring with questionId)
     * - locationType (where data is stored): TextAndParameterLibrary (as is), Page (in page property), Survey (in survey property), Report (general report property in Config)
     * - page: when locationType is 'Page' this property specifies pageId
     */

    static var reportParameterValuesMap = {
        'p_Results_CountsPercents':   { propertyName: 'Distribution',              type: 'StaticArrayofObjects', locationType: 'TextAndParameterLibrary'},
        'p_Results_TableTabSwitcher': { propertyName: 'ResultsTabSwitcher',        type: 'StaticArrayofObjects', locationType: 'TextAndParameterLibrary'},
        'p_TimePeriod':               { propertyName: 'TimePeriods',               type: 'StaticArrayofObjects', locationType: 'TextAndParameterLibrary'},
        'p_TimeUnitWithDefault':      { propertyName: 'TimeUnitsWithDefaultValue', type: 'StaticArrayofObjects', locationType: 'TextAndParameterLibrary'},
        'p_TimeUnitNoDefault':        { propertyName: 'TimeUnitsNoDefaultValue',   type: 'StaticArrayofObjects', locationType: 'TextAndParameterLibrary'},
        'p_CatDD_TimeUnitNoDefault':  { propertyName: 'TimeUnitsNoDefaultValue',   type: 'StaticArrayofObjects', locationType: 'TextAndParameterLibrary'},

        'p_Results_BreakBy':      { propertyName: 'BreakVariables',        type: 'QuestionList', locationType: 'Page', page: 'Page_Result'},
        'p_CategoricalDD_BreakBy':{ propertyName: 'BreakVariables',        type: 'QuestionList', locationType: 'Page', page: 'Page_CategoricalDrilldown'},
        'p_ResponseRate_BreakBy': { propertyName: 'BreakVariables',        type: 'QuestionList', locationType: 'Page', page: 'Page_Response_Rate'},
        'p_Demographics':         { propertyName: 'DemographicsQuestions', type: 'QuestionList', locationType: 'Page', page: 'Page_Response_Rate'},
        'p_OpenTextQs':           { propertyName: 'Comments',              type: 'QuestionList', locationType: 'Page', page: 'Page_Comments'},
        'p_ScoreQs':              { propertyName: 'ScoresForComments',     type: 'QuestionList', locationType: 'Page', page: 'Page_Comments'},
        'p_TagQs':                { propertyName: 'TagsForComments',       type: 'QuestionList', locationType: 'Page', page: 'Page_Comments'},
        'p_TrendQs':              { propertyName: 'TrendQuestions' ,       type: 'QuestionList', locationType: 'Page', page: 'Page_Trends'},

        'p_BenchmarkSet': { propertyName: 'BenchmarkSet', type: 'StaticArrayofObjects', locationType: 'Page', page: 'Page_Result'}
    };

    // mandatory parameters can be single or multi. Must have default value when a page opens
    static var mandatoryPageParameters = ['p_TimeUnitWithDefault', 'p_TimePeriod', 'p_OpenTextQs', 'p_TrendQs', 'p_Demographics', 'p_BenchmarkSet'];

    // optional parameters are usually multiple. Can be empty by default
    static var optionalPageParameters = ['p_ScoreQs', 'p_TagQs', 'p_TimeUnitNoDefault', 'p_CatDD_TimeUnitNoDefault']; // we must add them empty option as 1st value instead


    /*
     * Populates p_SurveyType parameter based on surveys from Config.
     * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
     */

    static function LoadParameter_SurveysSelector_ConfigList(context) {

        var parameter = context.parameter;
        var log = context.log;
        var surveys = Config.Surveys;

        for (var i=0; i<surveys.length; i++) {

            if(!surveys[i].isHidden && User.isUserValidForSurveybyRole(context, surveys[i].AvailableForRoles)) {
                var val : ParameterValueProject = new ParameterValueProject();
                val.ProjectSource = new ProjectSource(ProjectSourceType.DataSourceNodeId, surveys[i].Source);
                parameter.Items.Add(val);
            }
        }

        return;
    }

    /*
    * Populates p_projectSelector based on pid and pname questions.
    * @param {object} context - contains Reportal scripting state, log, report, parameter objects
    */

    static function LoadParameter_SurveysSelector_PidPname(context) {

        var log = context.log;
        var parameter = context.parameter;
        var project : Project = DataSourceUtil.getProject(context);

        if(project.GetQuestion('pid') != null) {

            var pid : Answer[] = (Question(project.GetQuestion('pid'))).GetAnswers();
            var pname : Answer[] = (Question(project.GetQuestion('pname'))).GetAnswers();

            for(var i=0; i<pid.length; i++) {
                var val = new ParameterValueResponse();
                val.StringValue = pname[i].Precode;
                val.StringKeyValue = pid[i].Precode;
                parameter.Items.Add(val);
            }
        }

        return;
    }

    /*
     * This function returns parameter options in standardised format.
     * @param: {object} - context {state: state, report: report, parameter: parameter, log: log}
     * @param: {string} - parameterName optional, contains parameterId to get parameter's default value
     * @returns: {array} - [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */

    static function GetParameterOptions (context, parameterName) {

        var state = context.state;
        var report = context.report;
        var log = context.log;
        var parameterId = context.hasOwnProperty('parameter') ? context.parameter.ParameterId : parameterName;
        var parameterResource = reportParameterValuesMap[parameterId]; //where to take parameter values from
        var propertyValue;
        var parameterOptions = [];
        var language = report.CurrentLanguage;
        var i;

        if(!parameterResource) {
            throw new Error('ParamUtil.GetParameterOptions: either parameterId or parameter resource for this parameter is undefined.');
        }

        // fetch propertyValue and then transform into needed format
        // locationType will tell where to fetch value from

        if(parameterResource.locationType === 'TextAndParameterLibrary') {

            propertyValue = TextAndParameterLibrary.ParameterValuesLibrary[parameterResource.propertyName]; // return value as is
        } else if(parameterResource.locationType === 'Page') {

            propertyValue = DataSourceUtil.getPagePropertyValueFromConfig (context, parameterResource.page, parameterResource.propertyName); // static array, qid array, qid
        }

        if(!propertyValue) {
            return [];
        }

        // type will tell how to handle it; by that moment propertyValue must be defined

        // static arrays with predefined options
        if(parameterResource.type === 'StaticArrayofObjects') {

            for(i=0; i<propertyValue.length; i++) {

                var option = {};  // {Code:'', Label: ''}

                for(var prop in propertyValue[i]) {
                    if(prop !== 'Label') {
                        option[prop] = propertyValue[i][prop];
                    } else {
                        option[prop] = propertyValue[i][prop][language];
                    }
                }

                parameterOptions.push(option);
            }

            return parameterOptions;
        }

        // propertyValue is list of question ids, i.e. populate question selector
        if(parameterResource.type === 'QuestionList') {

            if(!propertyValue instanceof Array) {

                throw new Error('ParamUtil.GetParameterOptions: expected parameter type cannot be used, array of objects was expected.');
            }

            for(i=0; i<propertyValue.length; i++) {

                var option = {};
                option.Code = propertyValue[i]; // propertyValue[i] is qid in this case
                option.Label = QuestionUtil.getQuestionTitle(context, propertyValue[i]);
                parameterOptions.push(option);
            }

            return parameterOptions;
        }

        // propertyValue is questionId
        if(parameterResource.type === 'QuestionAnswers') {

            var answers: Answer[];

            try {
                answers = QuestionUtil.getQuestionAnswers(context, propertyValue);
            } catch(e) {
                throw new Error('ParamUtil.GetParameterOptions: expected parameter type cannot be used, '+e.Message);
            }

            for(i=0; i<answers.length; i++) {

                var option = {};
                option.Code = answers[i].Precode;
                option.Label = answers[i].Text;
                parameterOptions.push(option);
            }

            return parameterOptions;
        }

        throw new Error('ParamUtil.GetParameterOptions: parameter options cannot be defined.');
    }


    /*
     * Adding values to single response parameter
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     */
    static function LoadParameter (context) {

        var parameter = context.parameter;
        var log = context.log;

        if(!isParameterToBeLoaded(context)) {
            return;
        }

        var parameterOptions = GetParameterOptions(context); // get options

        for(var i=0; i<parameterOptions.length; i++) { // populate parameter

            var val = new ParameterValueResponse();
            val.StringKeyValue = parameterOptions[i].Code;
            val.StringValue = parameterOptions[i].Label;
            parameter.Items.Add(val);
        }

        return;
    }

    /*
     * Check if parameter needed to be loaded with values, i.e. relevant for the survey
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @return {Boolean}
     */
    static function isParameterToBeLoaded (context) {

        var parameter = context.parameter;
        var parameterName = parameter.ParameterId;
        var log = context.log;

        // TO DO: pageNames are specified explicitly - this is very bad
        if(parameterName === 'p_Results_TableTabSwitcher') {
            return !DataSourceUtil.isProjectSelectorNeeded(context); // only needed for pulse programs
        }

        if(parameterName === 'p_Results_BreakBy') {
            var breakBy = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Result', 'BreakVariables');
            return (breakBy && breakBy.length > 0) ? true : false;
        }

        if(parameterName === 'p_TimeUnitNoDefault') {
            var breakByTimeUnits = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Result', 'BreakByTimeUnits');
            return breakByTimeUnits ? true : false;
        }

        if(parameterName === 'p_CategoricalDD_BreakBy') {
            var breakBy = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_CategoricalDrilldown', 'BreakVariables');
            return (breakBy && breakBy.length > 0) ? true : false;
        }

        if(parameterName === 'p_CatDD_TimeUnitNoDefault') {
            var breakByTimeUnits = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_CategoricalDrilldown', 'BreakByTimeUnits');
            return breakByTimeUnits ? true : false;
        }

        if(parameterName === 'p_BenchmarkSet') {
            return DataSourceUtil.getPagePropertyValueFromConfig(context, 'Result', 'BenchmarkSet') ? true : false;
        }

        return true;
    }

    /*
     * Get defaultParameterValue for parameter
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @param {string} parameterName
     * @returns {object} default value
     */

    static function getDefaultParameterValue(context, parameterName) {

        var log = context.log;
        var parameterOptions = GetParameterOptions(context, parameterName); // get all options

        return parameterOptions.length>0 ? parameterOptions[0].Code : null; // return the 1st option
    }

    /*
     * Reset parametrs according to the list.
     * @param {object} context object {state: state}
     * @param {array} parameterList
     */

    static function ResetParameters (context, parameterList) {

        var state = context.state;
        var i;

        for(i=0; i<parameterList.length; i++) {
            state.Parameters[parameterList[i]] = null;
        }

        return;
    }


    /*
     * Initialise parametrs on page.
     * Steps to do:
     * - clear all params if new data source is selected
     * - set default values
     * @param {object} context object {state: state, report: report, page: page, log: log}
     */

    static function Initialise (context) {

        var state = context.state;
        var report = context.report;
        var page = context.page;
        var log = context.log;
        var i;

        // reset all parameters if a page refreshes when switching the surveys
        if (page.SubmitSource === 'surveyType') {
            ResetParameters(context, mandatoryPageParameters.concat(optionalPageParameters));
            Filters.ResetAllFilters(context);
        }

        //set ds if it is not defined
        if (state.Parameters.IsNull('p_SurveyType')) {
            var projectSource = new ProjectSource(ProjectSourceType.DataSourceNodeId, DataSourceUtil.getDefaultDSFromConfig(context));
            state.Parameters['p_SurveyType'] = new ParameterValueProject(projectSource);
        }

        // set default values for mandatory page parameters
        for(i=0; i<mandatoryPageParameters.length; i++) {

            if (state.Parameters.IsNull(mandatoryPageParameters[i])){ // safety check: set default value if not defined

                var defaultParameterValue = getDefaultParameterValue(context, mandatoryPageParameters[i]);

                if(!defaultParameterValue) {//parameter is not defined for this DS or on this page
                    continue;
                }

                // We can't get the type of parameter (single or multi) before its initialisation.
                // So firstly check if it supports ParameterValueMultiSelect options
                try {
                    var valArr = [new ParameterValueResponse(defaultParameterValue)];
                    var multiResponse : ParameterValueMultiSelect = new ParameterValueMultiSelect(valArr);
                    state.Parameters[mandatoryPageParameters[i]] = multiResponse;
                }
                    //if not, set it as single select parameter
                catch (e) {
                    state.Parameters[mandatoryPageParameters[i]] = new ParameterValueResponse(defaultParameterValue);
                }
            }
        }

    }

    /*
     * Get selected answer codes of the report parameter (single or multi response)
     * @param {Object} context  - object {state: state, log: log}
     * @param {String} parameterName - the name of the report parameter
     * @returns {Array} - list of selected answer codes
    */

    static function GetSelectedCodes (context, parameterName) {
        var state = context.state;
        var log = context.log;

        if (state.Parameters.IsNull(parameterName))
            return [];

        try {
            var param = state.Parameters[parameterName];

            // single select parameter
            if (param instanceof ParameterValueResponse) {
                return [param.StringKeyValue || state.Parameters.GetString(parameterName)];
            }

            // multi-select response
            if (param instanceof ParameterValueMultiSelect) {
                var selectedCodes = [];
                for (var i=0; i<param.Count; i++) {
                    var response : ParameterValueResponse = param[i];
                    selectedCodes.push(response.StringValue || response.StringKeyValue);      //surprisingly, StringKeyValue can be empty for first page load and the key (i.e. Question Id) can extracted via StringValue
                }
                return selectedCodes;
            }

        }
        catch (e) {
            throw new Error ('ParamUtil.GetSelectedCodes: undefined parameter type or value for "'+parameterName+'".')
        }
    }


    /* TO REVIEW */
    /*
    * Get full info about selected answers of the report parameter (single or multi response)
    * @param {Object} context  - object {state: state, log: log}
    * @param {String} parameterName - the name of the report parameter
    * @returns {Array} - list of objects with all parameter properties Code, Label, TimeUnit, etc.
    */

    static function GetSelectedOptions (context, parameterName) {

        var log = context.log;
        var selectedCodes = GetSelectedCodes (context, parameterName);
        var parameterOptions = GetParameterOptions( context, parameterName);
        var selectedOptions = [];

        for (var i=0; i<selectedCodes.length; i++) {
            for (var j=0; j<parameterOptions.length; j++) {
                if (selectedCodes[i] === parameterOptions[j].Code) {
                    selectedOptions.push(parameterOptions[j]);
                    break;
                }
            }
        }

        return selectedOptions;
    }

}