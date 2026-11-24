export const places = [
  {
    href: "/skin",
    title: "皮肤管理",
    summary: "看清现在的皮肤状态。从档案和首次记录开始，不是诊断。",
  },
  {
    href: "/daily",
    title: "日常生活",
    summary: "记下最近一段时间的睡眠、饮食和心情。没有对错，也不用来解释长痘。",
  },
  {
    href: "/community",
    title: "社区分享",
    summary: "社区还在规划。记录默认只属于你，分享可以以后再决定。",
  },
] as const;

export const dailyChoices = {
  sleep: ["大多比较够", "有时不够", "经常不够", "不太规律", "暂不回答"],
  diet: ["比较规律", "不太规律", "常常在外或不固定", "暂不回答"],
  mood: ["比较平稳", "有些起伏", "经常低落或紧张", "暂不回答"],
} as const;
