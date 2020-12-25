class ParamUtil {

    /**
  * Populates p_SurveyType parameter based on surveys from Config.
  * @param {object} context - contains Reportal scripting state, log, report, user, parameter objects
  */
    static function LoadParameter_SurveysSelector_ConfigList(context) {

        var parameter = context.parameter;
        var log = context.log;
        var surveys = Config.Surveys;

        for (var i = 0; i < surveys.length; i++) {
            if (!surveys[i].isHidden && UserUtil.isUserValidForSurveybyRole(context, surveys[i].AvailableForRoles, 'load param')) {
                var val: ParameterValueProject = new ParameterValueProject();
                val.ProjectSource = new ProjectSource(ProjectSourceType.DataSourceNodeId, surveys[i].Source);
                parameter.Items.Add(val);
            }
        }

        return;
    }

    /**
     * Adding values to single response parameter
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     */
    static function LoadParameter(context) {

        var parameter = context.parameter;
        var log = context.log;

        //log.LogDebug('param load start '+parameter.ParameterId)
        if (!isParameterToBeLoaded(context)) { // no need to load parameter
            return;
        }
        //log.LogDebug('param load start 1')

        var parameterOptions = ParameterOptions.GetOptions(context, null, 'load'); // get options
        //log.LogDebug('param load start 2')

        for (var i = 0; i < parameterOptions.length; i++) { // populate parameter
            var val = new ParameterValueResponse();
            val.StringKeyValue = parameterOptions[i].Code;
            val.StringValue = parameterOptions[i].Label;
            parameter.Items.Add(val);
        }
        //log.LogDebug('param load end '+parameter.ParameterId)

        return;
    }

    /** 
  * Reset parametrs according to the list.
  * @param {object} context object {state: state}
  * @param {array} parameterList
  */
    static function ResetParameters(context, parameterList) {

        var state = context.state;
        var i;

        for (i = 0; i < parameterList.length; i++) {
            state.Parameters[parameterList[i]] = null;
        }

        return;
    }

    /** 
    * Reset parametrs according to the list.
    * @param {object} context object {state: state}
    * @param {array} parameterList
    */
    static function ResetQuestionBasedParameters(context, parameterList) {

        var state = context.state;
        var i;

        for (i = 0; i < parameterList.length; i++) {
            var paramType = SystemConfig.reportParameterValuesMap[parameterList[i]].type;
            var isTypeToReset = SystemConfig.paramTypesToBeReset[paramType];
            if (isTypeToReset) {
                state.Parameters[parameterList[i]] = null;
            }
        }

        return;
    }

    /**
    * Initialise parametrs on page.
    * Steps to do:
    * - clear all params if new data source is selected
    * - set default values
    * @param {object} context object {state: state, report: report, page: page, log: log}
    */
    static function Initialise(context) {

        var log = context.log;
        var state = context.state;
        var page = context.page;
        var i;
        var mandatoryPageParameters = SystemConfig.mandatoryPageParameters;
        var optionalPageParameters = SystemConfig.optionalPageParameters;

        //log.LogDebug('param init start')
        //set ds if it is not defined
        if (state.Parameters.IsNull('p_SurveyType')) {
            var projectSource = new ProjectSource(ProjectSourceType.DataSourceNodeId, DataSourceUtil.getDefaultDSFromConfig(context));
            state.Parameters['p_SurveyType'] = new ParameterValueProject(projectSource);
        }
        //log.LogDebug('param init start 0')

        // reset all parameters (=null) if a page refreshes when switching surveys
        if (page.SubmitSource === 'surveyType') {
            ResetParameters(context, mandatoryPageParameters.concat(optionalPageParameters));
            Filters.ResetAllFilters(context);
        }
        //log.LogDebug('param init start 1')

        // Actions page parameters: reset 'p_Statements' if 'p_Dimensions' has been reloaded
        if (page.SubmitSource === 'p_Dimensions') {
            ResetParameters(context, ['p_Statements']);
        }
        //log.LogDebug('param init start 2')

        pulseInit(context);
        //log.LogDebug('param init start 3')

        // set default values for mandatory page parameters
        for (i = 0; i <mandatoryPageParameters.length; i++) {
            setDefaultValueForParameter(context, mandatoryPageParameters[i]);
        }
        //log.LogDebug('param init end')
    }


    /**
     * set default value for a parameter
     * @param {Object} context  - object {state: state, log: log}
     * @param {String} paramId - the id of the parameter
     */
    static function setDefaultValueForParameter(context, paramId) {

        var state = context.state;
        var log = context.log;

        // safety check: set default value if not defined or pulse program changed
        if (!state.Parameters.IsNull(paramId)) {
            return;
        }

        //TO DO: check why this try catch is needed
        try {
            var defaultParameterValue = ParameterOptions.getDefaultValue(context, paramId);
            if (!defaultParameterValue) {  //parameter is not defined for this DS or on this page
                return;
            }
        } catch (e) { return; }

        // We can't get the type of parameter (single or multi) before its initialisation.
        // So firstly check if it supports ParameterValueMultiSelect options
        try {
            var valArr;
            if(typeof defaultParameterValue === 'string') {
                valArr = [defaultParameterValue];
            } else {
                valArr = defaultParameterValue;
            }
            setMultiSelectParameter(context, paramId, valArr);

        } catch (e) { //if not, set it as single select parameter
            state.Parameters[paramId] = new ParameterValueResponse(defaultParameterValue);
        }
        
    }

    /**
     * returns key previous pulse surveys
     * @param {Object} context
     * @returns {String}: array of prev pulse surveys
     */
    static public function getPreviousPulseSurveys(context) {

        var log = context.log;
        var state = context.state;
        var previousPulseSurveys = [];

        if(!state.Parameters.IsNull('p_previousProjects')) {
            previousPulseSurveys = JSON.parse(state.Parameters.GetString('p_previousProjects'));
        }
        return previousPulseSurveys;
    }

    /**
     * returns key previous pulse surveys
     * @param {Object} context
     * @param {String} array of prev pulse surveys
     */
    static public function savePreviousPulseSurveys(context, previousPulseSurveys) {
        var log = context.log;
        var state = context.state;
        state.Parameters['p_previousProjects'] = new ParameterValueResponse(JSON.stringify(previousPulseSurveys));
    }

    /**
     * 
     */
    static function selectedPulseSurveysHaveChanged(context) {

        var log = context.log;
        var oldPids = getPreviousPulseSurveys(context);
        var newPids = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');

        if(oldPids) {
           return !ArrayUtil.ifArraysIdentical(oldPids, newPids);
        }

        return false;
    }

    /**
     * param init for pulse programs
     * @param {Object} context  - object {state: state, log: log}
     */
    static function pulseInit(context) {

        // pulse program handler
        if (DataSourceUtil.isProjectSelectorNotNeeded(context)) {
            return;
        }

        var log = context.log;
        var state = context.state;
        var pageContext = context.pageContext;
        var mandatoryPageParameters = SystemConfig.mandatoryPageParameters;
        var optionalPageParameters = SystemConfig.optionalPageParameters;

        // mass export by pid
        var configurableExportMode = Export.isMassExportMode(context);

        if (configurableExportMode) {

            var pidsFromConfig = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'pulsePidToExportBy');

            if(!pidsFromConfig || pidsFromConfig.length === 0) {
                throw new Error('ParamUtil.pulseInit: mass export is enabled but pids are not provided');
            }

            setMultiSelectParameter(context, 'p_projectSelector', pidsFromConfig);
            pageContext.Items['p_projectSelector'] = JSON.stringify(pidsFromConfig);
        }

        //set default pulse baby project
        if (!configurableExportMode && !state.Parameters.IsNull('p_projectSelector')) {

            var selectedPulseSurveys = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');
            var showAll = ParamUtil.GetSelectedCodes(context, 'p_ShowAllPulseSurveys');

            //user unchecked "show all pulse surveys" checkbox while some survey was selected
            if (selectedPulseSurveys[0] !== 'none' && showAll[0] !== 'showAll') {

                var availableProjects = ParameterOptions.GetOptions(context, 'p_projectSelector', 'available proj');
                var surveysThatRemainSelected = [];

                //if available list does include selected project, then don't reset pulse project selector
                for(var i=0; i<selectedPulseSurveys.length; i++) {
                    for (var j = 0; j < availableProjects.length; j++) {
                        if (selectedPulseSurveys[i] === availableProjects[j].Code) {
                            surveysThatRemainSelected.push(selectedPulseSurveys[i]);
                            break;
                        }
                    }
                }

                if (surveysThatRemainSelected.length === 0) {
                    ParamUtil.ResetParameters(context, ['p_projectSelector']);
                } else {
                    setMultiSelectParameter(context, 'p_projectSelector', surveysThatRemainSelected);
                    pageContext.Items['p_projectSelector'] = JSON.stringify(surveysThatRemainSelected);
                }
            }
            
        }

        //in the end project is still undefined -> set default
        if (state.Parameters.IsNull('p_projectSelector')) {
            var defaultVal = ParameterOptions.getDefaultValue(context, 'p_projectSelector');
            setMultiSelectParameter(context, 'p_projectSelector', [defaultVal]);
            pageContext.Items['p_projectSelector'] = JSON.stringify([defaultVal]);
        }

        //reset question and category based params when baby surveys change
        if (selectedPulseSurveysHaveChanged(context)) {
            ResetParameters(context, ['p_Trends_trackerSurveys']);
            ResetQuestionBasedParameters(context, mandatoryPageParameters.concat(optionalPageParameters));
            Filters.ResetAllFilters(context);
        }

        savePreviousPulseSurveys(context, ParamUtil.GetSelectedCodes(context, 'p_projectSelector'));

        //set up object holding questions available on current page
        PulseProgramUtil.setPulseSurveyContentInfo(context);
        PulseProgramUtil.setPulseSurveyContentBaseValues(context);
        
    }

    // --------------------------------- WORKING WITH ONE PARAMETER ---------------------------------

    /**
     * Get selected answer codes of the report parameter (single or multi response)
     * @param {Object} context  - object {state: state, log: log}
     * @param {String} parameterName - the name of the report parameter
     * @returns {Array} - list of selected answer codes
     */
    static function GetSelectedCodes(context, parameterName) {
        var state = context.state;
        var log = context.log;

        //log.LogDebug('---- GetSelectedCodes START for '+parameterName+' ----'); 

        if (state.Parameters.IsNull(parameterName)) {
            return [];
        }

        try {
            var param = state.Parameters[parameterName];

            // single select parameter
            if (param instanceof ParameterValueResponse) {
                return [param.StringKeyValue || state.Parameters.GetString(parameterName)];
            }

            // multi-select response
            if (param instanceof ParameterValueMultiSelect) {
                //log.LogDebug('MULTI')
                var selectedCodes = [];

                for (var i = 0; i < param.Count; i++) {
                    var response: ParameterValueResponse = param[i];
                    var skv = response.StringKeyValue;
                    var sv = response.StringValue;
                    selectedCodes.push(!skv ? sv : skv);      //surprisingly, StringKeyValue can be empty for first page load and the key (i.e. Question Id) can be extracted via StringValue
                }
                return selectedCodes;
            }
        } catch (e) {
            throw new Error('ParamUtil.GetSelectedCodes: undefined parameter type or value for "' + parameterName + '".')
        }
    }

    /** 
  * Get full info about selected answers of the report parameter (single or multi response)
  * @param {Object} context  - object {state: state, log: log}
  * @param {String} parameterName - the name of the report parameter
  * @returns {Array} - list of objects with all parameter properties Code, Label, TimeUnit, etc.
  */
    static function GetSelectedOptions(context, parameterName) {

        var log = context.log;
        var selectedCodes = GetSelectedCodes(context, parameterName);
        var parameterOptions = ParameterOptions.GetOptions(context, parameterName, 'get selected options');
        var selectedOptions = [];

        for (var i = 0; i < selectedCodes.length; i++) {
            for (var j = 0; j < parameterOptions.length; j++) {
                if (selectedCodes[i] === parameterOptions[j].Code) {
                    selectedOptions.push(parameterOptions[j]);
                    break;
                }
            }
        }

        return selectedOptions;
    }

    /**
     *
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     */
    static function MaskParameter(context) {

        var parameterId = context.parameterId;
        var mask = context.mask;
        var log = context.log;
        var report = context.report;

        //log.LogDebug('mask start '+parameterId)

        if (parameterId === 'p_Statements') {
            mask.Access = ParameterAccessType.Inclusive;

            var dimension = ParamUtil.GetSelectedCodes(context, 'p_Dimensions')[0];
            var qIds = report.TableUtils.GetRowHeaderCategoryIds("QuestionsByDimension");
            for (var i = 0; i < qIds.length; i++) {
                mask.Keys.Add(qIds[i]);
            }

        }
        //log.LogDebug('mask end '+parameterId)
    }

    /**
     * Check if parameter needed to be loaded with values, i.e. relevant for the survey
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @return {Boolean}
     */
    static function isParameterToBeLoaded(context) {


        var log = context.log;
        //log.LogDebug('isParameterToBeLoaded 0');
        var parameter = context.parameter;
        var parameterName = parameter.ParameterId;
        var pageId;
        //log.LogDebug('isParameterToBeLoaded 1');

        var isPulseProgram = !DataSourceUtil.isProjectSelectorNotNeeded(context);
        //log.LogDebug('isParameterToBeLoaded 2');

        if (parameterName === 'p_projectSelector') {
            return isPulseProgram;
        }

        if (parameterName === 'p_Results_CountsPercents') {
            var user = context.user;

            if (user.UserType != ReportUserType.Enduser) {
                return true;
            }

            var isDetailedView = false;
            var detailedViewRoles = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'DetailedViewRoles');

            if (!detailedViewRoles || detailedViewRoles.length <= 0) {
                return true;
            }

            for (var i = 0; i < detailedViewRoles.length; i++) {
                if (user.HasRole(detailedViewRoles[i])) {
                    isDetailedView = true;
                    break;
                }
            }

            return isDetailedView;
        }

        // TO DO: pageNames are specified explicitly - this is very bad
        // think how to pass load condition differently, so that LCL would call some func and would be more flexible
        
        /*if (parameterName === 'p_Results_TableTabSwitcher') {
            return isPulseProgram; // only needed for pulse programs
        }*/

        if(parameterName === 'p_TimeUnitWithDefault') {
            //in export with loop by param it may cause troubles (pageid)
            //because param load script runs before page script
            pageId = PageUtil.getCurrentPageIdInConfig(context);
            if(pageId === 'Page_Trends') {
                return !isPulseProgram;
            }
        }

        if (parameterName === 'p_Trends_trackerSurveys') {
            // only needed for pulse programs when tracker string is not provided
            return isPulseProgram;
        }

        if (parameterName === 'p_AcrossAllSurveys') {
            return isPulseProgram; // only needed for pulse programs
        }

        if(parameterName === 'p_Results_ComparisonSurveys') {
            return isPulseProgram; // only needed for pulse programs
        }

        if (parameterName === 'p_Results_BreakBy') {
            var breakBy = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Results', 'BreakVariables');
            return (breakBy && breakBy.length > 0) ? true : false;
        }

        if (parameterName === 'p_TimeUnitNoDefault') {
            var breakByTimeUnits = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Results', 'BreakByTimeUnits');
            return breakByTimeUnits ? true : false;
        }

        if (parameterName === 'p_CategoricalDD_BreakBy') {
            var breakBy = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_CategoricalDrilldown', 'BreakVariables');
            return (breakBy && breakBy.length > 0) ? true : false;
        }

        if (parameterName === 'p_CatDD_TimeUnitNoDefault') {
            var breakByTimeUnits = DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_CategoricalDrilldown', 'BreakByTimeUnits');
            return breakByTimeUnits ? true : false;
        }

        if (parameterName === 'p_BenchmarkSet') {
            return DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Results', 'BenchmarkSet') ? true : false;
        }

        if(parameterName === 'p_DisplayMode') {
            pageId = PageUtil.getCurrentPageIdInConfig(context);
            return !(pageId === 'Page_Trends' && isPulseProgram);
        }
        //log.LogDebug('isParameterToBeLoaded 3');

        if(parameterName === 'p_CustomOpenTextQs') {
            var isOnePulseProjectSelected = ParamUtil.GetSelectedCodes(context,'p_projectSelector').length === 1;
            return isPulseProgram && isOnePulseProjectSelected;
        }

        //log.LogDebug('isParameterToBeLoaded 4');

        return true;
    }

    /**
     * sets value for multi-select string parameter based on array of values
     * @param {Object} context
     * @param {String} parameterId
     * @param {Array} array of strings, i.e. options' codes
     */
    static function setMultiSelectParameter(context, parameterId, parameterValues) {
        // multi string response parameter
        var valArr = [];
        var log = context.log;

        for(var i=0; i<parameterValues.length; i++) {
            valArr.push(new ParameterValueResponse(parameterValues[i]));
        }

        context.state.Parameters[parameterId] = new ParameterValueMultiSelect(valArr);
    }

    /**
     * Checks if parameter has no options
     * @param {object} context
     * @param: {string} - parameterName
     * @return {Boolean}
     */
    static function isParameterEmpty(context, parameterName) {

        var log = context.log;
        var parameterOptions = ParameterOptionsBuilder.GetOptions(context, parameterName);

        if (parameterOptions.length == 0) {
            return true;
        }
        return false;
    }
}