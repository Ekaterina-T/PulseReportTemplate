class ParameterOptionsBuilder {

    /**
     * parameterInfo is descriptive object; stores parameter type, options order settings, location settings
     * it is basis for building parameterResource object identifing location of options and type of that resource
     *@param {Object} context
     *@param {String} parameterId
     *@parreturn {Object} parameterInfo - reportParameterValuesMap object
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

        var resourceInfo = {};
        var filterList = Filters.GetFullConfigFilterList(context);
        var paramNumber = parseInt(parameterId.substr('p_ScriptedFilterPanelParameter'.length, parameterId.length));

        resourceInfo.type = 'QuestionId';
        resourceInfo.locationType = 'FilterPanel'

        if (paramNumber <= filterList.length) {
            resourceInfo.FilterQid = filterList[paramNumber - 1];
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

        if (parameterInfo.locationType === 'Page') {
            return DataSourceUtil.getPagePropertyValueFromConfig(context, parameterInfo.page, parameterInfo.propertyName); // static array, qid array, qid
        }

        if (parameterInfo.locationType === 'Survey') {

            var propertyPath = parameterInfo.propertyName;

            if(typeof propertyPath === 'string') {
                return DataSourceUtil.getSurveyPropertyValueFromConfig(context, propertyPath); // static array, qid array, qid
            }

            if(propertyPath instanceof Array) {
                var currentProperty = DataSourceUtil.getSurveyConfig(context);

                for(var i=0; i<propertyPath.length; i++) {
                    if(currentProperty.hasOwnProperty(propertyPath[i])) {
                        currentProperty = currentProperty[propertyPath[i]];
                    } else {
                        throw new Error('ParameterOptionsBuilder.getParameterValuesResourceByLocation: cannot find property '+propertyPath[i]+' in path '+JSON.stringify(propertyPath));
                    }
                }
                return currentProperty;
            }

            throw new Error('ParameterOptionsBuilder.getParameterValuesResourceByLocation: cannot build resource for "Survey" unknown type.')
        }

        if (parameterInfo.locationType === 'CombinationOfQuestions') {
            return { Codes: parameterInfo.qIdCodes, Labels: parameterInfo.qIdLabels }
        }

        if (parameterInfo.locationType === 'FilterPanel') {
            return parameterInfo.FilterQid;
        }

        if (parameterInfo.locationType === 'QuestionCategory') {
            var customCategory = DataSourceUtil.getPagePropertyValueFromConfig(context, parameterInfo.page, parameterInfo.propertyName);
            var custom_questions = QuestionUtil.getQuestionsByCategory(context, customCategory);
            var custom_qIds = [];
            for (var i = 0; i < custom_questions.length; i++) {
                var custom_question: Question = custom_questions[i];
                custom_qIds.push(custom_question.QuestionId);
            }
            return custom_qIds;
        }

        if (parameterInfo.locationType === 'CombinationOfParameters') {
            var paramNames = parameterInfo.parameterList;
            return paramNames;
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
        var answers: Answer[] = QuestionUtil.getQuestionAnswers(context, qid);

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
                option.Label = TextAndParameterUtil.getTextTranslationByKey(context, qIdsAndCatList[i].Code);// perfect case: categories are in parameters block not just translations
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

        var codes = ParamUtil.GetSelectedCodes(context, 'p_projectSelector');

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
            combinedOptions = combinedOptions.concat(ParameterOptionsBuilder.GetOptions(context, parameterNameList[i], 'param list'));
        }
        return combinedOptions;

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
     *
     */
    static private function GetProcessedList(context, parameterId) {

        var parameterInfo = GetParameterInfoObject(context, parameterId); //where to take parameter values from
        var resource = getParameterValuesResourceByLocation(context, parameterInfo);
        var options = [];

        if (resource) {
            options = getRawOptions(context, resource, parameterInfo.type);
            options = modifyOptions(context, options, parameterInfo);
        }

        return options;
    }

    /**
     *
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
        paramOptionsObj['options'] = GetProcessedList;
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
        if(isCachable(context, parameterId) && !isCached) {
            CacheParameterOptions(context, parameterId);
        }

        if(isCached) {
            return CacheUtil.GetParameterOptions(context, parameterId);
        }

        options = GetProcessedList(context, parameterId);
        //log.LogDebug(' ---- END    '+parameterId+ ' from '+((String)(from)).toUpperCase()+' ---- ')

        return options;
    }
}