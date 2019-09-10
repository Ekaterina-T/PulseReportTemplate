class PageComments {

    /**
     * @memberof PageComments
     * @function Hide
     * @description function to hide the page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function Hide(context){

        return false;
    }

    /**
     * @memberof Page_comments
     * @function Render
     * @description function to render the page
     * @param {Object} context - {component: page, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function Render(context){

    }

    /**
     * @memberof Page_comments
     * @function hitlistComments_Hide
     * @description function to hide the hitlist
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function hitlistComments_Hide(context){

        if (SuppressUtil.isGloballyHidden(context)) {
            return true;
        }

        if(ParamUtil.GetSelectedCodes (context, "p_OpenTextQs").length === 0) {
            return true;
        }

        var log = context.log;
        var report = context.report;

        // check base value in each table cell. If at least 1 value is less than Config.CommentSuppressValue, the whole hitlist is hidden
        for (var k=0; k<report.TableUtils.GetColumnHeaderCategoryIds("Base").length; k++) {
            var counts : Datapoint[] = report.TableUtils.GetColumnValues("Base", k+1);
            for (var i=0; i<counts.Length; i++) {
                var base = parseInt(counts[i].Value);
                if (base < SuppressConfig.CommentSuppressValue) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @memberof Page_comments
     * @function hitlistComments_Render
     * @description function to render the hitlist
     * @param {Object} context - {component: hitlist, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function hitlistComments_Render(context){

        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        Hitlist.AddColumnsByParameter(context, "p_OpenTextQs", {sortable: true, searchable: false});
        Hitlist.AddColumnsByParameter(context, "p_ScoreQs", {sortable: true, searchable: false});
        Hitlist.AddColumnsByParameter(context, "p_TagQs", {sortable: false, searchable: false});

        var staticCols = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns');

        for (var i=0; i<staticCols.length; i++) {
            Hitlist.AddColumn(context, staticCols[i], {sortable: true, searchable: true});
        }
    }


    /**
     * @memberof Page_comments
     * @function getTagColumnNumbers
     * @description function to get the number of columns with tags.
     * @param {Object} context - {component: hitlist, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {Array} - array with numbers of columns
     */
    static function getTagColumnNumbers (context) {

        var log = context.log;
        var state = context.state;
        var tagColumnNumbers = [];

        var numberOfScoresColumns = ParamUtil.GetSelectedCodes (context, "p_ScoreQs").length;
        var numberOfColumnsAtStart = 3 + numberOfScoresColumns; // Hitlist always contains 1 verbatim + 2 first hidden columns with system fields: Respondent ID and Survey Id.
        var numberOfTagColumns = ParamUtil.GetSelectedCodes (context, "p_TagQs").length;
        for (var i=0; i<numberOfTagColumns; i++) {
            tagColumnNumbers.push(i + numberOfColumnsAtStart);
        }
        return tagColumnNumbers;
    }


    /**
     * @memberof Page_comments
     * @function tableBase_Render
     * @description function to render the Base table. It is used for suppressing Hitlist to check base
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableBase_Render(context){

        var log = context.log;
        var table = context.table;

        // add rows = open text questions
        var open_Ids = ParamUtil.GetSelectedCodes (context, 'p_OpenTextQs');
        for (var i=0; i<open_Ids.length; i++) {
            var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, open_Ids[i]);
            var row : HeaderQuestion = new HeaderQuestion(qe);
            row.IsCollapsed = true;
            row.ShowTotals = false;
            row.Distributions.Enabled = true;
            row.Distributions.Count = true;
            table.RowHeaders.Add(row);
        }

        // add columns = tag questions as nested headers
        var tag_Ids = ParamUtil.GetSelectedCodes (context, 'p_TagQs');
        var placement = table.ColumnHeaders;
        for (i=0; i<tag_Ids.length; i++) {
            qe = QuestionUtil.getQuestionnaireElement(context, tag_Ids[i]);
            var col : HeaderQuestion = new HeaderQuestion(qe);
            col.IsCollapsed = false;
            col.ShowTotals = false;
            placement.Add(col);
            placement = col.SubHeaders;
        }

        table.Distribution.Enabled = true;
        table.Distribution.Count = true;
        table.RemoveEmptyHeaders.Columns = true;
    }

}