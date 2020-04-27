class ParameterOptions {

    /**
     * parameterInfo is descriptive object; stores parameter type, options order settings, location settings
     * it is basis for building parameterResource object identifing location of options and type of that resource
     *@param {Object} context
     *@param {String} parameterId
     *@return {Object} parameterInfo - reportParameterValuesMap object
     */
    static private function GetParameterInfoObject(context, parameterId) {

        var parameterInfo = {};

        if (parameterId.indexOf('p_ScriptedFilterPanelParameter') === 0) {
            parameterInfo = generateResourceObjectForFilterPanelParameter(context, parameterId);
        } else {
            parameterInfo = SystemConfig.reportParameterValuesMap[parameterId];
        }

        if (!parameterInfo) {
            throw new Error('ParamUtil.GetParameterOptions: either parameterId or parameter resource for this parameter is undefined.');
        }

        return parameterInfo;
    }

    //------------------------------------------------------------------------------------------------------

    /**
     * This function generates object similar to SysemConfig.reportParameterValuesMap.
     * Since filter panel are not described in this object we generate it ourselves.
     * @param {Object} context
     * @param {String} parameterId
     * @returns {Object} resourceInfo
     */
    static private function generateResourceObjectForFilterPanelParameter(context, parameterId) {

        var log = context.log;
        var resourceInfo = {};
        var filterList = Filters.GetFilterQuestionsListByType(context, 'global');
        var paramNumber = parseInt(parameterId.substr('p_ScriptedFilterPanelParameter'.length, parameterId.length));

        resourceInfo.type = 'QuestionId';
        resourceInfo.locationType = 'QuestionId';

        if (paramNumber <= filterList.length) {
            resourceInfo.ID = filterList[paramNumber - 1];
        }

        return resourceInfo;
    }

    /**
     * This function generates object similar to SysemConfig.reportParameterValuesMap.
     * Since filter panel are not described in this object we generate it ourselves.
     * @param {Object} context
     * @param {String} parameterId
     * @returns {Object} resourceInfo
     */
    static private function generateResourceObjectForPageSpecificFilterPanelParameter(context, parameterId) {

        var log = context.log;
        var resourceInfo = {};
        var filterList = Filters.GetFilterQuestionsListByType(context, 'pageSpecific');
        var paramNumber = parseInt(parameterId.substr('p_ScriptedPageFilterPanelParam'.length, parameterId.length));

        resourceInfo.type = 'QuestionId';
        resourceInfo.locationType = 'QuestionId';

        if (paramNumber <= filterList.length) {
            resourceInfo.ID = filterList[paramNumber - 1];
        }

        return resourceInfo;
    }

    /**
     * Get clean resource for parameter from its location
     * @param {object} context
     * @param {object} parameterInfo with locationType and other data to retrieve the resource
     * @return {object} - depends on parameter
     */
    static private function getParameterValuesResourceByLocation(context, parameterInfo) {

        // fetch propertyValue and then transform into needed format
        // locationType will tell where to fetch value from

        if (parameterInfo.locationType === 'TextAndParameterLibrary') {
            return TextAndParameterLibrary.ParameterValuesLibrary[parameterInfo.propertyName]; // return value as is
        }

        if (parameterInfo.locationType === 'QuestionId') {
            return parameterInfo.ID; //how to pass functions in JScript?
        }

        if (parameterInfo.locationType === 'Page') {
            //also refer to parameterInfo.locationType === 'Survey' when/if this part needs extension
            return DataSourceUtil.getPagePropertyValueFromConfig(context, parameterInfo.page, parameterInfo.propertyName); // static array, qid array, qid
        }

        if (parameterInfo.locationType === 'Survey') {

            //resource is just the value of the property
            if (parameterInfo.hasOwnProperty('propertyName')) {
                return DataSourceUtil.getSurveyPropertyValueFromConfig(context, parameterInfo.propertyName); // static array, qid array, qid
            }

            var i;

            //resource consists of several Config properties
            if (parameterInfo.hasOwnProperty('propertyNames')) {
                var properties = parameterInfo.propertyNames;
                var propertyObj = {};

                for(i=0; i<properties.length; i++) {
                    var currentProperty = properties[i];
                    propertyObj[currentProperty] = DataSourceUtil.getSurveyPropertyValueFromConfig(context, currentProperty);
                }
                return propertyObj;
            }

            //resource is found via path array[0].array[1].array[2]...
            if (parameterInfo.hasOwnProperty('propertyPath')) {
                var propertyPath = parameterInfo.propertyName;
                var currentProperty = DataSourceUtil.getSurveyConfig(context);

                for (i = 0; i < propertyPath.length; i++) {
                    if (currentProperty.hasOwnProperty(propertyPath[i])) {
                        currentProperty = currentProperty[propertyPath[i]];
                    } else {
                        throw new Error('ParameterOptions.getParameterValuesResourceByLocation: cannot find property ' + propertyPath[i] + ' in path ' + JSON.stringify(propertyPath));
                    }
                }
                return currentProperty;
            }

            throw new Error('ParameterOptions.getParameterValuesResourceByLocation: cannot build resource for "Survey" unknown type.')
        }

        if (parameterInfo.locationType === 'ReportHierarchy') {
            return {schemaId: Config.schemaId, tableName: Config.tableName};
        }

        if (parameterInfo.locationType === 'CombinationOfQuestions') {
            return { Codes: parameterInfo.qIdCodes, Labels: parameterInfo.qIdLabels }
        }

        if (parameterInfo.locationType === 'QuestionCategory') {
            var customCategory = DataSourceUtil.getPagePropertyValueFromConfig(context, parameterInfo.page, parameterInfo.propertyName);
            var custom_questions = QuestionUtil.getQuestionsByCategory(context, customCategory);
            var custom_qIds = [];
            for (i = 0; i < custom_questions.length; i++) {
                var custom_question: Question = custom_questions[i];
                custom_qIds.push(custom_question.QuestionId);
            }
            return custom_qIds;
        }

        if (parameterInfo.locationType === 'CombinationOfParameters') {
            var paramNames = parameterInfo.parameterList;
            return paramNames;
        }

        if (parameterInfo.locationType === 'FunctionCall') {
            return parameterInfo.path; //how to pass functions in JScript?
        }

        if (parameterInfo.locationType === 'SystemConfig') {
            //hard coded due to time limits
            //need proper class with func that would return SystemConfic variable's values by var name
            return SystemConfig.ActionPlannerSettings[parameterInfo.propertyName];
        }

        throw new Error('ParamUtil.getParameterValuesResource: Cannot define parameter value resource by given location.');
    }

    //------------------------------------------------------------------------------------------------------

    /**
     *Populates p_projectSelector based on storageInfo settings from Congfig.
     *@param {object} context - contains Reportal scripting state, log, report, parameter objects
     *@param {object} storageInfo
     *@return {Array} - [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_PulseSurveyInfo(context, storageInfo) {
        return PulseSurveysInfoFabric.getPulseSurveysInfo(context, storageInfo).getPulseSurveys(context);
    }

    /**
     *Populates p_projectSelector based on pid and pname questions.
     *@param {object} context - contains Reportal scripting state, log, report, parameter objects
     *@return {Array} - [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_CombinationOfQuestionsSelector(context, locationObj) {

        var log = context.log;
        var codes: Answer[] = QuestionUtil.getQuestionAnswers(context, locationObj['Codes']);
        var labels: Answer[] = QuestionUtil.getQuestionAnswers(context, locationObj['Labels']);
        var options = [];

        for (var i = 0; i < codes.length; i++) {
            var option = {};
            option.Label = codes[i].Precode;
            option.Code = labels[i].Precode;
            options.push(option);
        }


        return options;
    }

    /**
     *@param {object} context
     *@param {string} qid
     *@return {Array} - [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_QuestionAnswersSelector(context, qid) {

        var parameterOptions = [];
        var ds;

        if(qid === 'source_project') {
            ds = DataSourceUtil.getProgramDsId(context);
        }
        
        var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, qid, ds);

        for (var i = 0; i < answers.length; i++) {
            var option = {};
            option.Label = answers[i].Text;
            option.Code = answers[i].Precode;
            parameterOptions.push(option);
        }

        return parameterOptions;
    }

    /**
     *@param {object} context
     *@param {array} arary of objevts {Code:, Label:}
     *@return {Array} - [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_StaticArrayOfObjectsSelector(context, ArrayOfObjects) {

        var parameterOptions = [];
        var report = context.report;

        for (var i = 0; i < ArrayOfObjects.length; i++) {

            var option = {};

            for (var prop in ArrayOfObjects[i]) {
                if (prop !== 'Label') {
                    option[prop] = ArrayOfObjects[i][prop];
                } else {
                    option[prop] = ArrayOfObjects[i][prop][report.CurrentLanguage];
                }
            }
            parameterOptions.push(option);
        }
        return parameterOptions;
    }

    /**
     *@param {object} context
     *@param {array} arary of questions
     *@return {array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_QuestionList(context, qList) {

        var parameterOptions = [];

        if (!qList instanceof Array) {
            throw new Error('ParamUtil.GetParameterOptions: expected parameter type cannot be used, array of objects was expected.');
        }

        for (var i = 0; i < qList.length; i++) {
            var option = {};
            option.Code = qList[i]; // propertyValue[i] is qid in this case
            option.Label = QuestionUtil.getQuestionTitle(context, qList[i]);
            parameterOptions.push(option);
        }

        return parameterOptions;
    }

    /**
     *@param {object} context
     *@param {array} arary of questions
     *@return {array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_QuestionAndCategoriesList(context, qIdsAndCatList) {

        var report = context.report;
        var parameterOptions = [];

        if (!qIdsAndCatList instanceof Array) {
            throw new Error('ParamUtil.GetParameterOptions: expected parameter type cannot be used, array of objects was expected.');
        }

        for (var i = 0; i < qIdsAndCatList.length; i++) {
            var option = {};

            if (typeof qIdsAndCatList[i] === 'object' && qIdsAndCatList[i].Type === 'Dimension') { // options is a dimension

                option.Code = qIdsAndCatList[i].Code;
                option.Label = TextAndParameterUtil.getTextTranslationByKey(context, qIdsAndCatList[i].Code); // perfect case: categories are in parameters block not just translations
                option.Type = 'Dimension';
            } else {

                option.Code = qIdsAndCatList[i]; // propertyValue[i] is qid in this case
                option.Label = QuestionUtil.getQuestionTitle(context, qIdsAndCatList[i]);
                option.Type = 'Question';
            }
            parameterOptions.push(option);
        }

        return parameterOptions;
    }

    /**
     *@param {object} context
     *@param {array} array of question Ids
     *@return {array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_CustomQuestionList(context, qList) {

        var log = context.log;
        var parameterOptions = [];

        if (!qList instanceof Array) {
            throw new Error('ParamUtil.getOptions_CustomQuestionList: expected parameter type cannot be used, array of objects was expected.');
        }

        var codes = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');;

        if (codes.length) {
            var baby_p_number = codes[0];
            for (var i = 0; i < qList.length; i++) {
                var customTxt = QuestionUtil.getCustomQuestionTextById(context, qList[i]);
                if (customTxt) {
                    var option = {};
                    option.Code = qList[i]; // propertyValue[i] is qid in this case
                    option.Label = customTxt;
                    parameterOptions.push(option);
                }
            }
        }
        return parameterOptions;
    }

    /**
     *@param {object} context
     *@param {array} array of parameter Ids
     *@return {array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_ParameterList(context, parameterNameList) {

        var log = context.log;
        var combinedOptions = [];

        for (var i = 0; i < parameterNameList.length; i++) {
            combinedOptions = combinedOptions.concat(ParameterOptions.GetOptions(context, parameterNameList[i], 'param list'));
        }
        return combinedOptions;

    }

    /**
     *@param {object} context
     *@param {string} unique 'path' to call proper function
     *@return {array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_DynamicList(context, path) {

        if (path === 'SurveyTracker.getAllSurveyDescriptors') {
            return SurveyTracker.getAllSurveyDescriptors(context);
        }

        throw new Error('ParameterOptions.getOptions_FunctionCall: cannot find handler for path: ' + path);
    }

    /**
     *@param {object} context
     *@param {object} hierarchyInfo {schemaId: val, tableName: val}
     *@return {array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getOptions_HierarchyTable(context, hierarchyInfo) {

        var schema : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(hierarchyInfo.schemaId);
        var table : DBDesignerTable = schema.GetDBDesignerTable(hierarchyInfo.tableName);
        var lang = context.report.CurrentLanguage;

        var ids : StringCollection = table.GetColumnValues("id");
        var labelsEng : StringCollection = table.GetColumnValues("__l9");
        var labels : StringCollection;

        //hierarchy management's nodes table doesn't support translations
        //normal tables do support it, so need to double check
        try {
            labels = table.GetColumnValues("__l"+lang);
        } catch(e) {
            labels = labelsEng;
        }

        var options = [];

        for(var i=0;i<ids.Count;i++)
        {
            var option = {};
            option.Label = labels[i];
            option.Code = ids[i];
            options.push(option);
        }

        return options;

    }

    //------------------------------------------------------------------------------------------------------

    /**
     *@param {Object} context
     *@param {Object| String| Array|...} resource - depends on type of resurce
     *@param {String} type: see reportParameterValuesMap object, property type
     *@return {Array} - [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function getRawOptions(context, resource, type) {

        var log = context.log;

        // propertyValue is a questionId; question answer list are options
        if (type === 'QuestionId') {
            return getOptions_QuestionAnswersSelector(context, resource);
        }

        // propertyValue is a static array with predefined options
        if (type === 'StaticArrayofObjects') {
            return getOptions_StaticArrayOfObjectsSelector(context, resource);
        }

        // propertyValue is a list of question ids, i.e. populate question selector
        if (type === 'QuestionList') {
            return getOptions_QuestionList(context, resource);
        }

        if (type === 'CombinationOfQuestions') {
            return getOptions_CombinationOfQuestionsSelector(context, resource);
        }

        if (type === 'QuestionAndCategoriesList') {
            return getOptions_QuestionAndCategoriesList(context, resource);
        }

        if (type === 'PulseSurveyInfo') {
            return getOptions_PulseSurveyInfo(context, resource);
        }

        if (type === 'CustomQuestionList') {
            return getOptions_CustomQuestionList(context, resource);
        }

        if (type === 'ParameterOptionList') {
            return getOptions_ParameterList(context, resource);
        }

        if (type === 'DynamicList') {
            return getOptions_DynamicList(context, resource);
        }

        throw new Error('ParamUtil.GetParameterOptions: parameter options cannot be defined.');
    }

    /**
     *@param {Object} context
     *@param {Array} array of options [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     *@param {Object} parameterInfo - reportParameterValuesMap object
     *@return {Array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function modifyOptionsOrder(context, options, parameterInfo) {

        if (parameterInfo.isInReverseOrder) {

            var reversed = [];
            for (var i = options.length - 1; i >= 0; i--) {
                reversed.push(options[i]);
            }

            return reversed;
        }

        return options;
    }

    /**
     *@param {Object} context
     *@param {Array} array of options [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     *@param {Object} parameterInfo - reportParameterValuesMap object
     *@return {Array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function modifyOptions(context, options, parameterInfo) {
        return modifyOptionsOrder(context, options, parameterInfo);
    }

    /**
     * creates options list with all midificators applied
     * @param {Object} context
     * @param {String} parameterId
     * @return {Array} [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static private function GetProcessedList(context, parameterId) {

        var parameterInfo = GetParameterInfoObject(context, parameterId); //where to take parameter values from
        var resource = getParameterValuesResourceByLocation(context, parameterInfo);
        var options = [];

        if (resource) {
            options = getRawOptions(context, resource, parameterInfo.type);
            options = modifyOptions(context, options, parameterInfo);
        }
        //context.log.LogDebug(JSON.stringify(options))

        return options;
    }

    /**
     * checks if param should be cached
     * custom question based params shouldn't because their label changes depending on pulse survey
     * @param {Object} context
     * @param {String} parameterId
     * @returns {Boolean}
     */
    static public function isCachable(context, parameterId) {

        var parameterInfo = SystemConfig.reportParameterValuesMap[parameterId];
        return !(parameterInfo && parameterInfo.hasOwnProperty('CachingDisabled') && parameterInfo['CachingDisabled']);
    }

    /**
     * cache parameter values if they are not cached already
     * @param {Object} context
     * @param {String} parameterId
     */
    static private function CacheParameterOptions(context, parameterId) {

        var log = context.log;
        var key = CacheUtil.getParameterCacheKey(context, parameterId);

        var paramOptionsObj = {};
        paramOptionsObj['options'] = GetProcessedList(context, parameterId);
        CacheUtil.cachedParameterOptions[key] = paramOptionsObj;

        return;
    }

    /**
     * This function returns parameter options in standardised format.
     * @param: {object} - context {state: state, report: report, parameter: parameter, log: log}
     * @param: {string} - parameterName optional, contains parameterId to get parameter's default value
     * @returns: {array} - [{Code: code1, Label: label1}, {Code: code2, Label: label2}, ...]
     */
    static public function GetOptions(context, parameterName, from) {

        var log = context.log;
        var parameterId = parameterName || context.parameter.ParameterId;
        var options = [];
        var isCached = CacheUtil.isParameterCached(context, parameterId);

        //log.LogDebug(' ---- START '+parameterId+ ' from '+((String)(from)).toUpperCase()+' ---- ')
        if (isCachable(context, parameterId) && !isCached) {
            CacheParameterOptions(context, parameterId);
        }

        if (isCached) {
            return CacheUtil.GetParameterOptions(context, parameterId);
        }

        options = GetProcessedList(context, parameterId); //for params that shouldn't be cached
        //log.LogDebug(' ---- END    '+parameterId+ ' from '+((String)(from)).toUpperCase()+' ---- ')

        return options;
    }

    //------------------------------------------------------------------------------------------

    static function convertCodeToParameterValueResponse(context, code) {
        return new ParameterValueResponse(code);
    }

    static function convertCodeArrayToParameterValueResponseArray(context, codes) {

        var log = context.log;
        var defaultVals = [];

        for (var i = 0; i < codes.length; i++) {
            defaultVals.push(new ParameterValueResponse(codes[i]));
        }
        return defaultVals;
    }


    /**
     * TODO: replace with some class maybe that would allow defining def values from outside (not using paramNames in code)
     * Get defaultParameterValue for parameter
     * @param {object} context - contains Reportal scripting state, log, report, parameter objects
     * @param {string} parameterName
     * @returns default values: 1 code, array of codes, null
     */
    static function getDefaultValue(context, parameterName) {

        var log = context.log;
        var parameterOptions = ParameterOptions.GetOptions(context, parameterName, 'get default'); // get all options
        var paramInfo = SystemConfig.reportParameterValuesMap[parameterName];
        var defaultValueFromConfig = SystemConfig.defaultParameterValues[parameterName];
        var code;

        if(defaultValueFromConfig) {
            return getParameterValuesResourceByLocation(context, defaultValueFromConfig);
        }

        //pulse program
        if (!DataSourceUtil.isProjectSelectorNotNeeded(context)) {

            if (parameterName === 'p_Trends_trackerSurveys') {
                return SurveyTracker.getTrackersForSelectedPid(context);
            }

            //pulse program + question based params -> need to exclude questions with 0 answers (not used in current pulse survey)
            //1st question with answers becomes default value
            if (paramInfo.hasOwnProperty('isQuestionBased') && paramInfo['isQuestionBased']) {
                var qidsWithData = PulseProgramUtil.getPulseSurveyContentInfo_ItemsWithData(context);

                for (var i = 0; i < parameterOptions.length; i++) {
                    if (qidsWithData.hasOwnProperty(parameterOptions[i].Code)) {
                        return parameterOptions[i].Code;
                    }
                }
            }

        }

        // not pulse program or not question based parameter
        // return the 1st option as default value
        if (DataSourceUtil.isProjectSelectorNotNeeded(context) || !paramInfo.hasOwnProperty('isQuestionBased')) {
            var code = parameterOptions.length > 0 ? parameterOptions[0].Code : null;
            //if(code ==='') {log.LogDebug(parameterName+': default value = ""');} 

            return code;
        }

        //log.LogDebug(parameterName+': default value = null');

        return null;
    }
}