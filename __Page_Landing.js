class PageLanding {

    /**
     * @author EkaterinaT
     * @example PageLanding.getWelcomeText({state: state, report: report, log: log, text: text})
     * @description generates welcome text allowing to change language on light-weighted page
     * @param {Object} context
     */

    static function getWelcomeText(context) {

        var str = '<h2 class="welcomeText__title">'+TextAndParameterUtil.getTextTranslationByKey(context, 'Welcome')+'</h2>'
            + '<p class="welcomeText__msg">'
            + TextAndParameterUtil.getTextTranslationByKey(context, 'CurrentLang')
            + '<span class="welcomeText_highlightedWord">'+TextAndParameterUtil.getTextTranslationByKey(context, 'LanguageEnum')+'.</span> '
            + '<br>'+TextAndParameterUtil.getTextTranslationByKey(context, 'ChangeLang')
            + '<a href="javascript:SetPreferences()" class="welcomeText__msg_highlighted"> '+TextAndParameterUtil.getTextTranslationByKey(context, 'here')+'</a>.'
            + '</p>';


        context.text.Output.Append(str);
    }

}