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

}