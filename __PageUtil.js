class PageUtil {

    /*
     * pageBasis object is collection of references to key page questions stored in Config
     * the following notation is used:
     * - property name is pageId
     * - property value is a reference to basis resource or array of resources
     */

    static var pageBasis = {
        'Key KPI': ['KPI'],
        'Trends': ['TrendQuestions'],
        'Results': ['Dimensions'],
        'Result Statements': ['ResultStatements'],
        'Categorical': ['ResultCategoricalQuestions', 'ResultMultiCategoricalQuestions'],
        'Comments': ['Comments']
    }

    /*
     * Collection of initialse page scripts.
     * Put here the code that needs to run when page loads.
     * @param {object} context object {state: state, report: report, page: page, log: log}
     */

    static function Initialise(context) {

        var state = context.state;
        var page = context.page;

        ParamUtil.Initialise(context); // initialise parameters
        //state.Parameters['p_Drilldown']= new ParameterValueResponse(page.SubmitSource);

    }

    /*
     * Array of pages that should later be hidden (as there's nothing to show) with js by name.
     * @param {object} context object {state: state, report: report, log: log}
     * @returns {Array} pagesToHide array of page Names that should be hidden
     */

    static function getPageNamesToHide(context) {

        var log = context.log;
        var pagesToHide = [];
        var pageBaseRefValue;

        for (var page in pageBasis) {

            var pageBasisRef = pageBasis[page];
            var questions = [];

            for(var i=0; i<pageBasisRef.length; i++) {
                try {
                    pageBaseRefValue = DataSourceUtil.getPropertyValueFromConfig(context, pageBasisRef[i]);
                } catch(e) {
                    // if property is missing in the config while a script tries to access it an error is thrown
                    // however here it is standard situation, no drama so we catch the error and do nothing
                    // otherwise throw the error again
                    // TO DO: replace with regular expression
                    if (e.message.indexOf('DataSourceUtil.getPropertyValueFromConfig: Property ')==-1 || e.message.indexOf('is not found for ds')==-1) {
                        throw e;
                    }
                    pageBaseRefValue = [];
                }
                questions = questions.concat(pageBaseRefValue);
            }

            if(questions.length === 0) {
                pagesToHide.push(page);
            }
        }

        return pagesToHide;
    }
}