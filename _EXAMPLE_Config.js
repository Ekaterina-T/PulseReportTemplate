/*

public class Config {

  //================================================================================
  // THEME
  //================================================================================
  static const logo = '/isa/FRIKJYPMGFDPLXOTGBKBNRIHEPHADVNF/db_logo.jpg';
  static const headerBackground = '#FFFFFF';
  static const primaryRedColor = '#c8a4a6';
  static const primaryGreenColor = '#a2ccc1';
  static const kpiColor = '#0098db';
  static const kpiColor_dark = '#0118A8';
  static const primaryGreyColor = '#E5E5E5';
  static var pieColors = ['#7ab800', '#ffa100', '#dadada', '#989898', '#ff6100']; // [negative, positive, neutral_dark, neutral_light]

  // Bar chart in the Results table. Check ReusableRecodingId to make sure colors match categories
  // There can only be 3 types of bars: Positive, Neutral and Negative
  // For instance [Very agree and Agree] are Positive, [Neutral] is neutral, [Somewhat negative, Negative and Very Negative] are Negative
  static var barChartColors_Distribution = [{color: '#8dc444', label: 'Favourable', type: 'Positive'},
                                 			{color: '#d9dbd9', label: 'Neutral', type: 'Neutral'},
                                 			{color: '#f56e23', label: 'Unfavourable', type: 'Negative'}];


  static var barChartColors_NormVsScore = [{color: '#7ab800', label: 'Negative'},
                                 			{color: '#ffa100', label: 'Positive'}];

  static var showThreeDotsCardMenu = true;

//
// to update colors also go to 'Layout and Styles' section -> Styles -> Palletes -> EnnovaPallete
//

  static const Decimal = 2;

  //================================================================================
  // DATA SUPPRESSION (more info: SuppressUtil)
  //================================================================================

  static const SuppressSettings = {

    ReportBaseSuppressValue: 1,  // Min number of responses (response = question specified below in Survey Config -> Response: {qId: 'status', codes: ['complete']})

    TableSuppressValue: 1,        // Min number of answers in the Aggregated Table
    VerbatimSuppressValue: 10,     // Min number of answers in the Verbatim Table
    CommentSuppressValue: 2,      // Min number of answers in the Hitlist
    CategoricalSuppressValue: 0, // Min number of answers for cards on the Categorical page

    // minGap: min difference between neighbour units
    // unitSufficientBase: min number of the responses when a unit is always shown irrespective of <minGap> requirement
    HierarchySuppress: { minGap: 0, unitSufficientBase: 10}

  };

  // Database Hierarchy Descriptor

  static const schemaId = 8907;
  static const tableId = 19882;
  static const relationId = 12044;


  //================================================================================
  // README
  //================================================================================

  //
  // The following pattern is used for question ids: questionID.answer_precode.other.
  // SINGLE: single, single_ltr
  // GRID: grid, grid_ltr
  // GRID'S SUBQUESTION: grid.1, grid_ltr.1
  // OTHER ANSWER: q1_ltr.99.other
  // ANWSER OF OPEN TEXT LIST: open_text.answer_precode
  //


  static var Surveys = [

    //================================================================================
    // KFHG DB SURVEY
    //================================================================================
    {
      Source: 'ds5',
      isHidden: false,
      AvailableForRoles: ['DB_user'], // null - available for all roles, [] - not available for any role, ['role1', 'role2'] - available for 2 roles
      Filters: ['CorporateTitle', 'Region1', 'Country' ,'Tenure', 'Age', 'FullTime_PartTime', 'Work_with_external_DB_clients', 'Gender', 'I_live_with_children', 'Care', 'LGBT', 'Ethnicity',  'InternalMobility'],  // filters used on the Filter Panel
      FiltersFromSurveyData: [], //not bg vars only, used in filter panel
      IsTimePeriodFilterHidden: true,
      HierarchyQuestion: 'hierarchy',
      WaveQuestion: null,
      DateQuestion: 'interview_end',
      MailingDateQuestion: 'smtpStatusDate',
      Invitation: {qId: 'smtpStatus', codes: ['messagesent']},
      Response: {qId: 'status', codes: ['complete']},
      ReusableRecodingId:  'rec3', // for distribution on results page
      ReusableRecoding_PositiveCols: [3],
      ReusableRecoding_NegativeCols: [1],
      NA_answerCode: null,
      DefaultPage: 'Results',

      DimensionsForSurveysSchemaId: 7170,
      DimensionsForSurveysTable: 'Dimensions in pulse surveys',

      // Page Key KPI
      Page_KPI: {
        isHidden: true,
        KPI: [],
        KPIPositiveAnswerCodes: [],
        KPINegativeAnswerCodes: [],
        KPIthreshold: [{score: 70, color: '#36842D'}, {score: 4, color: '#7e8286'}, {score: 0, color: '#8B565A'}],
        KPIComment: null
      },

      // Page Trend
      Page_Trends: {
        isHidden: true,
        TrendQuestions: []
      },

      // Page Results
      Page_Results: {
        isHidden: false,
        BenchmarkProject: 'p1872887590',
        BenchmarkSet: [{Code: 'hp', Label: { 9: 'High Performing Companies', 20: 'High Performing Companies'}},
                       {Code: 'fs', Label: { 9:'Financial Services', 20: 'Financial Services'}},
                       {Code: 'ps2018', Label: { 9:'People Survey 2018', 20: 'People Survey 2018'}}
                      ],
        HierarchyBasedComparisons: ['1','pDB'], // parent - 1 level up, top - top hierarchy level, number - is specific level
        Dimensions: ['Agility','AuthorityEmpowerment','ClearDirection','Collaboration','Communication','ConfidenceInLeaders','CorporateSocialResponsibility','DigitalStrategy','DiversityAndInclusion','Ethics', 'InvolvingPeopleInChange','ManagingDevelopingPerformance', 'ManagingRisk', 'PayBenefits', 'RespectRecognition', 'TrainingCareerDevelopment', 'UnderstandingOurClients'],
        ResultStatements: null,
        BreakVariables : ['hierarchy', 'Tenure', 'Age', 'FullTime_PartTime', 'Work_with_external_DB_clients', 'Gender', 'I_live_with_children', 'Care', 'LGBT', 'Ethnicity', 'CorporateTitle', 'InternalMobility', 'Region1', 'Country'],
        BreakByTimeUnits: false,
        ScoreType: '%Fav'
      },

      // Page Categorical
      Page_Categorical_: {
        isHidden: false,
        ResultCategoricalQuestions: ['q207', 'q208', 'q211'],    // single-questions for upper cards
        ResultMultiCategoricalQuestions: ['q19', 'q148'],  // multi-questions for bottom cards
        topN_single: 3, // number of top options displayed in cards with singles
        topN_multi: 3, // number of top options displayed in cards with multies
        categoricalAnswerLimit: 5 // if single has more than <categoricalAnswerLimit> answers, it is displayed as topN card. If it has <= categoricalAnswerLimit answers, a pie chart is displayed.,
      },

      // Page Categorical Drilldown
      Page_CategoricalDrilldown: {
        isHidden: false,
        BreakVariables : ['Tenure', 'Age', 'FullTime_PartTime', 'Work_with_external_DB_clients', 'Gender'], // for drill down page
        BreakByTimeUnits: false
      },

      // Page Comments
      Page_Comments: {
        isHidden: false,
        staticColumns: ['interview_end'],
        Comments: ['q186','q187','q188','q189','q190','q225new','q226new'],
        ScoresForComments: ['OM04'], // to display icons the copy of Score question should be used
        TagsForComments: ['Tenure', 'Age', 'FullTime_PartTime', 'Work_with_external_DB_clients', 'Gender', 'I_live_with_children', 'Care', 'LGBT', 'Ethnicity', 'CorporateTitle', 'InternalMobility', 'Region1', 'Country']
      },

      // Page Response Rate
      Page_Response_Rate: {
        isHidden: false,
        DemographicsQuestions: ['Tenure', 'Age', 'FullTime_PartTime', 'CorporateTitle', 'InternalMobility', 'Region1', 'Country']
      }

    }

  ];

}

*/