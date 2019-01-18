class ParamUtil {

    /*
     * Object with resources (values) for parameters.
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     */

    static var reportParameterValues = {
        'p_Results_CountsPercents' : 'Distribution',
        'p_Results_TableTabSwitcher' : 'ResultsTabSwitcher',
        'p_TimePeriod' : 'TimePeriods',
        'p_TimeUnit' : 'TimeUnits',

        'p_BreakBy' : 'BreakVariables',
        'p_Demographics' : 'DemographicsQuestions',
        'p_OpenTextQs' : 'Comments',
        'p_ScoreQs' : 'ScoresForComments',
        'p_TagQs' : 'TagsForComments',
        'p_TrendQs' : 'TrendQuestions'
    };


    /*
     * Populates p_SurveyType parameter based on surveys from Config.
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     */

    static function LoadParameter_SurveysSelector_ConfigList(context) {

        var parameter = context.parameter;
        var log = context.log;
        var surveys = Config.Surveys;

        for (var i=0; i<surveys.length; i++) {

            if(!surveys[i].ifHide) {
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
     * Adding values to string response parameter with options from a question's answers
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @param {string} parameterResource - list of questions from survey's Config property
     */

    static function LoadParameter_QuestionSelector (context, parameterResource)  {

        var report = context.report;
        var state = context.state;
        var parameter = context.parameter;
        var log = context.log;

        var i;

        for (i=0; i<parameterResource.length; i++) {

            var parameterValue : ParameterValueResponse = new ParameterValueResponse();
            var qId = parameterResource[i];
            var qText = QuestionUtil.getQuestionTitle(context, qId);

            parameterValue.StringKeyValue = qId;
            parameterValue.StringValue = qText;
            parameter.Items.Add(parameterValue);
        }

        return;
    }

    /*
     * Adding values to single response parameter based on static list from TextAndParameterLibrary.
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @param {array} parameterResource is an array of objects like this: { Code:'P', Label: { en: 'Percent', no: 'Prosent' }}
     */

    static function LoadParameter_StaticPredefinedValues (context, parameterResource)  {

        var state = context.state;
        var report = context.report;
        var parameter = context.parameter;
        var log = context.log;
        var language = report.CurrentLanguage;
        var i;

        for(i=0; i<parameterResource.length; i++) {

            var parameterValue : ParameterValueResponse = new ParameterValueResponse();
            var code = parameterResource[i].Code;
            var label = parameterResource[i].Label[language];

            if(label == null) {
                throw new Error('ParamUtil.LoadParameter_StaticPredefinedValues: no label for code "'+code+'" and language "'+language+'" was found.');
            }

            parameterValue.StringKeyValue = code;
            parameterValue.StringValue = label;
            parameter.Items.Add(parameterValue);
        }

        return;
    }


    /*
     * Adding values to single response parameter
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     */

    static function LoadParameter (context) {

        var state = context.state;
        var parameter = context.parameter;
        var log = context.log;
        var parameterReference = reportParameterValues[parameter.ParameterId];
        var parameterType;
        var parameterResource;

        if(parameterReference == null) {
            throw new Error ('ParamUtil.LoadParameter: No parameterReferense was found for "'+parameter.ParameterId+'".')
        }

        if(TextAndParameterLibrary.ParameterValuesLibrary.hasOwnProperty(parameterReference)) {
            parameterType = 'staticList';
        } else {
            parameterType = 'questionSelector';
        }

        if(parameterType === 'questionSelector') {

            parameterResource = DataSourceUtil.getPropertyValueFromConfig(context, parameterReference);
            LoadParameter_QuestionSelector(context, parameterResource);

        } else if (parameterType === 'staticList') {

            parameterResource = TextAndParameterUtil.getParameterValuesByKey(parameterReference); // array of option objects
            LoadParameter_StaticPredefinedValues(context, parameterResource);

        }

        return;
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

        var pageLevelParameters = ['p_ScoreQs', 'p_OpenTextQs', 'p_TagQs', 'p_TrendQs', 'p_Demographics'];
        var filterParameters = ['p_TimeUnit', 'p_TimePeriod', 'p_OpenTextQs', 'p_TrendQs', 'p_Demographics'];
        var i;

        // reset parameters if a page refreshes when switching the surveys
        if (page.SubmitSource == 'p_SurveyType') {

            ResetParameters(context, pageLevelParameters);
            Filters.ResetAllFilters(context);
        }

        //set ds if it is not defined
        if (state.Parameters.IsNull('p_SurveyType')) {

            var projectSource = new ProjectSource(ProjectSourceType.DataSourceNodeId, DataSourceUtil.getDefaultDSFromConfig(context));
            state.Parameters['p_SurveyType'] = new ParameterValueProject(projectSource);
        }

        // set default values for mandotary page parameters

        for(i=0; i<filterParameters; i++) {
            if (state.Parameters.IsNull(filterParameters[i])){ // safety check: set default value if not defined

                var keyName = reportParameterValues[filterParameters[i]];
                state.Parameters[filterParameters[i]] = new ParameterValueResponse(TextAndParameterUtil.getDefaultParameterCodeByKey(keyName));

            }
        }
    }



    //-----------------------------------------------------------------------------------
    // Summary:
    // GetParamCode is used to get the current code value of a given string response parameter
    // where the string response parameter has an associated list of selectable items.
    //
    // Parameter inputs:
    //   * context - contains Reportal scripting state object.
    //   * parameterName - The name of the string response parameter to get the value from.
    // Returns:
    //   * The string code value of the given parameter. If the parameter does not have a string
    //     code value null is returned.
    //
    static function GetParamCode (context, parameterName) {
        var state = context.state;
        if (state.Parameters.IsNull(parameterName))
            return null;
        var pvr : ParameterValueResponse = state.Parameters[parameterName];
        if (pvr.StringKeyValue != null && pvr.StringKeyValue !='')
            return pvr.StringKeyValue;
        return state.Parameters.GetString(parameterName);

    }

    static function Selected(context, parameterName, configParameterName)  {
        var Log = context.log;
        var field : System.Reflection.FieldInfo = Config.GetField(configParameterName);
        var paramValues = field.GetValue(Config);
        var currentCode = GetParamCode(context, parameterName);
        for(var i = 0; i < paramValues.length; i++)
        {
            if(paramValues[i].Code == currentCode) {
                return paramValues[i];
            }
        }
    }


    /**
     * show break by value in pdf export
     * (dropdowns are not rendered in pdf exports)
     */

    static function breakByLabelForPdfExport (state, paramName){

        var str = 'Break by: ';

        if (state.ReportExecutionMode == ReportExecutionMode.PdfExport) {

            if (state.Parameters.IsNull(paramName)) {
                str+='none';
            } else {
                var selectedOption : ParameterValueResponse = state.Parameters[paramName];
                str+= selectedOption.DisplayValue;
            }
        }

        return str;
    }
}