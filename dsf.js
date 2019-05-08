/**
* Assemble all "backend dependant" css styles and js scripts
 * @param {object} context {state: state, report: report, log: log}
 * @returns {string} script and style string
 */

function assembleBackendDependantStylesAndJS (context) {

    var str = '';

    try {
        str += buildReportTemplateModule (context); //js
    } catch(e) {
        throw new Error('StyleAndJavaScriptUtil.buildReportTemplateModule: failed with error "'+e.Message+'"');
    }

    try {
        str += applyTheme(); // css
    } catch(e) {
        throw new Error('StyleAndJavaScriptUtil.applyTheme: failed with error "'+e.Message+'"');
    }

    return str;
}