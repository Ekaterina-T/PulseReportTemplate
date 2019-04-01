class PageCategorical {


    /**
     * @memberof PageCategorical
     * @function Hide
     * @description function to hide the page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */

    static function Hide(context){
        return false;
    }


    /**
     * @memberof PageCategorical
     * @function Render
     * @description function to render the page
     * @param {Object} context - {component: page, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */

    static function Render(context){

    }



    /**
     * @memberof PageCategorical
     * @function tableCategorical_Hide
     * @description function to hide the table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tableCategorical_Hide(context){
        return false;
    }

    /**
     * @memberof PageCategorical
     * @function tileCategorical_Hide
     * @description function to hide the Categorical tiles (cards). More precisely, to hide the script generating cards
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function tileCategorical_Hide(context){

        return SuppressUtil.isGloballyHidden(context);
    }

    /**
     * @memberof PageCategorical
     * @function tableCategorical_Render
     * @description function to build the categorical table
     * @param {Object} context - {table: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */

    static function tableCategorical_Render(context, tableType){

        var report = context.report;
        var state = context.state;
        var table = context.table;
        var log = context.log;
        var suppressSettings = context.suppressSettings;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);
        var project : Project = DataSourceUtil.getProject(context);

        var questionConfigParamName = tableType == 'multi' ? 'ResultMultiCategoricalQuestions' : 'ResultCategoricalQuestions';

        // add rows (single or multi questions)
        var Qs = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, questionConfigParamName);
        var topN = (tableType == 'multi') ? DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, "topN_multi") : DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, "topN_single");
        var answerLimit = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, "categoricalAnswerLimit");  // if single has more than <answerLimit> options, it is displayed as TopN card. Otherwise, pie chart is displayed.
        var naCode = DataSourceUtil.getPropertyValueFromConfig(context, pageId, 'NA_answerCode');

        for (var i=0; i<Qs.length; i++) {

            var question : Question = project.GetQuestion(Qs[i]);
            var answerCount = question.AnswerCount;
            if (QuestionUtil.hasAnswer (context, Qs[i], naCode)) {
                answerCount--;
            }

            var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, Qs[i]);
            var row: HeaderQuestion = new HeaderQuestion(qe);

            row.IsCollapsed = (tableType == 'multi') ? true : false;

            row.ShowTitle = false;
            row.ShowTotals = false;
            row.HideHeader = true;

            if (answerCount > answerLimit || tableType=='multi') {
                // sorting by base to show the most popular answers
                row.Sorting.Enabled = true;
                row.Sorting.Direction = TableSortDirection.Descending;
                row.Sorting.Position = 1;
                row.Sorting.TopN = System.Math.Min(topN, answerCount);
            }
            TableUtil.maskOutNA(context, row);
            table.RowHeaders.Add(row);
        }


        // add 2 Base columns

        var baseVP : HeaderBase = new HeaderBase();
        baseVP.Distributions.Enabled = true;
        baseVP.Distributions.VerticalPercents = true;
        baseVP.Distributions.UseInnermostTotals = true;
        table.ColumnHeaders.Add(baseVP);

        var baseC : HeaderBase = new HeaderBase();
        baseC.Distributions.Enabled = true;
        baseC.Distributions.Count = true;
        table.ColumnHeaders.Add(baseC);


        // global table settings

        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Columns = false;
        table.RemoveEmptyHeaders.Rows = false;

        SuppressUtil.setTableSuppress(table, suppressSettings);
    }


    /**
     * @memberof PageCategorical
     * @function tableSingleCategorical_Render
     * @description function to build the categorical table
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableSingleCategorical_Render(context){

        tableCategorical_Render(context, 'single');

    }

    /**
     * @memberof PageCategorical
     * @function tableMultiCategorical_Render
     * @description function to build the categorical table
     * @param {Object} context - {component: table, pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log, suppressSettings: suppressSettings}
     */
    static function tableMultiCategorical_Render(context){

        tableCategorical_Render(context, 'multi');

    }


    /**
     * @memberof PageCategorical
     * @function getCategoricalResult
     * @description function to get the array of categorical questions with answers
     * @param {Object} context - {report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param {String} tableType - 'single' or 'multi' categoricals
     * @return {Object[]} - array of objects containing information about categoricals:
     * @property {String} qid - Question Id
     * @property {String} title - Question title
     * @property {String} type - pie or list
     * @property {Int} order - the index of question in Config (used in the sorting function to preserve the order of elements of the same type so they appear as they are listed in Config)
     * @property {Object[]} result - array of objects containing information about answers to a categorical question:
     * @property {String} name - answer text
     * @property {String} base - # of responses
     * @property {String} y - vertical percent
     */

    static function getCategoricalResult(context, tableType) {

        var report = context.report;
        var state = context.state;
        var log = context.log;
        var pageId = PageUtil.getCurrentPageIdInConfig(context);

        // depending on <answerLimit> display a pie or list of topN answers
        var answerLimit = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, "categoricalAnswerLimit");

        // show topN answers in a list for questions with more than <answerLimit> options
        var topN = (tableType == 'multi') ? DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, "topN_multi") : DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, "topN_single");
        var project : Project = DataSourceUtil.getProject(context);
        var tableName = (tableType == 'multi') ? 'Multicategorical' : 'Categorical';
        var questionConfigParamName = (tableType == 'multi') ? 'ResultMultiCategoricalQuestions' : 'ResultCategoricalQuestions';
        var naCode = DataSourceUtil.getPropertyValueFromConfig(context, pageId, 'NA_answerCode');
        var Qs = DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, questionConfigParamName);
        var row_index = 0;  // iterator through table rows
        var categoricals = [];
        for (var i=0; i<Qs.length; i++) {

            var question : Question = project.GetQuestion(Qs[i]);
            var answerCount = question.AnswerCount;

            if (QuestionUtil.hasAnswer (context, Qs[i], naCode)) {
                answerCount--;
            }
            var title = QuestionUtil.getQuestionTitle(context, Qs[i]);
            var displayType = (answerCount > answerLimit || tableType=='multi') ? 'list' : 'pie'; // pie only for 3 answers
            var displayNumberOfAnswers = (answerCount > answerLimit || tableType=='multi') ? System.Math.Min(topN, answerCount) : answerCount;
            var result = [];
            for (var j=0; j<displayNumberOfAnswers; j++) {

                var answerBase = report.TableUtils.GetCellValue(tableName,row_index+j+1,2).Value.toFixed(0);

                if (answerBase > 0) {  //display only answers with responses
                    var answerName = report.TableUtils.GetRowHeaderCategoryTitles(tableName)[row_index+j][0];
                    var answerPercent = (100*report.TableUtils.GetCellValue(tableName,row_index+j+1,1).Value);
                    result.push({name: answerName, base: answerBase, y: answerPercent});

                }
            }
            categoricals.push({qid: Qs[i], title: title, type: displayType, result: result, order: i});
            row_index += displayNumberOfAnswers;

        }
        return categoricals;
    }



    /**
     * @memberof PageCategorical
     * @function getPieCollection
     * @description function to get the array of categorical questions with pie view
     * @param {Object} context - {report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {Object[]} - array of objects containing information about categoricals with pie view
     */

    static function getPieCollection(context) {
        var log = context.log;
        var singleCategoricals = getCategoricalResult(context, 'single');
        singleCategoricals.sort(SortCategoricals);
        var pieCollection = [];
        for (var i=0; i<singleCategoricals.length; i++) {
            if (singleCategoricals[i].type != 'pie')
                break;
            pieCollection.push(singleCategoricals[i]);
        }
        return pieCollection;

    }


    /**
     * @memberof PageCategorical
     * @function getTopListCollection
     * @description function to get the array of single-/multi- categorical questions with list view
     * @param {Object} context - {report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {Object[]} array of objects containing information about categoricals with Top X list view
     */

    static function getTopListCollection(context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;

        var singleCategoricals = getCategoricalResult(context, 'single');
        var multiCategoricals = getCategoricalResult(context, 'multi');
        singleCategoricals.sort(SortCategoricals);
        var listCollection = [];
        for (var i=0; i<singleCategoricals.length; i++) {
            if (singleCategoricals[i].type == 'list') {
                listCollection.push(singleCategoricals[i]);
            }
        }
        return listCollection.concat(multiCategoricals);

    }


    /**
     * @memberof PageCategorical
     * @function RenderCategoricalCard
     * @description function to render a card/tile for a categorical question
     * @param {Object} context - {report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @return {String} - string representing HTML markup for 1 card
     */
    static function RenderCategoricalCard (context, title, qid, content) {

        var report = context.report;
        var state = context.state;
        var text = context.text;
        var log = context.log;

        var hover = (content != '') ? 'title="'+TextAndParameterUtil.getTextTranslationByKey(context, 'ViewMore')+'"' : '';

        var card = '<div class="material-card flex material-card--categorical">'+
            '<div class="material-card__info">'+ TextAndParameterUtil.getTextTranslationByKey(context, 'Categorical_InfoTooltip') +'</div>'+
            '<div class="material-card__title">'+
            '<div class="material-card__title--left">'+title+'</div>'+
            '</div>'+
            '<div id="'+ qid +'" class="material-card__content" '+hover+'>'+content+
            '</div>'+
            '</div>';

        text.Output.Append(card);
    }

    /**
     * @memberof PageCategorical
     * @function SortCategoricals
     * @description sorting function. Regardless of the order qIds in Config, display pie-questions first
     * @param {Object} a - object representing a categorical question
     * @param {Object} b - object representing a categorical question
     * @return {Int}
     */
    static function SortCategoricals (a, b) {
        if (a.type != b.type && a.type === 'pie') return -1;
        if (a.type != b.type && a.type === 'list') return 1;
        if (a.type == b.type) {  // preserve the order of elements of the same type (so they appear as they are listed in Config)
            if(a.order < b.order)
                return -1;
            return 1;
        }



    }


    /**
     * @memberof PageCategorical
     * @function buildCategoricalTiles
     * @description function to generate material cards with categories
     * @param {Object} context - {report: report, user: user, state: state, confirmit: confirmit, log: log}
     */


    static function buildCategoricalTiles (context) {

        var report = context.report;
        var state = context.state;
        var log = context.log;
        var text = context.text;

        // render cards with pies
        var pies = getPieCollection(context);
        for (var i=0; i<pies.length; i++) {
            var content = '';
            var item = pies[i];
            if (item.result.length != 0) {
                content =  '<div id="pie-container-'+item.qid+'" class="hideLegendInWeb"> </div>';
            }
            RenderCategoricalCard (context, item.title, item.qid, content);
        }

        var lists = getTopListCollection(context);
        for (var i=0; i<lists.length; i++) {
            content = '';
            item = lists[i];
            if (item.result.length != 0) {
                content = '<ol class="material-card__list">';
                for (var j=0; j<item.result.length; j++) {
                    content +=
                        '<li class="material-card__list-item">'+item.result[j].name+
                        '<div class="material-card__note">'+(item.result[j].y).toFixed(0)+'%' +' ('+ item.result[j].base + ' responses) </div>'+
                        '</li>';
                }
                content += '</ol>';
            }
            RenderCategoricalCard (context, item.title, item.qid, content);

        }
    }
}