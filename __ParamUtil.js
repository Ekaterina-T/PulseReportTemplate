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
            if (!surveys[i].isHidden && User.isUserValidForSurveybyRole(context, surveys[i].AvailableForRoles, 'load param')) {
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

        var currentPage = context.pageContext.Items['CurrentPageId'];

        if (!isParameterToBeLoaded(context)) { // no need to load parameter
            return;
        }

        var parameterOptions = ParameterOptionsBuilder.GetOptions(context, null, 'load'); // get options

        for (var i = 0; i < parameterOptions.length; i++) { // populate parameter
            var val = new ParameterValueResponse();
	 if (parameterOptions[i].Code != '2020H1') {
            val.StringKeyValue = parameterOptions[i].Code;
            val.StringValue = parameterOptions[i].Label;
            parameter.Items.Add(val);
	 }
         else {
		 log.LogDebug('Here comes the 2020H1 code');
	 }
        }

        return;
    }


    /**
     * Get defaultParameterValue for parameter
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @param {string} parameterName
     * @returns {string} default value
     */
    static function getDefaultParameterValue(context, parameterName) {

        var log = context.log;
        var parameterOptions = ParameterOptionsBuilder.GetOptions(context, parameterName, 'get default'); // get all options
        if (parameterName == 'p_Wave') {
			log.LogDebug('p_Wave options:');
		for (var i = 0; i < parameterOptions.length; i++) {
			log.LogDebug(parameterOptions[i].Code);
		 }
		}
        var paramInfo = SystemConfig.reportParameterValuesMap[parameterName];
        
        /*if (parameterName == 'p_Wave' && parameterOptions.length == 0) {
			if (DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'DefaultWaveValue')) {
				return DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'DefaultWaveValue');
			}
			else {
				throw new Error('ParamUtil.getDefaultParameterValue: DefaultWaveValue is not defined in Config');
			}
		}*/

        if (!DataSourceUtil.isProjectSelectorNotNeeded(context) && paramInfo.hasOwnProperty('isQuestionBased') && paramInfo['isQuestionBased']) {
            var qidsWithData = PulseProgramUtil.getPulseSurveyContentInfo_ItemsWithData(context);

            for (var i = 0; i < parameterOptions.length; i++) {
                if (qidsWithData.hasOwnProperty(parameterOptions[i].Code)) {
                    return parameterOptions[i].Code;
                }
            }
        }

        if (DataSourceUtil.isProjectSelectorNotNeeded(context) || !paramInfo.hasOwnProperty('isQuestionBased')) {
            return parameterOptions.length > 0 ? parameterOptions[0].Code : ''; // return the 1st option
        }

        return null;
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

        var state = context.state;
        var page = context.page;
        var log = context.log;
        var i;
        var mandatoryPageParameters = SystemConfig.mandatoryPageParameters;
        var optionalPageParameters = SystemConfig.optionalPageParameters;
        //log.LogDebug('param init start')

        //set ds if it is not defined
        if (state.Parameters.IsNull('p_SurveyType')) {
            var projectSource = new ProjectSource(ProjectSourceType.DataSourceNodeId, DataSourceUtil.getDefaultDSFromConfig(context));
            state.Parameters['p_SurveyType'] = new ParameterValueProject(projectSource);
        }

        // reset all parameters (=null) if a page refreshes when switching surveys
        if (page.SubmitSource === 'surveyType') {
            ResetParameters(context, mandatoryPageParameters.concat(optionalPageParameters));
            Filters.ResetAllFilters(context);
        }

        // Actions page parameters: reset 'p_Statements' if 'p_Dimensions' has been reloaded
        if (page.SubmitSource === 'p_Dimensions') {
            ResetParameters(context, ['p_Statements']);
        }

        //log.LogDebug('project selector processing end')
        pulseRelatedParamsInit(context);

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

        try {
            var defaultParameterValue = getDefaultParameterValue(context, paramId);
            //log.LogDebug('default for '+mandatoryPageParameters[i]+': '+defaultParameterValue)
            if (!defaultParameterValue) {  //parameter is not defined for this DS or on this page
                return;
            }
        } catch (e) { return; }

        // We can't get the type of parameter (single or multi) before its initialisation.
        // So firstly check if it supports ParameterValueMultiSelect options
        try {
            var valArr = [new ParameterValueResponse(defaultParameterValue)];
            var multiResponse: ParameterValueMultiSelect = new ParameterValueMultiSelect(valArr);
            state.Parameters[paramId] = multiResponse;
        }
            //if not, set it as single select parameter
        catch (e) {
            state.Parameters[paramId] = new ParameterValueResponse(defaultParameterValue);
        }
    }

    /**
     * param init for pulse programs
     * @param {Object} context  - object {state: state, log: log}
     */
    static function pulseRelatedParamsInit(context) {

        var log = context.log;
        var mandatoryPageParameters = SystemConfig.mandatoryPageParameters;
        var optionalPageParameters = SystemConfig.optionalPageParameters;

        // pulse program handler
        if (DataSourceUtil.isProjectSelectorNotNeeded(context)) {
            return;
        }

        var state = context.state;
        var page = context.page;

        // mass export by pid
        var pidFromConfig = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'pulsePidToExportBy');
        var configurableExportMode = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'configurableExportMode');

        if(configurableExportMode && pidFromConfig && pidFromConfig.length > 0) {
            state.Parameters['p_projectSelector'] = new ParameterValueResponse(pidFromConfig[0]);
            context.pageContext.Items['p_projectSelector'] = pidFromConfig[0];
        }

        var selectedPulseSurvey = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');

        //TODO: there's some mess around selectedPulseSurvey[0] values
        if (selectedPulseSurvey[0] === "") { //needed because report return values are not stable
            ParamUtil.ResetParameters(context, ['p_projectSelector']);
        }

        //set default pulse baby project
        if (!state.Parameters.IsNull('p_projectSelector') && !configurableExportMode) {
            var showAll = ParamUtil.GetSelectedCodes(context, 'p_ShowAllPulseSurveys');
            //user unchecked "show all pulse surveys" checkbox while some survey was selected
            if (selectedPulseSurvey.length > 0 && selectedPulseSurvey[0] !== 'none' && showAll[0] !== 'showAll') {

                var selectedProject = selectedPulseSurvey[0];
                var availableProjects = ParameterOptionsBuilder.GetOptions(context, 'p_projectSelector', 'available proj');
                var doReset = true;

                //if available list does include selected project, then don't reset pulse project selector
                for (var i = 0; i < availableProjects.length; i++) {
                    if (selectedProject === availableProjects[i].Code) {
                        doReset = false;
                        break;
                    }
                }

                if (doReset) {
                    ParamUtil.ResetParameters(context, ['p_projectSelector']);
                    context.pageContext.Items['p_projectSelector'] = 'nothing_selected';
                }
            }
        }

        //in the end project is still undefined -> set default
        if (state.Parameters.IsNull('p_projectSelector')) {
            var defaultVal = getDefaultParameterValue(context, 'p_projectSelector');
            state.Parameters['p_projectSelector'] = new ParameterValueResponse(defaultVal);
            context.pageContext.Items['p_projectSelector'] = defaultVal;
        }

        //set up object holding questions available on current page
        PulseProgramUtil.setPulseSurveyContentInfo(context);
        PulseProgramUtil.setPulseSurveyContentBaseValues(context);

        //reset question and category based params when baby survey changes
        if (page.SubmitSource === 'projectSelector') {
            ResetQuestionBasedParameters(context, mandatoryPageParameters.concat(optionalPageParameters));
            Filters.ResetAllFilters(context);
        }
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
            //log.LogDebug('param is null')
            return [];
        }

        try {
            var param = state.Parameters[parameterName];

            // single select parameter
            if (param instanceof ParameterValueResponse) {
                //log.LogDebug('SINGLE: stringKeyValue='+param.StringKeyValue+'; stringValue='+state.Parameters.GetString(parameterName));
                return [param.StringKeyValue || state.Parameters.GetString(parameterName)];
            }

            // multi-select response
            if (param instanceof ParameterValueMultiSelect) {
                //log.LogDebug('MULTI')
                var selectedCodes = [];
                var param = state.Parameters[parameterName];
                //log.LogDebug('count='+param.Count);

                for (var i = 0; i < param.Count; i++) {
                    var response: ParameterValueResponse = param[i];
                    var skv = response.StringKeyValue;
                    var sv = response.StringValue;
                    //log.LogDebug('skv='+skv+'; sv='+sv)
                    selectedCodes.push(!skv ? sv : skv);      //surprisingly, StringKeyValue can be empty for first page load and the key (i.e. Question Id) can be extracted via StringValue
                }
                return selectedCodes;

            }

        }
        catch (e) {
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
        var parameterOptions = ParameterOptionsBuilder.GetOptions(context, parameterName, 'get selected options');
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

        if (parameterId === 'p_Statements') {
            mask.Access = ParameterAccessType.Inclusive;

            var dimension = ParamUtil.GetSelectedCodes(context, 'p_Dimensions')[0];
            var qIds = report.TableUtils.GetRowHeaderCategoryIds("QuestionsByDimension");
            for (var i = 0; i < qIds.length; i++) {
                mask.Keys.Add(qIds[i]);
            }

        }
    }

    /**
     * Check if parameter needed to be loaded with values, i.e. relevant for the survey
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @return {Boolean}
     */
    static function isParameterToBeLoaded(context) {

        var parameter = context.parameter;
        var parameterName = parameter.ParameterId;
        var log = context.log;

        var isPulseProgram = !DataSourceUtil.isProjectSelectorNotNeeded(context);

        if (parameterName === 'p_projectSelector') {
            return isPulseProgram;
        }
        
        //after p_projectSelector to be able to iterate export over it
        //in the above case p_projectSelector runs earlier than page script
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        
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

        if(parameterName === 'p_TimeUnitWithDefault' && pageId === 'Page_Trends') {
            return !isPulseProgram;
        }

        if (parameterName === 'p_Trends_trackerSurveys') {
            return isPulseProgram; // only needed for pulse programs
        }

        if (parameterName === 'p_AcrossAllSurveys') {
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

        return true;
    }

}
