class StyleAndJavaScriptUtil {

    /*
     * Assemble all "backend dependant" css styles and js scripts
     * @param {object} context {state: state, report: report, log: log}
     * @returns {string} script and style string
     */

    static function assembleBackendDependantStylesAndJS(context) {

        var str = '';

        str += buildReportTemplateModule(context); //js    
        str += applyTheme(context); // css

        return str;
    }

    /** TO DO: organize better to support flexibility for other reports
     * all js variables and functions that
     * - are specific to the template
     * - are defined based on Config
     * - therefore are build with help of Reportal scripting
     * will be properties of ReportTemplate global variable
     * The function below will build that variable.
     * @param {object} context {state: state, report: report, log: log}
     * @returns {string} script string
     */

    static function buildReportTemplateModule(context) {

        var log = context.log;
        var state = context.state;
        var pageContext = context.pageContext;
        var pageId = pageContext.Items['CurrentPageId'];
        var report = context.report;
        var user = context.user;

        var globalVarScript = [];
        
        var commonProperties =  getCommonReportTemplateProperties(context);
        var pageSpecificProperties = getPageSpecificReportTemplateProperties(context);
	
	var properties = commonProperties.concat(pageSpecificProperties);
	var resultPropertiesString = properties.join(', ');
	//var resultPropertiesString = commonProperties.join(', ');
	//if(pageSpecificProperties.length>0){resultPropertiesString += "," + pageSpecificProperties.join(', ');}
	    

        globalVarScript.push('<script>');
        globalVarScript.push(';var ReportTemplateConfig = (function(){');
        globalVarScript.push('return {');
        globalVarScript.push(resultPropertiesString);
        globalVarScript.push('}');
        globalVarScript.push('})();');
        globalVarScript.push('</script>');

        return globalVarScript.join('');
    }
	static function getCommonReportTemplateProperties(context){
		var log = context.log;
        var state = context.state;
        var pageContext = context.pageContext;
        var pageId = pageContext.Items['CurrentPageId'];
        var report = context.report;
        var user = context.user;

        var properties = []; // array of strings like 'property: propertyValue'

        properties.push('questionsWithData: ' + JSON.stringify(PulseProgramUtil.getPulseSurveyContentInfo_ItemsWithData(context)));
        
        properties.push('hiddenFilterIndexes: ' + JSON.stringify(Filters.getHiddenFilterIndexes(context)));

        properties.push('executionMode: "' + JSON.stringify(state.ReportExecutionMode)+'"');

        properties.push('pagesToShow: ' + JSON.stringify(PageUtil.getPageNamesToShow(context).join(';').toLowerCase() + ';'));

        properties.push('pageHasViewSwitch: ' + JSON.stringify(PageUtil.isViewSwitchAvailable(context)));

        properties.push('hideTimePeriodFilters: ' + Filters.isTimePeriodFilterHidden(context));

        properties.push('hideWaveFilter: ' + Filters.isWaveFilterHidden(context));

        properties.push('noDataWarning: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'NoDataMsg')));

        properties.push('TableChartColName_ScoreVsNormValue: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'ScoreVsNormValue')));

        properties.push('TableChartColName_Distribution: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'Distribution')));

        properties.push('About: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'About')));

        properties.push('CollapseExpand: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'CollapseExpand')));

        properties.push('Apply: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'Apply')));
        properties.push('Reset: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'Reset')));
        
        properties.push('DeletedUser: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'EndUserDeleted')));

        properties.push('isPulseProgram: ' + JSON.stringify(!DataSourceUtil.isProjectSelectorNotNeeded(context)));
        properties.push('isPublicReport: ' + JSON.stringify(PublicUtil.isPublic(context)));
        
        properties.push('currentLanguage: ' + report.CurrentLanguage);

        if (!PublicUtil.isPublic(context)) {
            properties.push('userRoles: "' + user.Roles + '"');
        }
		
		return properties;
	}
	static function getPageSpecificReportTemplateProperties(context){
		var log = context.log;
        var state = context.state;
        var pageContext = context.pageContext;
        var pageId = pageContext.Items['CurrentPageId'];
        var report = context.report;
        var user = context.user;

        var properties = []; // array of strings like 'property: propertyValue'
		
		 if (pageId === 'Comments' && !DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Comments', 'isHidden')) {
            properties.push('tagColumnNumbers: ' + JSON.stringify(Hitlist.GetTagColumnNumbers(context, 'p_ScoreQs', 'p_TagQs')));
            properties.push('score_columns: ' + JSON.stringify(ParamUtil.GetSelectedCodes(context, 'p_ScoreQs')));
        }

        if (pageId === 'KPI' && !DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_KPI', 'isHidden')) {
            properties.push('gaugeData: ' + JSON.stringify(PageKPI.getKPIResult(context)));
        }

        if (pageId === 'Results' && !DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Results', 'isHidden')) {
            var isPulseProgram = !DataSourceUtil.isProjectSelectorNotNeeded(context);
            var custom_category = DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'CustomStatementCategory');

            if (isPulseProgram && !!custom_category) {
                var custom_questions = QuestionUtil.getQuestionsByCategory(context, custom_category);
                if (custom_questions.length > 0) {
                    properties.push('isCustomQuestionsTabVisible: true');
                } else {
                    properties.push('isCustomQuestionsTabVisible: false');
                }
            } else {
                properties.push('isCustomQuestionsTabVisible: false');
            }

            var isDimensionsVisible = PageResults.isDimensionsMode(context);
            properties.push('isDimensionsTabVisible: ' + isDimensionsVisible);
        }

        if (pageId === 'Categorical_' && !DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_Categorical_', 'isHidden')) {
            properties.push('pieData: ' + JSON.stringify(PageCategorical.getPieCollection(context, 'jsutil')));
            properties.push('pieColors: ' + JSON.stringify(Config.pieColors));
        }

        if (pageId === 'CategoricalDrilldown' && !DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_CategoricalDrilldown', 'isHidden')) {
            properties.push('isProjectSelectorDisabled: ' + true);
        }

        if (pageId === 'Actions' && !DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'isHidden')) {
			
            properties.push('gaugeData: ' + JSON.stringify(PageActions.getKPIResult(context)));
            properties.push('tagColumnNumbers: ' + JSON.stringify(PageActions.getTagColumnNumbers(context)));
            properties.push('EndUserDeleted: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'EndUserDeleted')));

            if (!PublicUtil.isPublic(context)) {
                properties.push('isResponsibleVisible: ' + PageActions.isFeatureAvailableForUserRole(context, 'Delegation'));
                properties.push('isWriting: ' + PageActions.isFeatureAvailableForUserRole(context, 'WriteAndChangeComments'));
                properties.push('isAdvancedReportingVisible: ' + PageActions.isFeatureAvailableForUserRole(context, 'AdvancedReporting'));
                properties.push('isShowOwnActionsSelectorVisible: ' + PageActions.isFeatureAvailableForUserRole(context, 'ReportLevelAccess'));
                properties.push('U: "' +  user.UserId+'"');
                properties.push('FeaturesConfig: "'+ user.Roles + '"');
                //user data
                var schema_EndUsers : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(Config.DBSchemaID_ForProject);
                var table_EndUsers : DBDesignerTable = schema_EndUsers.GetDBDesignerTable(Config.EndUserTableName);
                var endUserIds = table_EndUsers.GetColumnValues("id", "__l9"+Config.EndUserTableLoginColumnName, user.UserId);
               
                 if(endUserIds.Count>0){ properties.push('Id: "' + endUserIds[0] +'"');}
                

            } else {
                properties.push('isAdvancedReportingVisible: true');
            }

            properties.push('columnWithTagsId: ' + JSON.stringify(DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns')[0].id));
            properties.push('tagIds: ' + JSON.stringify(DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'TagsForHitlist')));
            properties.push('actionLinks: ' + JSON.stringify(PageActions.hitlistsActions_getActionLinks(context)));
        }
        
		// AP version 2.2
        if (pageId === 'Work' && !DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'isHidden')) {
			
            properties.push('tagColumnNumbers: ' + JSON.stringify(PageActions.getTagColumnNumbers(context)));
            properties.push('EndUserDeleted: ' + JSON.stringify(TextAndParameterUtil.getTextTranslationByKey(context, 'EndUserDeleted')));         
            properties.push('columnWithTagsId: ' + JSON.stringify(DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'staticColumns')[0].id));
            properties.push('tagIds: ' + JSON.stringify(DataSourceUtil.getPagePropertyValueFromConfig (context, pageId, 'TagsForHitlist')));
            properties.push('actionLinks: ' + JSON.stringify(PageActions.hitlistsActions_getActionLinks(context)));
        }
		
		if (pageId === 'Overview' && !DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'isHidden')) {
             properties.push('gaugeData: ' + JSON.stringify(PageActions.getKPIResult(context)));
        }
		
		if ((pageId === 'Work' || pageId === 'Overview') && !DataSourceUtil.getPagePropertyValueFromConfig(context, pageId, 'isHidden')) {
			if (!PublicUtil.isPublic(context)) {
                properties.push('isResponsibleVisible: ' + PageActions.isFeatureAvailableForUserRole(context, 'Delegation'));
                properties.push('isWriting: ' + PageActions.isFeatureAvailableForUserRole(context, 'WriteAndChangeComments'));
                properties.push('isAdvancedReportingVisible: ' + PageActions.isFeatureAvailableForUserRole(context, 'AdvancedReporting'));
                properties.push('isShowOwnActionsSelectorVisible: ' + PageActions.isFeatureAvailableForUserRole(context, 'ReportLevelAccess'));
                properties.push('U: "' +  user.UserId+'"');
                properties.push('FeaturesConfig: "'+ user.Roles + '"');
                //user data
                var schema_EndUsersV2 : DBDesignerSchema = context.confirmit.GetDBDesignerSchema(Config.DBSchemaID_ForProject);
                var table_EndUsersV2 : DBDesignerTable = schema_EndUsersV2.GetDBDesignerTable(Config.EndUserTableName);
                var endUserIds = table_EndUsersV2.GetColumnValues("id", "__l9"+Config.EndUserTableLoginColumnName, user.UserId);
               
                 if(endUserIds.Count>0){ properties.push('Id: "' + endUserIds[0] +'"');}
                

            } else {
                properties.push('isAdvancedReportingVisible: true');
            }
		}
		
        return properties;
	}

    static function applyTheme(context) {

        var log = context.log;
        var greenColor = Config.primaryGreenColor;
        var redColor = Config.primaryRedColor;
        var kpiColor = Config.kpiColor;
        var kpiColor_dark = Config.kpiColor_dark;
        var logo = Config.logo;
        var headerBackground = Config.headerBackground;
        var isThreeDotsMenuNeeded = Config.showThreeDotsCardMenu;
        var pageId = context.pageContext.Items['CurrentPageId'];
        var numberOfVerbatimComments = pageId === 'KPI' && !DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_KPI', 'isHidden') && DataSourceUtil.getPagePropertyValueFromConfig(context, 'Page_KPI', 'NumberOfCommentsToShow');

        var css_string = '';

        css_string += ''

        //logo
        +
        '.logo-wrapper {' +
        'background-image: url("' + logo + '");' +
            '}'

        //icon with two men in queue
        +
        '.icon--kpi{' +
        'background-image: url(data:image/svg+xml,%3Csvg%20fill%3D%22%23' + kpiColor.substring(1, kpiColor.length) + '%22%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22/%3E%0A%20%20%20%20%3Cpath%20d%3D%22M16%2011c1.66%200%202.99-1.34%202.99-3S17.66%205%2016%205c-1.66%200-3%201.34-3%203s1.34%203%203%203zm-8%200c1.66%200%202.99-1.34%202.99-3S9.66%205%208%205C6.34%205%205%206.34%205%208s1.34%203%203%203zm0%202c-2.33%200-7%201.17-7%203.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8%200c-.29%200-.62.02-.97.05%201.16.84%201.97%201.97%201.97%203.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z%22/%3E%0A%3C/svg%3E);' +
            '}'

        //nav menu item color
        +
        '.css-menu .yui3-menuitem:hover > a' +
        '{ color: ' + kpiColor + '  !important;}' +
            'div.reportal-horizontal-menu>.yui3-menu .css-menu-topitem:hover {' +
            'border-bottom-color:' + kpiColor + '!important;}'

        //header background
        +
        '.global-header {' +
        'background-color: ' + headerBackground + ';' +
            '}'

        // calendar
        +
        '.yui-calcontainer>table .calnav,' +
        '.yui-calcontainer>table td.calcell.today>a{' +
        '    background: ' + kpiColor + ' !important;' +
            '    color: white!important;' +
            '}' +
            '.yui-calcontainer>table .calnavleft:before,' +
            '.yui-calcontainer>table .calnavright:before{' +
            'border-color: ' + kpiColor + ';}' +
            '.yui-calcontainer>table .calnav:hover {' +
            'background: ' + kpiColor_dark + ' !important;}'

        //unfavorable card
        +
        'div .material-card.unfavorable,' +
        '.material-card.unfavorable .Table td' +
        '{ background-color: ' + redColor + ' !important;}'

        //favorable card
        +
        'div .material-card.favorable,' +
        'div .material-card.favorable .Table td' +
        '{background-color: ' + greenColor + ';}'



        //hitlist navigation
        +
        'div .hitlist-nav-button:hover, ' +
        'div .hitlist-nav-page:hover {' +
        'background-color: ' + kpiColor + ' !important;' +
            '}'

        //loading animation colors (three blinking dots)
        +
        '@keyframes pulse { ' +
        'from { background-color:' + kpiColor + ';}' +
            'to { background-color:' + kpiColor_dark + ';}' +
            '}';

        if (!isThreeDotsMenuNeeded) {
            css_string += '.material-card__title .kebab-menu { display: none; }';
        }


        //CSS to show only the latest n rows with comments
        if (numberOfVerbatimComments) {
            numberOfVerbatimComments = numberOfVerbatimComments + 1;
            css_string += '.material-card--favorable tr:nth-last-child(n+' + numberOfVerbatimComments + ') td { display: none; }' +
                '.material-card--unfavorable tr:nth-last-child(n+' + numberOfVerbatimComments + ') td { display: none; }';
        } else {
            css_string += '.material-card--favorable tr:nth-last-child(n+6) td { display: none; }' +
                '.material-card--unfavorable tr:nth-last-child(n+6) td { display: none; }';
        }

        return '<style>' + css_string + '</style>';
    }

    static function reportStatisticsTile_Render(context, stat, icon) {

        var log = context.log;
        var str = '';
        var value;

        switch (stat) {
            case 'collectionPeriod':
                value = PageResponseRate.getCollectionPeriod(context);
                break;
            default:
                value = PageResponseRate.getResponseRateSummary(context)[stat];
                break;
        }

        str += '<div class="layout horizontal">' +
            '<div class="icon icon--' + icon + '"></div>' +
            '<div class="flex digit self-center">' + value + '</div></div>';

        return str;
    }

}
