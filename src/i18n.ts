import { catalog } from "./content/catalog";
import type { Locale } from "./domain/types";

export type UiKey =
  | "appTitle"
  | "appSubtitle"
  | "newLife"
  | "ageStatus"
  | "newGameStatus"
  | "languageToggle"
  | "menuLabel"
  | "menuTitle"
  | "exitGame"
  | "statusDisplay"
  | "statusVisible"
  | "statusHidden"
  | "soundSetting"
  | "soundOn"
  | "soundOff"
  | "navLife"
  | "navActivities"
  | "navRelationships"
  | "navSchool"
  | "navCareer"
  | "navLeaderboard"
  | "navTombstone"
  | "heroTitle"
  | "heroCopy"
  | "startLife"
  | "currentLife"
  | "lifeEnded"
  | "ageLabel"
  | "cashLabel"
  | "statsTitle"
  | "noEvent"
  | "lifeLog"
  | "ageUp"
  | "ageShort"
  | "eventQuestion"
  | "noVisibleChange"
  | "choiceFeedbackTitle"
  | "activityFeedbackTitle"
  | "eventFamily"
  | "eventSchool"
  | "eventCareer"
  | "eventHealth"
  | "eventRelationship"
  | "eventMisc"
  | "statHappiness"
  | "statHealth"
  | "statSmarts"
  | "statLooks"
  | "stageEarlyChildhood"
  | "stageChildhood"
  | "stageTeen"
  | "stageAdult"
  | "stageElder"
  | "activitiesTitle"
  | "activitiesEmpty"
  | "activitiesReady"
  | "activitiesPending"
  | "availableAt"
  | "availableUntil"
  | "activityDoneThisYear"
  | "free"
  | "cost"
  | "groupMindBody"
  | "groupRelationships"
  | "groupEducationCareer"
  | "groupHealth"
  | "groupLeisure"
  | "groupRisk"
  | "relationshipsTitle"
  | "relationshipsEmpty"
  | "relationshipsHint"
  | "noRelationships"
  | "alive"
  | "dead"
  | "relationParent"
  | "relationSibling"
  | "relationFriend"
  | "relationLover"
  | "relationSpouse"
  | "relationChild"
  | "careerTitle"
  | "careerEmpty"
  | "careerHint"
  | "education"
  | "work"
  | "performance"
  | "completedYears"
  | "annualSalary"
  | "workYears"
  | "noCareer"
  | "eduNone"
  | "eduPrimary"
  | "eduSecondary"
  | "eduUniversity"
  | "eduGraduated"
  | "tombstoneTitle"
  | "tombstoneEmpty"
  | "deathAge"
  | "deathCause"
  | "netWorth"
  | "score"
  | "shareId"
  | "submitFailed"
  | "submitting"
  | "submitAnonymous"
  | "causeOldAge"
  | "causeLowHealth"
  | "causeAccident"
  | "leaderboardTitle"
  | "leaderboardFailed"
  | "leaderboardLoading"
  | "leaderboardEmpty"
  | "anonymousLife"
  | "effectCash"
  | "effectRelationship"
  | "effectDisease"
  | "effectDeath";

const uiText: Record<Locale, Record<UiKey, string>> = {
  "zh-CN": {
    appTitle: "Text Life",
    appSubtitle: "人生模拟器",
    newLife: "新局",
    ageStatus: "{age}岁",
    newGameStatus: "新局",
    languageToggle: "EN",
    menuLabel: "主菜单",
    menuTitle: "菜单",
    exitGame: "退出游戏",
    statusDisplay: "状态显示",
    statusVisible: "已显示",
    statusHidden: "已隐藏",
    soundSetting: "声音设置",
    soundOn: "已开启",
    soundOff: "已关闭",
    navLife: "人生",
    navActivities: "活动",
    navRelationships: "关系",
    navSchool: "学校",
    navCareer: "职业",
    navLeaderboard: "排行",
    navTombstone: "墓碑",
    heroTitle: "把一生装进口袋",
    heroCopy: "从出生开始推进年龄，处理事件、经营关系、选择活动，看看这一次会活成怎样的人。",
    startLife: "开始新人生",
    currentLife: "当前人生",
    lifeEnded: "人生已结束",
    ageLabel: "年龄",
    cashLabel: "现金",
    statsTitle: "状态",
    noEvent: "这一年没有未处理事件。准备好就长大一岁。",
    lifeLog: "人生记录",
    ageUp: "年龄+1",
    ageShort: "Age",
    eventQuestion: "你会怎么做？",
    noVisibleChange: "没有明显变化。",
    choiceFeedbackTitle: "选择影响",
    activityFeedbackTitle: "活动影响",
    eventFamily: "家庭",
    eventSchool: "学校",
    eventCareer: "职业",
    eventHealth: "健康",
    eventRelationship: "关系",
    eventMisc: "事件",
    statHappiness: "快乐",
    statHealth: "健康",
    statSmarts: "智力",
    statLooks: "颜值",
    stageEarlyChildhood: "幼年",
    stageChildhood: "童年",
    stageTeen: "青少年",
    stageAdult: "成年",
    stageElder: "老年",
    activitiesTitle: "活动",
    activitiesEmpty: "先开始一段人生，再安排学习、健康、社交和工作。",
    activitiesReady: "每项活动会改变属性、金钱或关系。",
    activitiesPending: "活动按年龄开启；当前事件可以稍后处理。",
    availableAt: "{age}岁后可用",
    availableUntil: "{age}岁前可用",
    activityDoneThisYear: "今年已完成",
    free: "免费",
    cost: "花费 ${amount}",
    groupMindBody: "身心",
    groupRelationships: "关系",
    groupEducationCareer: "学习与职业",
    groupHealth: "健康",
    groupLeisure: "休闲",
    groupRisk: "风险",
    relationshipsTitle: "关系",
    relationshipsEmpty: "开始新人生后，你的家人和朋友会出现在这里。",
    relationshipsHint: "亲密度会随事件和活动上下波动。",
    noRelationships: "这一生还没有可记录的关系。",
    alive: "健在",
    dead: "已故",
    relationParent: "父母",
    relationSibling: "手足",
    relationFriend: "朋友",
    relationLover: "恋人",
    relationSpouse: "伴侣",
    relationChild: "孩子",
    careerTitle: "职业",
    careerEmpty: "开始新人生后，教育和职业履历会在这里更新。",
    careerHint: "学习、兼职和活动会逐步改变职业状态。",
    education: "教育",
    work: "工作",
    performance: "表现",
    completedYears: "已完成 {years} 年",
    annualSalary: "年薪 ${amount}",
    workYears: "工作 {years} 年",
    noCareer: "暂无职业",
    eduNone: "未入学",
    eduPrimary: "小学",
    eduSecondary: "中学",
    eduUniversity: "大学",
    eduGraduated: "已毕业",
    tombstoneTitle: "墓碑",
    tombstoneEmpty: "人生结束后，这里会显示总结。",
    deathAge: "享年 {age} 岁",
    deathCause: "死因",
    netWorth: "净资产",
    score: "得分",
    shareId: "分享编号：{id}",
    submitFailed: "提交失败，请稍后重试。",
    submitting: "提交中...",
    submitAnonymous: "匿名提交",
    causeOldAge: "自然老去",
    causeLowHealth: "健康衰竭",
    causeAccident: "意外事故",
    leaderboardTitle: "排行榜",
    leaderboardFailed: "排行榜加载失败。",
    leaderboardLoading: "排行榜加载中...",
    leaderboardEmpty: "还没有匿名墓碑。",
    anonymousLife: "匿名人生",
    effectCash: "现金 {delta}",
    effectRelationship: "关系 {delta}",
    effectDisease: "新增疾病：{name}",
    effectDeath: "人生结束：{cause}"
  },
  "en-US": {
    appTitle: "Text Life",
    appSubtitle: "Life simulator",
    newLife: "New life",
    ageStatus: "Age {age}",
    newGameStatus: "New",
    languageToggle: "中文",
    menuLabel: "Main menu",
    menuTitle: "Menu",
    exitGame: "Exit game",
    statusDisplay: "Status display",
    statusVisible: "Visible",
    statusHidden: "Hidden",
    soundSetting: "Sound",
    soundOn: "On",
    soundOff: "Off",
    navLife: "Life",
    navActivities: "Activities",
    navRelationships: "Relations",
    navSchool: "School",
    navCareer: "Career",
    navLeaderboard: "Rank",
    navTombstone: "Tomb",
    heroTitle: "Carry a whole life in your pocket",
    heroCopy: "Age up from birth, handle events, manage relationships, pick activities, and see what kind of person this run becomes.",
    startLife: "Start new life",
    currentLife: "Current life",
    lifeEnded: "Life ended",
    ageLabel: "Age",
    cashLabel: "Cash",
    statsTitle: "Stats",
    noEvent: "No pending event this year. Age up when you are ready.",
    lifeLog: "Life log",
    ageUp: "Age +1",
    ageShort: "Age",
    eventQuestion: "What will you do?",
    noVisibleChange: "No visible change.",
    choiceFeedbackTitle: "Choice effects",
    activityFeedbackTitle: "Activity effects",
    eventFamily: "Family",
    eventSchool: "School",
    eventCareer: "Career",
    eventHealth: "Health",
    eventRelationship: "Relationship",
    eventMisc: "Event",
    statHappiness: "Happiness",
    statHealth: "Health",
    statSmarts: "Smarts",
    statLooks: "Looks",
    stageEarlyChildhood: "Infant",
    stageChildhood: "Child",
    stageTeen: "Teen",
    stageAdult: "Adult",
    stageElder: "Elder",
    activitiesTitle: "Activities",
    activitiesEmpty: "Start a life before planning study, health, social, and work activities.",
    activitiesReady: "Each activity can change stats, cash, or relationships.",
    activitiesPending: "Activities unlock by age; the current event can be handled later.",
    availableAt: "Available at {age}",
    availableUntil: "Available until {age}",
    activityDoneThisYear: "Done this year",
    free: "Free",
    cost: "Costs ${amount}",
    groupMindBody: "Mind & body",
    groupRelationships: "Relationships",
    groupEducationCareer: "Study & career",
    groupHealth: "Health",
    groupLeisure: "Leisure",
    groupRisk: "Risk",
    relationshipsTitle: "Relationships",
    relationshipsEmpty: "Your family and friends will appear here after you start a life.",
    relationshipsHint: "Closeness moves up and down through events and activities.",
    noRelationships: "No recorded relationships yet.",
    alive: "Alive",
    dead: "Dead",
    relationParent: "Parent",
    relationSibling: "Sibling",
    relationFriend: "Friend",
    relationLover: "Lover",
    relationSpouse: "Spouse",
    relationChild: "Child",
    careerTitle: "Career",
    careerEmpty: "Education and career history will update here after you start a life.",
    careerHint: "Study, gigs, and activities gradually change career status.",
    education: "Education",
    work: "Work",
    performance: "Performance",
    completedYears: "{years} years completed",
    annualSalary: "Salary ${amount}",
    workYears: "{years} years worked",
    noCareer: "No career",
    eduNone: "Not enrolled",
    eduPrimary: "Primary",
    eduSecondary: "Secondary",
    eduUniversity: "University",
    eduGraduated: "Graduated",
    tombstoneTitle: "Tombstone",
    tombstoneEmpty: "A summary will appear here after life ends.",
    deathAge: "Died at {age}",
    deathCause: "Cause",
    netWorth: "Net worth",
    score: "Score",
    shareId: "Share ID: {id}",
    submitFailed: "Submit failed. Try again later.",
    submitting: "Submitting...",
    submitAnonymous: "Submit anonymously",
    causeOldAge: "Old age",
    causeLowHealth: "Health failure",
    causeAccident: "Accident",
    leaderboardTitle: "Leaderboard",
    leaderboardFailed: "Leaderboard failed to load.",
    leaderboardLoading: "Loading leaderboard...",
    leaderboardEmpty: "No anonymous tombstones yet.",
    anonymousLife: "Anonymous life",
    effectCash: "Cash {delta}",
    effectRelationship: "Relationships {delta}",
    effectDisease: "New disease: {name}",
    effectDeath: "Life ended: {cause}"
  }
};

export function ui(locale: Locale, key: UiKey, params: Record<string, string | number> = {}): string {
  return Object.entries(params).reduce(
    (text, [param, value]) => text.replaceAll(`{${param}}`, String(value)),
    uiText[locale][key]
  );
}

export function contentLabel(locale: Locale, key: string): string {
  return catalog.locales[locale][key] ?? catalog.locales["zh-CN"][key] ?? key;
}

export function formatNumber(locale: Locale, value: number): string {
  return value.toLocaleString(locale);
}

export function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
