class Hitlist {

    /**
     * @memberof Hitlist
     * @instance
     * @function AddColumn
     * @description function to add a variable to the hitlist
     * @param {Object} context
     * @param {String} qId - qiestion Id
     * @param {Object} columnProps - {
     *          order: {Int} - column number to insert
     *          sortable: {Boolean}
     *          searchable: {Boolean}
     *      }
     */
    static function AddColumn(context, qId, columnProps) {

        var hitlist = context.hitlist;
        var log = context.log;

        var sortable = columnProps.sortable || false;
        var searchable = columnProps.searchable || false;
        var order = columnProps.order;

        var qe : QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, qId);
        var column : HitListColumn = new HitListColumn();
        column.QuestionnaireElement = qe;
        column.IsLink = false;
        column.IsSearchable = searchable;
        column.IsSortable = sortable;
        if (order) {
            hitlist.Columns.Insert(order, column);
        } else {
            hitlist.Columns.Add(column);
        }

    }


    // check documentation.js on description format
    /**
     * @memberof Hitlist
     * @instance
     * @function AddColumnsByParameter
     * @description function to add a variable to the hitlist
     * @param {Object} context
     * @param {String} parameter - the name of the report parameter
     * @param {Object} columnProps  - {
     *          sortable: {Boolean}
     *          searchable: {Boolean}
     *      }
     */

    static function AddColumnsByParameter(context, parameterName, columnProps) {
        var hitlist = context.component;
        var log = context.log;

        var qIds = ParamUtil.GetSelectedCodes (context, parameterName);

        for (var i=0; i<qIds.length; i++) {
            AddColumn(context, qIds[i], columnProps);
        }

    }




    /**
     * @memberof Hitlist
     * @instance
     * @function AddColumn
     * @description function to add a variable to the hitlist
     * @param {Object} context
     */
    static function AddSurveyLink(context) {

        var hitlist = context.hitlist;
        var log = context.log;

        var slink = new Confirmit.Reportal.Scripting.VisualComponents.SurveyLinkModel.SurveyLink();
        slink.Name = 'surveylink';
        slink.SurveyLinkType = Confirmit.Reportal.Scripting.VisualComponents.SurveyLinkModel.SurveyLinkType.Encrypted;
        slink.UrlParameters = "userid=^userid^;role=^role^";

        var slinkColumn : HitListColumn = new Confirmit.Reportal.Scripting.VisualComponents.HitListModel.HitListColumn(slink);
        hitlist.Columns.Add(slinkColumn);
    }

}