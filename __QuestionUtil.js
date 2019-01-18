class QuestionUtil {

    /*
     * Get question info:
     * - Type: general, singleFromGrid, otherOpenText.
     * - Question Id
     * - Precode for single from grid and other
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} questionId
     * @returns {object} questionInfo { type: string, qid: string, precode: string }
     */

    static function getQuestionInfo (context, questionId) {

        var log = context.log;
        var project : Project = DataSourceUtil.getProject(context);
        var question : Question = project.GetQuestion(questionId);
        var questionInfo = {};

        if(question!=null) { // single, multi, open, numeric, grid itself, open text list, numeric list

            questionInfo.type = 'general';
            questionInfo.questionId = questionId;

        } else if(questionId.lastIndexOf('_other') == questionId.length - '_other'.length) { // other option of single or multi

            var splittedQuestionId = splitStringByLastUndersore(questionId.substr(0,questionId.lastIndexOf('_other')));

            questionInfo.type = 'otherOpenText';
            questionInfo.questionId = splittedQuestionId.beforeUnderscore;
            questionInfo.precode = splittedQuestionId.afterUnderscore;

        } else { //check if it's single from grid, open text list or numeric list

            var splittedQuestionId = splitStringByLastUndersore(questionId);

            questionInfo.questionId = splittedQuestionId.beforeUnderscore;
            questionInfo.precode = splittedQuestionId.afterUnderscore;

            var q : Question = project.GetQuestion(questionInfo.questionId);

            if(q.QuestionType == QuestionType.Grid) {
                questionInfo.type = 'singleFromGrid';
            } else if(q.QuestionType == QuestionType.MultiNumeric) {
                questionInfo.type = 'numericFromList';
            } else if(q.QuestionType == QuestionType.MultiOpen) {
                questionInfo.type = 'openFromList';
            }

        }

        // last verification if question really exists

        var qe: QuestionnaireElement;

        if(questionInfo.type == 'general') {  // simple question type: single, open text, grid overall
            qe = project.CreateQuestionnaireElement(questionInfo.questionId);
        } else if (questionInfo.type == 'singleFromGrid' || questionInfo.type == 'numericFromList' || questionInfo.type == 'openFromList') {
            qe = project.CreateQuestionnaireElement(questionInfo.questionId, questionInfo.precode);
        } else if (questionInfo.type == 'otherOpenText') {
            qe = project.CreateQuestionnaireElement(questionInfo.questionId, questionInfo.precode, true);
        }

        if(project.GetQuestion(qe) == null) { // caution: it doesn't catch all invalid question ids
            throw new Error('QuestionUtil.questionInfo: Question "'+questionId+'" is not found');
        }

        return questionInfo;
    }

    /*
     * Get question title for card titles and parameter lists.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} questionId
     * @returns {string} title question title
     */

    static function getQuestionTitle (context, questionId) {

        var log = context.log;
        var project : Project = DataSourceUtil.getProject(context);
        var questionInfo = getQuestionInfo(context, questionId);
        var question : Question = project.GetQuestion(questionInfo.questionId);
        var title;
        var answer: Answer;

        if(questionInfo.type == 'general') {  // simple question type: single, open text, grid overall
            title = question.Title || question.Text || question.QuestionId;

        } else if (questionInfo.type == 'singleFromGrid') {
            answer = question.GetAnswer(questionInfo.precode);
            title = answer.Text;

        } else if (questionInfo.type == 'otherOpenText') {
            title = question.Title || question.Text || question.QuestionId;
            title += ' (Other)';

        } else if (questionInfo.type == 'openFromList' || questionInfo.type == 'numericFromList') {
            answer = question.GetAnswer(questionInfo.precode);
            title = (question.Title || question.Text || question.QuestionId)+': '+answer.Text;

        }

        if(title == null || title.length == 0) {
            throw new Error('DataSourceUtil.getQuestionTitle: '+questionId+' title is empty.');
        }

        return title;
    }


    /*
     * Get question answer list.
     * @param {object} context object {state: state, report: report, log: log}
     * @param {string} questionId
     * @returns {Answer []} answers or scale for grids
     */

    static function getQuestionAnswers (context, questionId) {

        var state = context.state;
        var report = context.report;
        var log = context.log;
        var project : Project = DataSourceUtil.getProject(context);
        var questionInfo = getQuestionInfo(context, questionId);
        var question : Question = project.GetQuestion(questionInfo.questionId);
        var qType = question.QuestionType;
        var answers : Answer[];

        if(questionInfo.type == 'general' && (qType == QuestionType.Single || qType == QuestionType.Multi || qType == QuestionType.Grid)) {
            answers = question.GetAnswers();

        } else if (questionInfo.type == 'singleFromGrid') { // probably it's an sub-question of a grid
            answers = question.GetScale();

        } else {
            throw new Error('QuestionUtil.getQuestionAnswers: Question '+questionId+' has no answer list');
        }

        return answers;
    }


    /* split string by last "_" sign
     * @param {string}
     * @returns {object} { beforeUnderscore: beforeLastUnderscore, afterUnderscore: afterLastUnderscore}
     */

    static function splitStringByLastUndersore (string) {

        var positionOfLastUnderscore = string.lastIndexOf('_'); // grid: gridId_answerId
        var beforeLastUnderscore = string.substring(0,positionOfLastUnderscore);
        var afterLastUnderscore = string.substring(positionOfLastUnderscore+1, string.length);

        return { beforeUnderscore: beforeLastUnderscore, afterUnderscore: afterLastUnderscore};
    }

}