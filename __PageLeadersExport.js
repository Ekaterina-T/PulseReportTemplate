class PageLeadersExport {

    /**
     * @memberof PageLeadersExport
     * @function isPageHidden
     * @description function to hide the PageLeadersExport page or any element based on whether the hierarchy node is the lowest
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function isPageHidden(context) {
        return HierarchyUtil.allAssignedNodesLowest(context);
    }

    /**
     * @memberof PageLeadersExport
     * @function isElementGloballyHidden
     * @description function to hide the element based on the global settings
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Boolean}
     */
    static function isElementGloballyHidden(context) {
        return SuppressUtil.isGloballyHidden(context);
    }

    /**
     * @memberof PageLeadersExport
     * @function renderHeartbeatSummary
     * @description function to render summary element at the top left of the page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param {Boolean} isWaveIncluded - whether wave information is included in the summary
     * @param {Boolean} isReportBaseIncluded - whether report base information is included in the summary
     */
    static function renderHeartbeatSummary(context, isWaveIncluded, isReportBaseIncluded) {
        var log = context.log;
        var text = context.text;

        text.Output.Append(getHeartbeatSummary(context, isWaveIncluded, isReportBaseIncluded));
    }

    /**
     * @memberof PageLeadersExport
     * @function getHeartbeatSummary
     * @description function to get the markup of the summary element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param {Boolean} isWaveIncluded - whether wave information is included in the summary
     * @param {Boolean} isReportBaseIncluded - whether report base information is included in the summary
     * @returns {String} summary element markup
     */
    static function getHeartbeatSummary(context, isWaveIncluded, isReportBaseIncluded) {
        var log = context.log;
        var text = context.text;
        var user = context.user;

        var summaryHeader = TextAndParameterUtil.getTextTranslationByKey(context, 'HeartbeatSummary');
        var waveQid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var selectedWave = ParamUtil.GetSelectedCodes(context, 'p_Wave')[0];
        var selectedWaveLabel = QuestionUtil.getQuestionAnswerByCode(context, waveQid, selectedWave).Text;
        var reportBase = getLeaderName(context);

        return "<div>" + summaryHeader + "</div>"  + (isWaveIncluded ? "<div>" + selectedWaveLabel + "</div>" : "") + (isReportBaseIncluded ? "<div>" + reportBase + "</div>" : "");
    }

    /**
     * @memberof PageLeadersExport
     * @function renderPicture
     * @description render element with the picture, picture url is based on the config property
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderPicture(context) {
        var log = context.log;
        var text = context.text;

        var pageContext = context.pageContext;
        var pageId = pageContext.Items['CurrentPageId'];
        var pictureUrl = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'MainPictureUrl');

        text.Output.Append("<img src='" + pictureUrl + "'>");
    }

    /**
     * @memberof PageLeadersExport
     * @function renderLeaderName
     * @description function to render the leader name element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderLeaderName(context) {
        var log = context.log;
        var text = context.text;

        text.Output.Append('<div class="label label--bg">' + getLeaderName(context) + '</div>');
    }

    /**
     * @memberof PageLeadersExport
     * @function getLeaderName
     * @description function to get the markup of the leader name element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {String} leader name element markup
     */
    static function getLeaderName(context) {
        var log = context.log;
        var user = context.user;

        return user.PersonalizedReportBaseText;
    }

    /**
     * @memberof PageLeadersExport
     * @function renderResponses
     * @description function to render the responses element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderResponses(context) {
        var log = context.log;
        var text = context.text;

        var numberOfResponses = PageResponseRate.getResponseRateSummary(context).responseN;

        text.Output.Append(numberOfResponses);
    }

    /**
     * @memberof PageLeadersExport
     * @function renderResponseRate
     * @description function to render response rate element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderResponseRate(context) {
        var log = context.log;
        var text = context.text;

        var responseRateTile = StyleAndJavaScriptUtil.reportStatisticsTile_Render(context, 'responseRate', 'rate');

        text.Output.Append(responseRateTile);
    }

    /**
     * @memberof PageLeadersExport
     * @function renderTrendTable
     * @description function to build the trend table (based on the Trend page)
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderTrendTable(context) {
        var table = context.table;
        var log = context.log;

        var suppressSettings = {type: 'row', displayBaseOption: 'hide', displayCellOption: 'hide'};
        SuppressUtil.setTableSuppress(table, suppressSettings);

        var Qs = TableUtil.getActiveQuestionsListFromPageConfig (context, 'LeadersExport', 'KeyQuestions', true);

        for (var i=0; i<Qs.length; i++) {
            table.RowHeaders.Add(TableUtil.getTrendHeader(context, TableUtil.getHeaderDescriptorObject(context, Qs[i])));
            /*var qe = QuestionUtil.getQuestionnaireElement(context, Qs[i]);
            var questionRow = new HeaderQuestion(qe);
            questionRow.IsCollapsed = true;
            questionRow.DefaultStatistic = StatisticsType.Average;
            questionRow.ShowTotals = false;

            TableUtil.maskOutNA(context, questionRow);
            table.RowHeaders.Add(questionRow);*/
        }

        //add column - trending by Date variable
        var dateQId = DataSourceUtil.getSurveyPropertyValueFromConfig (context, 'DateQuestion');
        TableUtil.addTrending(context, dateQId);

        //global table settings
        table.Caching.Enabled = false;
        table.Decimals = Config.Decimal;

    }

    /**
     * @memberof PageLeadersExport
     * @function renderEngagementAndCultureTable
     * @description function to build the engagement and culture table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderEngagementAndCultureTable(context) {
        var log = context.log;
        var table = context.table;
        var suppressSettings = {type: 'row', displayBaseOption: 'hide', displayCellOption: 'hide'};

        SuppressUtil.setTableSuppress(table, suppressSettings);

        //html classes for the table, necessary to draw a highchart based on this table
        TableUtil.addClasses(context, ["reportal-table","reportal-categories","culture-table"]);

        //global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Rows = true;
        table.Decimals = Config.Decimal;
        table.TotalsFirst = true;

        tableEngagementAndCulture_AddRows(context);
        tableEngagementAndCulture_AddColumns(context);
    }

    /**
     * @memberof PageLeadersExport
     * @function tableEngagementAndCulture_AddRows
     * @description function to add rows to the engagement and culture table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableEngagementAndCulture_AddRows(context) {
        var log = context.log;
        var table = context.table;

        var questions = TableUtil.getActiveQuestionsListFromPageConfig(context, 'LeadersExport', 'Questions', true);

        for(var i = 0; i < questions.length; i++) {
            var header = TableUtil.getHeaderDescriptorObject(context, questions[i]);
            var questionRow;

            if (header.Type === 'Question') {
                var qe = QuestionUtil.getQuestionnaireElement(context, header.Code);
                questionRow = new HeaderQuestion(qe);
                questionRow.IsCollapsed = true;
                questionRow.DefaultStatistic = StatisticsType.Average;
            } else {
                if (header.Type === 'Dimension') {
                    questionRow = new HeaderCategorization();
                    questionRow.CategorizationId = String(header.Code).replace(/[ ,&]/g, '');
                    questionRow.DataSourceNodeId = DataSourceUtil.getDsId(context);
                    questionRow.DefaultStatistic = StatisticsType.Average;
                    questionRow.CalculationRule = CategorizationType.AverageOfAggregates; // AvgOfIndividual affects performance
                    questionRow.Preaggregation = PreaggregationType.Average;
                    questionRow.SampleRule = SampleEvaluationRule.Max;// https://jiraosl.firmglobal.com/bcolse/TQA-4116
                    questionRow.Collapsed = false;
                }
            }

            questionRow.Totals = false;
            TableUtil.maskOutNA(context, questionRow);

            table.RowHeaders.Add(questionRow);
        }
    }

    /**
     * @memberof PageLeadersExport
     * @function tableEngagementAndCulture_AddColumns
     * @description function to add columns to the engagement and culture table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableEngagementAndCulture_AddColumns(context) {
        var log = context.log;
        var table = context.table;

        var waveQid = DataSourceUtil.getSurveyPropertyValueFromConfig(context, 'WaveQuestion');
        var selectedWave = ParamUtil.GetSelectedCodes(context, 'p_Wave')[0];

        var waveHeader = TableUtil.getWaveColumn(context, waveQid, selectedWave);
        var previousWave = TableUtil.getPreviousWaveFromSelected(context, waveQid, selectedWave);
        var previousWaveHeader = TableUtil.getWaveColumn(context, waveQid, previousWave);

        var trendFormulaHeader : HeaderFormula = new HeaderFormula();
        trendFormulaHeader.Decimals = 0;
        trendFormulaHeader.Type = FormulaType.Expression;
        trendFormulaHeader.Expression = 'IF((cellv(col-2, row) = emptyv() OR cellv(col-1,row) = emptyv()), 0, ROUND(cellv(col-2, row)) - ROUND(cellv(col-1,row)))';
        trendFormulaHeader.Title = TextAndParameterUtil.getLabelByKey(context, 'LeadersExport_Trend');

        table.ColumnHeaders.Add(waveHeader);
        table.ColumnHeaders.Add(previousWaveHeader);
        table.ColumnHeaders.Add(trendFormulaHeader);
    }

    /**
     * @memberof PageLeadersExport
     * @function renderEngagementAndCultureChart
     * @description function to add the script for the highchart to the engagement and culture page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderEngagementAndCultureChart(context) {
        var report = context.report;
        var log = context.log;

        if(!Export.isExcelExportMode(context)) {
            var chartInit = "<script>"+
                "new Reportal.TrendBarChart({" +
                "   chartContainer: 'trendChart'," +
                "   translations: translations," +
                "   table: document.querySelectorAll('.culture-table')[document.querySelectorAll('.culture-table').length -1 ]," +
                "});"+
                "</script>";

            context.text.Output.Append(StyleAndJavaScriptUtil.printProperty(getTranslations(context), "translations"));
            context.text.Output.Append(chartInit);
        }
    }

    /**
     * @memberof PageLeadersExport
     * @function setKeyIndicatorsPageTitles
     * @description function to set titles to key indicators page for excel export
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function setKeyIndicatorsPageTitles(context) {
        PageUtil.setPageTitle(context, getKeyIndicatorsHeader(context));
    }

    /**
     * @memberof PageLeadersExport
     * @function renderKeyIndicatorsHeader
     * @description function to render key indicators chart header element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderKeyIndicatorsHeader(context) {
        var log = context.log;
        var text = context.text;

        text.Output.Append(getKeyIndicatorsHeader(context));
    }

    /**
     * @memberof PageLeadersExport
     * @function getKeyIndicatorsHeader
     * @description function to get the markup of the key indicators chart header element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {String} key indicators chart header element markup
     */
    static function getKeyIndicatorsHeader(context) {
        var log = context.log;

        var selectedBreakByQuestion = ParamUtil.GetSelectedCodes(context, 'p_LeadersExport_BreakBy')[0];
        var selectedBreakByQuestionInfo = QuestionUtil.getQuestionInfo(context, selectedBreakByQuestion);
        var selectedBreakByQuestionText = '';
        var keyIndicatorsText = TextAndParameterUtil.getTextTranslationByKey(context, 'Page_LeadersExport2');

        if(selectedBreakByQuestionInfo.standardType === 'hierarchy') {
            selectedBreakByQuestionText = TextAndParameterUtil.getTextTranslationByKey(context, 'Organization');
        } else {
            selectedBreakByQuestionText = QuestionUtil.getQuestionTitle(context, selectedBreakByQuestion);
        }

        return keyIndicatorsText + ' ' + selectedBreakByQuestionText;
    }

    /**
     * @memberof PageLeadersExport
     * @function renderKeyIndicatorsTable
     * @description function to build key indicators table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderKeyIndicatorsTable(context) {
        var log = context.log;
        var table = context.table;
        var suppressSettings = {type: 'row', displayBaseOption: 'hide', displayCellOption: 'hide'};

        SuppressUtil.setTableSuppress(table, suppressSettings);

        //global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Rows = true;
        table.RemoveEmptyHeaders.Columns = true;
        table.Decimals = Config.Decimal;
        table.TotalsFirst = true;

        tableKeyIndicators_AddRows(context);
        tableKeyIndicators_AddColumns(context);
    }

    /**
     * @memberof PageLeadersExport
     * @function tableKeyIndicators_AddColumns
     * @description function to add columns to the key indicators table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableKeyIndicators_AddColumns(context) {
        var log = context.log;
        var table = context.table;

        var selectedBreakByQuestion = ParamUtil.GetSelectedCodes(context, 'p_LeadersExport_BreakBy')[0];
        var selectedBreakByQuestionInfo = QuestionUtil.getQuestionInfo(context, selectedBreakByQuestion);
        var selectedBreakByQuestionQE :QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, selectedBreakByQuestion);

        var questionHeader : HeaderQuestion = new HeaderQuestion(selectedBreakByQuestionQE);
        questionHeader.ShowTotals = false;

        if(selectedBreakByQuestionInfo.standardType === 'hierarchy') {
            questionHeader.HierLayout = HierLayout.Flat;
            questionHeader.ReferenceGroup.Enabled = true;
            questionHeader.ReferenceGroup.Self = false;
            questionHeader.ReferenceGroup.Levels = '+1';

            var bases = context.user.PersonalizedReportBase.split(',');

            if(bases.length > 1) {
                questionHeader.HideHeader = true;
                questionHeader.HideData = true;
            }
        }

        //add mask if any codes specified in the config
        var selectedBreakByQuestionMaskCodes = DataSourceUtil.getPagePropertyValueFromConfig(context, 'LeadersExport', 'BreakVariablesMaskCodes');

        if(!!selectedBreakByQuestionMaskCodes[selectedBreakByQuestion] && selectedBreakByQuestionMaskCodes[selectedBreakByQuestion].length > 0) {
            var mask: MaskFlat = new MaskFlat();
            mask.IsInclusive = false;
            mask.Codes.AddRange(selectedBreakByQuestionMaskCodes[selectedBreakByQuestion]);
            questionHeader.AnswerMask = mask;
        }

        table.ColumnHeaders.Add(questionHeader);
    }

    /**
     * @memberof PageLeadersExport
     * @function tableKeyIndicators_AddRows
     * @description function to add rows to the key indicators table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableKeyIndicators_AddRows(context) {
        var log = context.log;
        var table = context.table;

        var Qs = TableUtil.getActiveQuestionsListFromPageConfig(context, 'LeadersExport', 'KeyQuestions', true);

        for (var i = 0; i < Qs.length; i++) {
            //table.RowHeaders.Add(TableUtil.getTrendHeader(context, TableUtil.getHeaderDescriptorObject(context, Qs[i])));
            var report = context.report;

            var qe: QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, Qs[i]);
            var qTitle = QuestionUtil.getQuestionTitle (context, Qs[i]);
            var row: HeaderQuestion = new HeaderQuestion(qe);
            row.IsCollapsed = true;
            row.HideHeader = false;
            TableUtil.maskOutNA(context, row);

            var hs : HeaderStatistics = new HeaderStatistics();
            hs.Statistics.Avg = true;
            hs.Statistics.Count = true;
            hs.HideHeader = false;
            hs.Texts.Average = new Label(report.CurrentLanguage, qTitle+' (SCORE)');
            hs.Texts.Count = new Label(report.CurrentLanguage, qTitle+' (N)');
            //hs.Texts.Average = new Label(report.CurrentLanguage, '(SCORE)');
            //hs.Texts.Count = new Label(report.CurrentLanguage, '(N)');
            row.SubHeaders.Add(hs);

            table.RowHeaders.Add(row);
        }
    }

    /**
     * @memberof PageLeadersExport
     * @function setEngagementPageTitles
     * @description function to set titles to engagement page for excel export
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function setEngagementPageTitles(context) {
        PageUtil.setPageTitle(context, getEngagementHeader(context, true));
    }

    /**
     * @memberof PageLeadersExport
     * @function renderEngagementHeader
     * @description function to render engagement header element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderEngagementHeader(context) {
        var log = context.log;
        var text = context.text;

        text.Output.Append(getEngagementHeader(context), false);
    }

    /**
     * @memberof PageLeadersExport
     * @function getEngagementHeader
     * @description function to get the markup of the engagement chart header element
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param {Boolean} isPlainText - whether it's a plain text or a markup
     */
    static function getEngagementHeader(context, isPlainText) {
        var log = context.log;
        var text = context.text;

        var selectedDimension = ParamUtil.GetSelectedCodes(context, 'p_LeadersExport_Dimension')[0];
        var engagementText = TextAndParameterUtil.getTextTranslationByKey(context, 'Page_LeadersExport3');
        var isEngagementTextIncluded = true;

        var selectedText = '';

        var items = TableUtil.getActiveQuestionsListFromPageConfig(context, 'LeadersExport', 'Questions', true);

        for(var i = 0; i < items.length; i++) {
            var header = TableUtil.getHeaderDescriptorObject(context, items[i]);

            if(header.Code === selectedDimension) {
                if (header.Type === 'Question') {
                    selectedText = QuestionUtil.getQuestionTitle(context, selectedDimension);
                } else {
                    if (header.Type === 'Dimension') {
                        selectedText = TextAndParameterUtil.getTextTranslationByKey(context, selectedDimension);

                        if(header.Code == 'culture') {
                            isEngagementTextIncluded = false;
                        }
                    }
                }

                break;
            }
        }

        if(isPlainText) {
            return (!isEngagementTextIncluded ? '' : engagementText +  ' | ') + selectedText;
        } else {
            return (!isEngagementTextIncluded ? '<span>' : engagementText + ' | <span class="dimension-name" style="color:#6B9994!important;">') + selectedText + "</span>";
        }
    }

    /**
     * @memberof PageLeadersExport
     * @function getHeartbeatSummary
     * @description function to build the engagement table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderEngagementTable(context) {
        var log = context.log;
        var table = context.table;
        var suppressSettings = {type: 'row', displayBaseOption: 'hide', displayCellOption: 'hide'};

        SuppressUtil.setTableSuppress(table, suppressSettings);

        //html classes for the table, necessary to draw a highchart based on this table
        TableUtil.addClasses(context, ["reportal-table","reportal-categories","engagement-table"]);

        //global table settings
        table.Caching.Enabled = false;
        table.RemoveEmptyHeaders.Rows = true;
        table.RemoveEmptyHeaders.Columns = true;
        table.Decimals = Config.Decimal;
        table.TotalsFirst = true;

        tableEngagement_AddRows(context);
        tableEngagement_AddColumns(context);
    }

    /**
     * @memberof PageLeadersExport
     * @function tableEngagement_AddColumns
     * @description function to add columns to the engagement table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableEngagement_AddColumns(context) {
        var log = context.log;
        var table = context.table;

        var breakByItems = TableUtil.getActiveQuestionsListFromPageConfig(context, 'LeadersExport', 'BreakVariables', true);
        var selectedBreakByQuestionMaskCodes = DataSourceUtil.getPagePropertyValueFromConfig(context, 'LeadersExport', 'BreakVariablesMaskCodes');

        for(var i = 0; i < breakByItems.length; i++) {
            if(Access.isQuestionAllowed(breakByItems[i], context)) {
                var breakByQidInfo = QuestionUtil.getQuestionInfo(context, breakByItems[i]);
                var breakByQuestionQE :QuestionnaireElement = QuestionUtil.getQuestionnaireElement(context, breakByItems[i]);
                var questionHeader : HeaderQuestion = new HeaderQuestion(breakByQuestionQE);

                if(breakByQidInfo.standardType === 'hierarchy') {
                    questionHeader.HierLayout = HierLayout.Flat;
                    questionHeader.ReferenceGroup.Enabled = true;
                    questionHeader.ReferenceGroup.Self = false;
                    questionHeader.ReferenceGroup.Levels = '+1';

                    var bases = context.user.PersonalizedReportBase.split(',');

                    if(bases.length > 1) {
                        questionHeader.HideHeader = true;
                        questionHeader.HideData = true;
                    }
                }

                //add mask if any codes specified in the config
                if(!!selectedBreakByQuestionMaskCodes[breakByItems[i]] && selectedBreakByQuestionMaskCodes[breakByItems[i]].length > 0) {
                    var mask: MaskFlat = new MaskFlat();
                    mask.IsInclusive = false;
                    mask.Codes.AddRange(selectedBreakByQuestionMaskCodes[breakByItems[i]]);
                    questionHeader.AnswerMask = mask;
                }

                questionHeader.ShowTotals = false;
                table.ColumnHeaders.Add(questionHeader);
            }
        }
    }

    /**
     * @memberof PageLeadersExport
     * @function tableEngagement_AddRows
     * @description function to add rows to the engagement table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function tableEngagement_AddRows(context) {
        var log = context.log;
        var table = context.table;

        var selectedDimension = ParamUtil.GetSelectedCodes(context, 'p_LeadersExport_Dimension')[0];

        var items = TableUtil.getActiveQuestionsListFromPageConfig(context, 'LeadersExport', 'Questions', true);

        for(var i = 0; i < items.length; i++) {
            var header = TableUtil.getHeaderDescriptorObject(context, items[i]);
            var questionRow;

            if(header.Code === selectedDimension) {
                if (header.Type === 'Question') {
                    var qe = QuestionUtil.getQuestionnaireElement(context, header.Code);
                    questionRow = new HeaderQuestion(qe);
                    questionRow.IsCollapsed = true;
                    questionRow.DefaultStatistic = StatisticsType.Average;
                } else {
                    if (header.Type === 'Dimension') {
                        questionRow = new HeaderCategorization();
                        questionRow.CategorizationId = String(header.Code).replace(/[ ,&]/g, '');
                        questionRow.DataSourceNodeId = DataSourceUtil.getDsId(context);
                        questionRow.DefaultStatistic = StatisticsType.Average;
                        questionRow.CalculationRule = CategorizationType.AverageOfAggregates; // AvgOfIndividual affects performance
                        questionRow.Preaggregation = PreaggregationType.Average;
                        questionRow.SampleRule = SampleEvaluationRule.Max;// https://jiraosl.firmglobal.com/bcolse/TQA-4116
                        questionRow.Collapsed = false;
                    }
                }

                questionRow.Totals = false;
                TableUtil.maskOutNA(context, questionRow);

                table.RowHeaders.Add(questionRow);

                break;
            }
        }
    }

    /**
     * @memberof PageLeadersExport
     * @function getEngagementHeaderMarkup
     * @description function get the markup of the top part of the engagement page (summary and chart header)
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {String} markup
     */
    static function getEngagementHeaderMarkup(context) {
        var summary = '<div class="material-card material-card--noborder ">' +
            '<div class="material-card__content" style="padding:0">' +
            '<div class="summary" style="color: #331E11!important;">' +
            getHeartbeatSummary(context, true, true) +
            '</div></div></div>';

        var header = '<div class="material-card material-card--noborder ">' +
            '<div class="material-card__content" style="padding:0">' +
            '<div class="header" style="color: #331E11!important;">' +
            getEngagementHeader(context) +
            '</div></div></div>';

        return summary + header;
    }

    /**
     * @memberof PageLeadersExport
     * @function renderEngagementChart
     * @description function to add the script for the highchart to the engagement page
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     */
    static function renderEngagementChart(context) {
        var report = context.report;
        var log = context.log;
        var text = context.text;

        if(!Export.isExcelExportMode(context)) {
            var breakByItems = TableUtil.getActiveQuestionsListFromPageConfig(context, 'LeadersExport', 'BreakVariables', true);

            text.Output.Append(StyleAndJavaScriptUtil.printProperty(getTranslations(context), "translations"));

            for(var i = 0; i < breakByItems.length; i++) {
                if(Access.isQuestionAllowed(breakByItems[i], context)) {
                    var tableSection = getTableSectionInfo(context, breakByItems[i]);

                    var chart = '<div class="material-card material-card--noborder material-card--width">' +
                        '<div class="material-card__content" style="padding:0">' +
                        '<div class=" trend_chart">' +
                        '<div id="engagementChart' + i +'" ' + (i === breakByItems.length - 1 ? '' : 'class="addPageBreakInPDF"') + '></div>' +
                        '</div></div></div>';

                    text.Output.Append('<div class="layout vertical export-page">' + getEngagementHeaderMarkup(context) + chart + '</div>');

                    var chartInit = "<script>"+
                        "new Reportal.TrendColumnChart({" +
                        "   chartContainer: 'engagementChart" + i + "'," +
                        "   table: document.querySelectorAll('.engagement-table')[document.querySelectorAll('.engagement-table').length -1 ]," +
                        "   tableSection: tableSection" + i + "," +
                        "   translations: translations," +
                        "});"+
                        "</script>";

                    text.Output.Append(StyleAndJavaScriptUtil.printProperty(tableSection, "tableSection" + i));
                    text.Output.Append(chartInit);
                }
            }
        }
    }

    /**
     * @memberof PageLeadersExport
     * @function getTableSectionInfo
     * @description function get the information about the qName question part of the table
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @param {String} qName - question id
     * @returns {Object} information about the question
     */
    static function getTableSectionInfo(context, qName) {
        var answers = [];
        var name = '';

        var breakByQidInfo = QuestionUtil.getQuestionInfo(context, qName);

        if(breakByQidInfo.standardType === 'hierarchy') {
            var ids = HierarchyUtil.getDirectChildrenForCurrentReportBase(context);
            name = TextAndParameterUtil.getTextTranslationByKey(context, 'Organization');

            var bases = context.user.PersonalizedReportBase.split(',');

            if(bases.length > 1) {
                answers = [];
            } else {
                for (var j = 0; j < ids.length; j++) {
                    answers.push(HierarchyUtil.getNodeLabelById(ids[j]));
                }
            }
        } else {
            name = qName;
            answers = QuestionUtil.getQuestionAnswerLabels(context, qName);
        }

        var tableSection = {
            qName : name,
            qAnswers: answers
        };

        return tableSection;
    }

    /**
     * @memberof PageLeadersExport
     * @function getTranslations
     * @description function to get translations for the chart
     * @param {Object} context - {pageContext: this.pageContext, report: report, user: user, state: state, confirmit: confirmit, log: log}
     * @returns {Object} translations
     */
    static function getTranslations(context) {
        var translation = {
            'No data to display': TextAndParameterUtil.getTextTranslationByKey(context, 'NoDataMsg'),
            'Engagement and Culture': TextAndParameterUtil.getTextTranslationByKey(context, 'Page_LeadersExport1'),
            'Score' : TextAndParameterUtil.getTextTranslationByKey(context, 'AverageScore'),
            'Trend' : TextAndParameterUtil.getTextTranslationByKey(context, 'LeadersExport_Trend'),
            'Organization' : TextAndParameterUtil.getTextTranslationByKey(context, 'Organization')
        };

        return translation;
    }
}