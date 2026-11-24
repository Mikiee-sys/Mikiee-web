/** First-profile wizard copy. Draft options pending final required/optional rules. */

export const wizardCopy = {
  title: "初次皮肤档案",
  introLead:
    "这是一段轻轻的自我了解，不是诊断，也没有标准答案。不确定时可以先跳过，之后也能再回来。",
  introNote: "回答目前只留在这个页面里，不会上传或保存到服务器。以后若接上后端，会再单独说明。",
  start: "开始了解",
  back: "上一步",
  next: "下一步",
  finish: "完成",
  close: "关闭",
  doneTitle: "先到这里就很好",
  doneBody:
    "你已经走完初次了解。记录还不会上传。想休息就关掉；想再改，也可以重新打开。",
  stepProgress: (current: number, total: number) => `第 ${current} 步，共 ${total} 步`,
  otherPlaceholder: "可以简单写几句",
  sensitiveHint: "敏感表现可另选，可与油干混合并存。",
} as const;

export type OptionDef = {
  id: string;
  label: string;
  exclusiveGroup?: string;
  clearsGroup?: string;
  opensText?: boolean;
};

export type QuestionDef = {
  id: string;
  prompt: string;
  hint?: string;
  mode: "single" | "multi";
  options: OptionDef[];
};

export type WizardStepDef = {
  id: string;
  title: string;
  lead?: string;
  closing?: string;
  questions: QuestionDef[];
};

export const wizardSteps: WizardStepDef[] = [
  {
    id: "skin",
    title: "了解你的皮肤",
    lead: "本步不填个数。都是自述，不是诊断；不确定也可以选。",
    questions: [
      {
        id: "concerns",
        prompt: "你目前主要有哪些皮肤困扰？",
        hint: "可多选。",
        mode: "multi",
        options: [
          { id: "closed_comedones", label: "闭口" },
          { id: "blackheads", label: "黑头" },
          { id: "inflammatory", label: "红肿痘" },
          { id: "pustules", label: "脓包痘" },
          { id: "cysts", label: "囊肿痘" },
          { id: "unclear_acne", label: "暂时说不清" },
          { id: "oily", label: "出油" },
          { id: "dry", label: "干燥" },
          { id: "sensitive_flush", label: "敏感泛红" },
          { id: "concern_other", label: "其他", opensText: true },
        ],
      },
      {
        id: "areas",
        prompt: "主要出现在哪些部位？",
        hint: "可多选。T 区可用额头和鼻子表示。",
        mode: "multi",
        options: [
          { id: "forehead", label: "额头" },
          { id: "nose", label: "鼻子" },
          { id: "left_cheek", label: "左颊" },
          { id: "right_cheek", label: "右颊" },
          { id: "chin", label: "下巴" },
        ],
      },
      {
        id: "skin_type",
        prompt: "你觉得目前更接近哪种肤质？",
        hint: "单选。敏感表现可另选，不当成互斥的第五种肤质。",
        mode: "single",
        options: [
          { id: "oily", label: "油性" },
          { id: "dry", label: "干性" },
          { id: "combination", label: "混合型" },
          { id: "normal", label: "中性" },
          { id: "unsure", label: "不确定" },
        ],
      },
      {
        id: "sensitivity",
        prompt: "有没有这些敏感表现？",
        hint: "可多选，可与上面的肤质并存。",
        mode: "multi",
        options: [
          { id: "flush", label: "泛红" },
          { id: "sting", label: "刺痛" },
          { id: "itch", label: "发痒" },
          { id: "none", label: "暂时没有" },
        ],
      },
      {
        id: "pattern",
        prompt: "这些困扰的出现规律更接近哪一种？",
        hint: "单选。不要求自评严重程度。",
        mode: "single",
        options: [
          { id: "occasional", label: "偶尔出现" },
          { id: "recurring", label: "反复出现" },
          { id: "persistent", label: "持续存在且较难完全消退" },
          { id: "stable", label: "目前相对稳定仍在观察" },
          { id: "unsure", label: "不确定" },
        ],
      },
    ],
  },
  {
    id: "history",
    title: "这些困扰，你已经经历多久了",
    questions: [
      {
        id: "duration",
        prompt: "这些困扰大约已经出现多久了？",
        hint: "单选。区间只是方便选择，不是医学标准。",
        mode: "single",
        options: [
          { id: "lt_3m", label: "不足 3 个月" },
          { id: "3_to_6m", label: "3 至不足 6 个月" },
          { id: "6_to_12m", label: "6 至不足 12 个月" },
          { id: "gt_1y", label: "1 年以上" },
          { id: "unclear", label: "记不清" },
        ],
      },
      {
        id: "tried",
        prompt: "你有没有尝试过改善？",
        hint: "可多选。「还没尝试，正在了解」与其他尝试互斥。用过不代表有效或推荐。",
        mode: "multi",
        options: [
          {
            id: "not_yet",
            label: "还没尝试，正在了解",
            exclusiveGroup: "tried",
            clearsGroup: "tried",
          },
          { id: "lifestyle", label: "调整过作息或生活习惯", exclusiveGroup: "tried" },
          { id: "skincare", label: "用过护肤产品", exclusiveGroup: "tried" },
          { id: "self_med", label: "自行用过药物", exclusiveGroup: "tried" },
          { id: "professional", label: "曾寻求过专业医疗帮助", exclusiveGroup: "tried" },
          { id: "prefer_not", label: "不便回答", exclusiveGroup: "tried" },
        ],
      },
      {
        id: "bothers",
        prompt: "目前最困扰你的是什么？",
        hint: "可多选。",
        mode: "multi",
        options: [
          { id: "see_change", label: "想看清自己的变化" },
          { id: "unclear_why", label: "不太清楚为什么会这样" },
          { id: "marks", label: "留下了痘印或痕迹" },
          { id: "discomfort", label: "皮肤不适" },
          { id: "mood", label: "有时会影响心情或自信" },
          { id: "bother_other", label: "其他", opensText: true },
          { id: "skip", label: "暂不回答" },
        ],
      },
    ],
  },
  {
    id: "daily",
    title: "想先了解你最近的日常",
    lead: "没有对错。这里问的是「最近两周」的大体情况，不是每日日志，也不暗示生活习惯导致长痘。",
    questions: [
      {
        id: "sleep",
        prompt: "最近两周，睡眠大体怎样？",
        hint: "单选。",
        mode: "single",
        options: [
          { id: "enough", label: "大多比较够" },
          { id: "sometimes_short", label: "有时不够" },
          { id: "often_short", label: "经常不够" },
          { id: "irregular", label: "不太规律" },
          { id: "skip", label: "暂不回答" },
        ],
      },
      {
        id: "diet",
        prompt: "最近两周，饮食大体怎样？",
        hint: "单选。不把食物分好坏。",
        mode: "single",
        options: [
          { id: "regular", label: "比较规律" },
          { id: "irregular", label: "不太规律" },
          { id: "often_out", label: "常常在外或不固定" },
          { id: "skip", label: "暂不回答" },
        ],
      },
      {
        id: "mood",
        prompt: "最近两周，心情大体怎样？",
        hint: "单选，可跳过。这不是心理测评。",
        mode: "single",
        options: [
          { id: "steady", label: "比较平稳" },
          { id: "ups_downs", label: "有些起伏" },
          { id: "low_tense", label: "经常低落或紧张" },
          { id: "skip", label: "暂不回答" },
        ],
      },
    ],
  },
  {
    id: "companionship",
    title: "你希望我们怎样陪你走接下来的路",
    lead: "谢谢你愿意写下来。想先帮你慢慢看清自己的变化。社区还在规划，可按自己的节奏来，以后也能改主意。",
    closing: "先从看清自己开始，就已经很好。不着急，我们在这里陪着你。",
    questions: [
      {
        id: "hope",
        prompt: "你来到这里，最希望先获得什么？",
        hint: "可多选。关联用于观察，不是找病因或诊断。",
        mode: "multi",
        options: [
          { id: "observe", label: "观察自己的变化" },
          { id: "info", label: "了解更清楚的信息" },
          { id: "peers", label: "看看相似经历或获得支持" },
          { id: "settle", label: "先安顿下来再想" },
          { id: "hope_other", label: "其他", opensText: true },
          { id: "skip", label: "暂不回答" },
        ],
      },
      {
        id: "community",
        prompt: "如果以后有社区，你更想怎样参与？",
        hint: "可多选。每种选择同等尊重，之后可调，不必为融入而分享。不承诺已有活跃社区或医疗咨询。",
        mode: "multi",
        options: [
          { id: "browse", label: "先看看" },
          { id: "private_only", label: "只做私密记录，暂不参与社区" },
          { id: "share_story", label: "愿意分享自己的经历" },
          { id: "encourage", label: "愿意交流、互相鼓励" },
          { id: "later", label: "以后再决定" },
          { id: "skip", label: "暂不回答" },
        ],
      },
    ],
  },
  {
    id: "privacy",
    title: "隐私与分享边界",
    lead: "社区还在规划。你的记录默认只属于你；以后想分享，可以按自己的节奏来，也可以先不决定。",
    questions: [
      {
        id: "identity",
        prompt: "如果以后参与社区，你更希望别人怎样看到你？",
        hint: "单选。匿名只是对其他成员少暴露身份，不是对平台完全不可识别，也不承诺绝对匿名。",
        mode: "single",
        options: [
          { id: "anonymous", label: "用匿名方式参与" },
          { id: "nickname", label: "使用社区昵称和自己选的头像等资料" },
          { id: "later", label: "暂不参与，以后再决定" },
        ],
      },
      {
        id: "share_what",
        prompt: "如果愿意分享，你更想分享哪些内容？",
        hint: "可多选，默认可不选。「暂不分享」与其他项互斥。勾选只是意愿，不是授权发布。",
        mode: "multi",
        options: [
          { id: "text", label: "文字经历", exclusiveGroup: "share" },
          { id: "skincare_feel", label: "护肤使用感受", exclusiveGroup: "share" },
          { id: "trend_summary", label: "自己挑选的趋势摘要", exclusiveGroup: "share" },
          { id: "photos", label: "自己选的照片", exclusiveGroup: "share" },
          {
            id: "none",
            label: "暂不分享",
            exclusiveGroup: "share",
            clearsGroup: "share",
          },
        ],
      },
    ],
  },
];

export type WizardAnswers = Record<
  string,
  { selected: string[]; text?: string }
>;

export function emptyAnswers(): WizardAnswers {
  const answers: WizardAnswers = {};
  for (const step of wizardSteps) {
    for (const question of step.questions) {
      answers[question.id] = { selected: [] };
    }
  }
  return answers;
}

export function toggleAnswer(
  current: WizardAnswers,
  question: QuestionDef,
  optionId: string,
): WizardAnswers {
  const prev = current[question.id] ?? { selected: [] };
  const option = question.options.find((item) => item.id === optionId);
  if (!option) return current;

  let selected = [...prev.selected];

  if (question.mode === "single") {
    selected = selected.includes(optionId) ? [] : [optionId];
  } else if (option.clearsGroup) {
    selected = [optionId];
  } else {
    const alone = question.options.find(
      (item) => item.clearsGroup && item.exclusiveGroup === option.exclusiveGroup,
    );
    selected = selected.filter((id) => id !== alone?.id);
    if (selected.includes(optionId)) {
      selected = selected.filter((id) => id !== optionId);
    } else {
      selected = [...selected, optionId];
    }
  }

  const nextText =
    option.opensText && selected.includes(optionId) ? prev.text : undefined;

  return {
    ...current,
    [question.id]: {
      selected,
      text: option.opensText ? nextText ?? prev.text : prev.text,
    },
  };
}
