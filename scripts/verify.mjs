import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.WELCOME_URL ?? "http://127.0.0.1:43123";
const outDir = process.env.SHOT_DIR ?? "/tmp/welcome-shots";
const chrome =
  process.env.CHROME_PATH ?? "/usr/bin/google-chrome-stable";

const original = [
  "真正的改变始于理解，而不是焦虑。",
  "让每一个有皮肤困扰的人，都能找到理解、支持与科学探索的力量",
  "我们不认为皮肤问题应该成为一个人的标签，也不认为完美的皮肤才值得被欣赏。",
  "我们希望建立一个没有容貌焦虑、没有恶意比较、没有虚假承诺的空间。",
  "在这里，人们可以坦然分享自己的经历，了解自己的皮肤，倾听别人的故事，也可以在暂时没有改善的时候，依然获得尊重。",
  "我们相信，真正的改变始于理解，而不是焦虑。",
  "01. Acceptance · 接纳",
  "不制造容貌焦虑，不定义完美皮肤。",
  "我们尊重每一种皮肤状态。一个人不需要先变得完美，才值得被接纳。",
  "02. Authenticity · 真实",
  "不虚构经历，不包装效果，不做虚假种草。",
  "分享真实的使用过程、改善过程和失败经历。真实比完美更有价值。",
  "03. Science · 科学",
  "尊重科学，不夸大功效。",
  "区分个人体验、科学证据和专业医疗建议。不把相关性当作因果，不用未经证实的信息误导用户。",
  "04. Equality · 平等",
  "不歧视，不羞辱，不进行皮肤状态比较。",
  "无论是轻微闭口、严重痤疮，还是正在恢复的痘印，每个人都拥有平等表达和交流的权利。",
  "05. Support · 互助",
  "我们不是竞争者，而是同行者。",
  "分享经验、给予鼓励、尊重不同的改善速度。一个人的进步，不应该成为另一个人的压力。",
];

function luminance(hex) {
  const channels = [0, 2, 4].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const left = luminance(a);
  const right = luminance(b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHex(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [match[1], match[2], match[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("");
}

const report = { pass: [], fail: [] };
function check(name, ok, detail = "") {
  (ok ? report.pass : report.fail).push({ name, detail });
}

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(baseUrl, { waitUntil: "networkidle0" });

  const html = await page.content();
  for (const line of original) {
    check(`copy:${line.slice(0, 18)}`, html.includes(line));
  }

  const controls = await page.evaluate(() => ({
    inputs: document.querySelectorAll("input, textarea, select, form").length,
    anchors: [...document.querySelectorAll("a")].map((anchor) => anchor.getAttribute("href")),
    buttons: [...document.querySelectorAll("button")].map((button) => button.type),
    lang: document.documentElement.lang,
  }));
  check("no data fields", controls.inputs === 0, JSON.stringify(controls.inputs));
  check(
    "anchors stay on this page",
    controls.anchors.every((href) => href?.startsWith("#")),
    controls.anchors.join(","),
  );
  check(
    "buttons are type=button",
    controls.buttons.every((type) => type === "button"),
    controls.buttons.join(","),
  );
  check("lang zh-Hans", controls.lang === "zh-Hans", controls.lang);

  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].map(
      (face) => `${face.family} ${face.weight} ${face.status}`,
    );
    return {
      h1: getComputedStyle(document.querySelector("h1")).fontFamily,
      body: getComputedStyle(document.body).fontFamily,
      loaded: faces.filter((face) => face.endsWith("loaded")),
    };
  });
  check("heading is serif face", fonts.h1 !== fonts.body, fonts.h1);
  check("subset fonts loaded", fonts.loaded.length >= 2, fonts.loaded.join(" | "));

  const contrastSamples = await page.evaluate(() => {
    function bgOf(element) {
      let node = element;
      while (node) {
        const color = getComputedStyle(node).backgroundColor;
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (match && Number(match[4] ?? 1) > 0.9 && color !== "rgba(0, 0, 0, 0)") {
          return color;
        }
        node = node.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    }
    const slogan = document.querySelector("h1");
    const mission = document.querySelector("main section p");
    const button = document.querySelector("main button");
    const link = document.querySelector('main a[href="#philosophy"]');
    return [slogan, mission, button, link].map((element) => {
      const style = getComputedStyle(element);
      const own = style.backgroundColor;
      const opaque = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/.exec(own);
      const useOwn = opaque && Number(opaque[4] ?? 1) > 0.9;
      return {
        name: element.tagName,
        color: style.color,
        background: useOwn ? own : bgOf(element),
        size: style.fontSize,
      };
    });
  });
  for (const sample of contrastSamples) {
    const fg = rgbToHex(sample.color);
    const bg = rgbToHex(sample.background);
    const ratio = fg && bg ? contrast(fg, bg) : 0;
    check(
      `contrast ${sample.name} ${sample.size}`,
      ratio >= 4.5,
      `${ratio.toFixed(2)} ${sample.color} on ${sample.background}`,
    );
  }

  await page.screenshot({ path: `${outDir}/mobile-home.png` });
  await page.screenshot({ path: `${outDir}/mobile-full.png`, fullPage: true });

  await page.focus("body");
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("first tab is skip link", firstFocus === "跳到主要内容", firstFocus ?? "");
  await page.screenshot({ path: `${outDir}/mobile-skip-focus.png` });
  await page.keyboard.press("Enter");
  const afterSkip = await page.evaluate(() => document.activeElement?.id);
  check("skip link moves to main", afterSkip === "main", afterSkip ?? "");

  const valueCard = await page.$("#values article");
  await valueCard.evaluate((element) =>
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }),
  );
  const valueText = await page.$eval("#values article", (element) => element.innerText);
  check(
    "value card shows full original text",
    valueText.includes("01. Acceptance · 接纳") &&
      valueText.includes("不制造容貌焦虑，不定义完美皮肤。") &&
      valueText.includes(
        "我们尊重每一种皮肤状态。一个人不需要先变得完美，才值得被接纳。",
      ),
    valueText?.slice(0, 60) ?? "",
  );
  check("value cards have no expand control", (await page.$$("summary")).length === 0);
  await page.screenshot({ path: `${outDir}/mobile-value.png` });

  const heroButton = await page.$("main button");
  await heroButton.evaluate((element) =>
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }),
  );
  await heroButton.click();
  await page.waitForSelector("dialog[open]");
  const dialogText = await page.$eval("dialog", (element) => element.innerText);
  check("dialog says preview", dialogText.includes("皮肤档案预览"));
  check("dialog says under construction", dialogText.includes("建设中"));
  check("dialog says nothing is saved", dialogText.includes("不填写，不保存。"));
  check("dialog has no fields", (await page.$$eval("dialog input, dialog textarea, dialog select", (nodes) => nodes.length)) === 0);
  const dialogFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("dialog focuses close", dialogFocus === "关闭", dialogFocus ?? "");
  await page.keyboard.press("Tab");
  const tabStillInside = await page.evaluate(() => {
    const active = document.activeElement;
    return active?.closest("dialog") != null && active.textContent?.trim() === "关闭";
  });
  check("tab stays inside dialog", tabStillInside);
  await page.keyboard.press("Escape");
  await page.waitForSelector("dialog:not([open])");
  const returned = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("escape returns focus", returned === "开始皮肤档案", returned ?? "");
  await page.screenshot({ path: `${outDir}/mobile-focus-returned.png` });

  await heroButton.click();
  await page.waitForSelector("dialog[open]");
  await page.screenshot({ path: `${outDir}/mobile-dialog.png` });
  await page.keyboard.press("Escape");

  await page.$eval('main a[href="#philosophy"]', (element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
    element.click();
  });
  await page.waitForFunction(() => {
    const rect = document.getElementById("philosophy").getBoundingClientRect();
    return rect.top < 180 && rect.top > -40;
  });
  check("philosophy anchor scrolls", true);
  await page.screenshot({ path: `${outDir}/mobile-philosophy.png` });

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await page.screenshot({ path: `${outDir}/desktop-home.png` });
  await page.screenshot({ path: `${outDir}/desktop-full.png`, fullPage: true });
  await page.click("header button");
  await page.waitForSelector("dialog[open]");
  await page.screenshot({ path: `${outDir}/desktop-dialog.png` });
  const backdropClosed = await page.evaluate(() => {
    const dialog = document.querySelector("dialog");
    const rect = dialog.getBoundingClientRect();
    return { x: Math.max(8, rect.left - 24), y: Math.max(8, rect.top - 24) };
  });
  await page.mouse.click(backdropClosed.x, backdropClosed.y);
  const stillOpen = await page.$eval("dialog", (element) => element.open);
  check("backdrop click closes dialog", stillOpen === false);

  const motion = await browser.newPage();
  await motion.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await motion.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await motion.goto(baseUrl, { waitUntil: "networkidle0" });
  const motionStyles = await motion.evaluate(() => {
    const button = document.querySelector("main button");
    return {
      scroll: getComputedStyle(document.documentElement).scrollBehavior,
      transition: getComputedStyle(button).transitionDuration,
    };
  });
  check("reduced motion scroll", motionStyles.scroll === "auto", motionStyles.scroll);
  check(
    "reduced motion transition",
    Number.parseFloat(motionStyles.transition) < 0.05,
    motionStyles.transition,
  );

  const motionOff = await browser.newPage();
  await motionOff.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await motionOff.goto(baseUrl, { waitUntil: "networkidle0" });
  const smooth = await motionOff.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  check("smooth scroll when motion allowed", smooth === "smooth", smooth);

  const horizontal = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });
  check("desktop no horizontal scroll", horizontal);

  await page.setViewport({ width: 320, height: 700, deviceScaleFactor: 2 });
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  const narrow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  check("320 no horizontal scroll", narrow);
  await page.screenshot({ path: `${outDir}/narrow-home.png` });
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
if (report.fail.length) process.exit(1);
