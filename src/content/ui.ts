/** Short functional labels for navigation and controls. */

export const labels = {
  skip: "跳到主要内容",
  values: "价值观",
  philosophy: "理念",
  next: "后续页面",
  start: "开始皮肤档案",
  previewTitle: "皮肤档案预览",
  building: "建设中",
  noSave: "不填写，不保存。",
  close: "关闭",
  top: "返回顶部",
  nav: "导航",
} as const;

export const stages = [
  "初次皮肤档案",
  "痘痘日常记录",
  "生活与护肤日志",
  "趋势与关联",
] as const;

export const primaryButtonClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-md bg-purple px-5 text-[1.0625rem] font-bold text-cream hover:bg-purple-deep";

export const quietLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-md px-5 text-[1.0625rem] font-bold text-purple ring-1 ring-purple ring-inset hover:bg-paper";
