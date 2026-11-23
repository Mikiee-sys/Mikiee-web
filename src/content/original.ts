/** User-supplied copy. Keep these strings unchanged. */

export const slogan = "真正的改变始于理解，而不是焦虑。";

export const mission =
  "让每一个有皮肤困扰的人，都能找到理解、支持与科学探索的力量";

export const philosophy = [
  "我们不认为皮肤问题应该成为一个人的标签，也不认为完美的皮肤才值得被欣赏。",
  "我们希望建立一个没有容貌焦虑、没有恶意比较、没有虚假承诺的空间。",
  "在这里，人们可以坦然分享自己的经历，了解自己的皮肤，倾听别人的故事，也可以在暂时没有改善的时候，依然获得尊重。",
  "我们相信，真正的改变始于理解，而不是焦虑。",
] as const;

export const valueTexts = [
  `01. Acceptance · 接纳
不制造容貌焦虑，不定义完美皮肤。
我们尊重每一种皮肤状态。一个人不需要先变得完美，才值得被接纳。`,
  `02. Authenticity · 真实
不虚构经历，不包装效果，不做虚假种草。
分享真实的使用过程、改善过程和失败经历。真实比完美更有价值。`,
  `03. Science · 科学
尊重科学，不夸大功效。
区分个人体验、科学证据和专业医疗建议。不把相关性当作因果，不用未经证实的信息误导用户。`,
  `04. Equality · 平等
不歧视，不羞辱，不进行皮肤状态比较。
无论是轻微闭口、严重痤疮，还是正在恢复的痘印，每个人都拥有平等表达和交流的权利。`,
  `05. Support · 互助
我们不是竞争者，而是同行者。
分享经验、给予鼓励、尊重不同的改善速度。一个人的进步，不应该成为另一个人的压力。`,
] as const;

export const valueEnglish = [
  "Acceptance",
  "Authenticity",
  "Science",
  "Equality",
  "Support",
] as const;

export function splitValue(text: string) {
  const [title = "", lead = "", ...rest] = text.split("\n");
  return { title, lead, rest: rest.join("\n") };
}
