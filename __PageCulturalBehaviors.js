class PageCulturalBehaviors {

    /**
     * @memberof PageCulturalBehaviors
     * @function tableAllResults_Hide
     * @description function to hide the CulturalBehaviors table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableCulturalBehaviors_Hide(context) {

        return SuppressUtil.isGloballyHidden(context) || ParamUtil.isParameterEmpty(context, 'p_CulturalBehaviors_BreakBy');
    }

    /**
     * @memberof PageCulturalBehaviors
     * @function tableCulturalBehaviors_Render
     * @description function to render the CulturalBehaviors table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableCulturalBehaviors_Render(context) {
        var table = context.table;
        var log = context.log;
        var suppressSettings = context.suppressSettings;

        // global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Rows = true;
        table.RemoveEmptyHeaders.Columns = true;
        table.Decimals = Config.Decimal;
        table.TotalsFirst = true;

        SuppressUtil.setTableSuppress(table, suppressSettings);

        tableCulturalBehaviors_AddRows(context);
        tableCulturalBehaviors_AddColumns(context);
    }

    /**
     * @memberof PageCulturalBehaviors
     * @function tableCulturalBehaviors_AddRows
     * @description function to add rows to the CulturalBehaviors table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableCulturalBehaviors_AddRows(context) {
        var table = context.table;
        var log = context.log;

        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var dimensions = TableUtil.getActiveQuestionsListFromPageConfig(context, pageId, 'Dimensions', true);

        for (var i = 0; i < dimensions.length; i++) {
            var row = TableUtil.getSimpleQuestionHeader(context, dimensions[i]);
            table.RowHeaders.Add(row);
        }
    }

    /**
     * @memberof PageCulturalBehaviors
     * @function tableCulturalBehaviors_AddColumns
     * @description function to add columns to the CulturalBehaviors table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableCulturalBehaviors_AddColumns(context) {
        var table = context.table;
        var log = context.log;

        var responses = TableUtil.getBaseColumn(context);
        table.ColumnHeaders.Add(responses);
    }

}