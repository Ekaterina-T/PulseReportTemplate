class TextAndParameterUtil {

    /*
     * Get set of labels and codes for parameter from ParameterValuesLibrary
     * @param {string} keyName
     * @returns {object} setOfLabelsAndCodes value
     */

    static function getParameterValuesByKey(keyName) {

        var setOfLabelsAndCodes = TextAndParameterLibrary.ParameterValuesLibrary[keyName];

        if(setOfLabelsAndCodes == null) {
            throw new Error('TextAndParameterTextLibrary.getParameterValuesByKey: Translation/Code object is not found for property "'+keyName+'"');
        }

        return setOfLabelsAndCodes;
    }

    /*
     * Get translation for text by key
     * @param {object} context {state: stae, report: report, log: log}
     * @param {string} keyName
     * @returns {object} property value
     */

    static function getTextTranslationByKey(context, keyName) {

        var report = context.report;
        var currentLanguage = report.CurrentLanguage;
        var translation = TextAndParameterLibrary.TextLibrary[keyName][currentLanguage];

        if(translation == null) {
            throw new Error('TextAndParameterTextLibrary.getParameterValuesByKey: No translation for '+keyName+' for language "'+currentLanguage+'" were found');
        }

        return translation;
    }

    /*
     * Get defaultCode for parameter
     * @param {string} keyName
     * @returns {string} defaultCode value
     */

    static function getDefaultParameterCodeByKey(keyName) {

        var defaultCode = TextAndParameterLibrary.ParameterValuesLibrary[keyName][0].Code;

        return defaultCode;
    }

}