import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import { applyMinus, applyPlus, applyTyped, tZoneRollup, toggleUncertain } from "../src/content/first-record.ts";

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
  const allowedOffPage = new Set(["/skin", "/daily", "/community"]);
  check(
    "anchors stay on this page or known places",
    controls.anchors.every(
      (href) => href?.startsWith("#") || allowedOffPage.has(href ?? ""),
    ),
    controls.anchors.join(","),
  );
  check(
    "next section links to three places",
    controls.anchors.includes("/skin") &&
      controls.anchors.includes("/daily") &&
      controls.anchors.includes("/community"),
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
  await page.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("初次皮肤档案"),
  );
  const dialogText = await page.$eval("dialog", (element) => element.innerText);
  check("dialog intro title", dialogText.includes("初次皮肤档案"));
  check("dialog intro explains local-only", dialogText.includes("不会上传或保存到服务器"));
  check("dialog intro lists five steps", dialogText.includes("了解你的皮肤") && dialogText.includes("隐私与分享边界"));
  await page.waitForFunction(
    () => document.activeElement?.textContent?.trim() === "开始了解",
  );
  const dialogFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("dialog focuses start", dialogFocus === "开始了解", dialogFocus ?? "");
  await page.keyboard.press("Tab");
  const tabStillInside = await page.evaluate(() => {
    const active = document.activeElement;
    return active?.closest("dialog") != null;
  });
  check("tab stays inside dialog", tabStillInside);
  await page.keyboard.press("Escape");
  await page.waitForSelector("dialog:not([open])");
  const returned = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("escape returns focus", returned === "开始皮肤档案", returned ?? "");
  await page.screenshot({ path: `${outDir}/mobile-focus-returned.png` });

  await heroButton.click();
  await page.waitForSelector("dialog[open]");
  await page.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("开始了解"),
  );
  await page.screenshot({ path: `${outDir}/mobile-dialog.png` });
  await page.evaluate(() => {
    const start = [...document.querySelectorAll("dialog button")].find(
      (button) => button.textContent?.trim() === "开始了解",
    );
    start?.click();
  });
  await page.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("了解你的皮肤"),
  );
  const stepOne = await page.$eval("dialog", (element) => element.innerText);
  check("wizard opens step 1", stepOne.includes("了解你的皮肤"));
  check(
    "wizard step 1 has concern options",
    stepOne.includes("闭口") && stepOne.includes("反复出现"),
  );
  await page.evaluate(() => {
    const closed = [...document.querySelectorAll("dialog button")].find(
      (button) => button.textContent?.trim() === "闭口",
    );
    closed?.click();
  });
  const closedPressed = await page.$eval(
    'dialog button[aria-pressed="true"]',
    (element) => element.textContent?.trim() === "闭口",
  );
  check("wizard can select an option", closedPressed);
  await page.evaluate(() => {
    const next = [...document.querySelectorAll("dialog button")].find(
      (button) => button.textContent?.trim() === "下一步",
    );
    next?.click();
  });
  await page.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("这些困扰，你已经经历多久了"),
  );
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("dialog button")];
    buttons.find((button) => button.textContent?.trim() === "还没尝试，正在了解")?.click();
    buttons.find((button) => button.textContent?.trim() === "用过护肤产品")?.click();
  });
  const triedState = await page.evaluate(() => {
    const pressed = [...document.querySelectorAll('dialog button[aria-pressed="true"]')].map(
      (button) => button.textContent?.trim(),
    );
    return {
      pressed,
      exclusive:
        pressed.includes("用过护肤产品") && !pressed.includes("还没尝试，正在了解"),
    };
  });
  check("tried exclusive clears not-yet", triedState.exclusive, triedState.pressed.join(","));
  await page.screenshot({ path: `${outDir}/mobile-wizard-step2.png` });
  await page.keyboard.press("Escape");
  await page.waitForSelector("dialog:not([open])");
  check(
    "closed dialog unmounts fields",
    (await page.$$("dialog textarea, dialog input, dialog select")).length === 0,
  );

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

  check("typed empty is empty", applyTyped("").kind === "empty");
  check("typed zero stays zero", applyTyped("0")?.kind === "count" && applyTyped("0")?.value === 0);
  check("typed decimal rejected", applyTyped("1.5") === null);
  check("typed negative rejected", applyTyped("-1") === null);
  check("typed letters rejected", applyTyped("a") === null);
  check("minus on empty stays empty", applyMinus({ kind: "empty" }).kind === "empty");
  check("minus on zero stays zero", applyMinus({ kind: "count", value: 0 }).value === 0);
  check("plus on empty becomes one", applyPlus({ kind: "empty" }).value === 1);
  check("plus on uncertain becomes one", applyPlus({ kind: "uncertain" }).value === 1);
  const blocked = tZoneRollup({ kind: "empty" }, { kind: "uncertain" });
  check(
    "t-zone does not sum gaps as zero",
    blocked.kind === "incomplete" && !("value" in blocked),
    JSON.stringify(blocked),
  );
  const summed = tZoneRollup({ kind: "count", value: 0 }, { kind: "count", value: 2 });
  check("t-zone sums explicit numbers", summed.kind === "sum" && summed.value === 2);
  check("uncertain toggles back to empty", toggleUncertain({ kind: "uncertain" }).kind === "empty");

  const record = await browser.newPage();
  await record.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await record.goto(baseUrl, { waitUntil: "networkidle0" });
  await record.evaluate(() => {
    const originalSet = localStorage.setItem.bind(localStorage);
    window.__storageWrites = [];
    localStorage.setItem = (key, value) => {
      window.__storageWrites.push(String(key));
      return originalSet(key, value);
    };
  });
  await record.click("main button");
  await record.waitForSelector("dialog[open]");
  await record.evaluate(() => {
    [...document.querySelectorAll("dialog button")]
      .find((button) => button.textContent?.trim() === "开始了解")
      ?.click();
  });
  await record.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("了解你的皮肤"),
  );
  await record.evaluate(() => {
    [...document.querySelectorAll("dialog button")]
      .find((button) => button.textContent?.trim() === "闭口")
      ?.click();
  });
  for (let step = 0; step < 4; step += 1) {
    await record.evaluate(() => {
      [...document.querySelectorAll("dialog button")]
        .find((button) => button.textContent?.trim() === "下一步")
        ?.click();
    });
  }
  await record.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("隐私与分享边界"),
  );
  await record.evaluate(() => {
    [...document.querySelectorAll("dialog button")]
      .find((button) => button.textContent?.trim() === "完成")
      ?.click();
  });
  await record.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("建立我的首次记录"),
  );
  const recordRequests = [];
  record.on("request", (request) => {
    recordRequests.push({ url: request.url(), method: request.method() });
  });
  await record.click('dialog a[href="/first-record"]');
  await record.waitForFunction(() => location.pathname === "/first-record");
  check("record page is its own url", record.url().includes("/first-record"));
  const recordIntro = await record.evaluate(() => document.body.innerText);
  check("record page says it is not a saved archive", recordIntro.includes("没有保存成正式档案"));
  check("record page says left is the user's left", recordIntro.includes("画面左侧是你的左脸颊"));
  check("record page lists five areas", ["额头", "鼻子", "左脸颊", "右脸颊", "下巴"].every((label) => recordIntro.includes(label)));
  check("record starts unfilled", recordIntro.includes("未填") && !recordIntro.includes("明确记为 0"));

  const cellStatus = (area, lesion) =>
    record.$eval(`[data-record-cell="${area}:${lesion}"]`, (element) => ({
      status: element.getAttribute("data-status"),
      value: element.getAttribute("data-value"),
    }));

  await record.click('[data-record-cell="额头:黑头"] input');
  await record.keyboard.type("0");
  const explicitZero = await cellStatus("额头", "黑头");
  check("explicit zero is not unfilled", explicitZero.status === "count" && explicitZero.value === "0", JSON.stringify(explicitZero));

  const beforeInvalid = await cellStatus("额头", "闭口");
  await record.$eval('[data-record-cell="额头:闭口"] input', (element) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, "-2");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    setter?.call(element, "1.5");
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const afterInvalid = await cellStatus("额头", "闭口");
  check("invalid count is ignored", afterInvalid.status === beforeInvalid.status && afterInvalid.value === beforeInvalid.value, JSON.stringify(afterInvalid));

  await record.click('[data-record-cell="额头:红肿痘"] button[aria-label="额头红肿痘不确定"]');
  const uncertain = await cellStatus("额头", "红肿痘");
  check("uncertain is separate from zero", uncertain.status === "uncertain" && uncertain.value === "", JSON.stringify(uncertain));

  await record.click('[data-record-cell="额头:脓包痘"] button[aria-label="额头脓包痘增加"]');
  await record.click('[data-record-cell="额头:脓包痘"] button[aria-label="额头脓包痘增加"]');
  const two = await cellStatus("额头", "脓包痘");
  check("plus counts from unfilled to two", two.status === "count" && two.value === "2", JSON.stringify(two));

  await record.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find(
        (button) =>
          button.getAttribute("aria-pressed") != null &&
          button.textContent?.includes("鼻子"),
      )
      ?.click();
  });
  await record.click('[data-record-cell="鼻子:闭口"] button[aria-label="鼻子闭口增加"]');
  await record.click('[data-record-cell="鼻子:闭口"] button[aria-label="鼻子闭口增加"]');
  await record.click('[data-record-cell="鼻子:闭口"] button[aria-label="鼻子闭口增加"]');
  await record.click('[data-record-cell="鼻子:脓包痘"] button[aria-label="鼻子脓包痘增加"]');

  await record.setViewport({ width: 320, height: 700, deviceScaleFactor: 2 });
  const recordNarrow = await record.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  check("record 320 no horizontal scroll", recordNarrow);
  await record.screenshot({ path: `${outDir}/narrow-record.png` });

  await record.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const phoneWide = await record.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  check("record phone no horizontal scroll", phoneWide);
  await record.screenshot({ path: `${outDir}/mobile-record.png` });

  await writeFile(
    "/tmp/record-preview.png",
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  );
  const requestMark = recordRequests.length;
  await record.$eval("input[type=file]", (element) => element.scrollIntoView({ block: "center" }));
  const fileInput = await record.$("input[type=file]");
  await fileInput.uploadFile("/tmp/record-preview.png");
  await record.waitForSelector('img[src^="blob:"]');
  const previewSrc = await record.$eval('img[src^="blob:"]', (element) => element.getAttribute("src"));
  const uploadRequests = recordRequests.slice(requestMark).filter((request) => request.method !== "GET");
  check("photo preview stays a local blob", previewSrc?.startsWith("blob:"), previewSrc ?? "");
  check("photo preview does not upload", uploadRequests.length === 0, uploadRequests.map((request) => request.url).join(","));
  await record.click("text=移除这张预览");
  await record.waitForFunction(() => document.querySelectorAll('img[src^="blob:"]').length === 0);
  check("removed photo preview is cleared", true);

  await record.click("text=完成这次记录");
  await record.waitForFunction(() => document.body.innerText.includes("这次记下的"));
  const summary = await record.evaluate(() => document.body.innerText);
  check("summary shows explicit zero", summary.includes("明确记为 0"));
  check("summary shows uncertain", summary.includes("不确定"));
  check("summary shows counted value", summary.includes("已记为 2"));
  check("summary shows unfilled", summary.includes("未填"));
  const tClosed = await record.$eval('[data-tzone="闭口"]', (element) => element.textContent ?? "");
  check("t-zone closed is not summed as zero", tClosed.includes("未填") && !tClosed.includes("合计"), tClosed);
  const tBlackhead = await record.$eval('[data-tzone="黑头"]', (element) => element.textContent ?? "");
  check("t-zone blackhead blocked by unfilled nose", tBlackhead.includes("鼻子未填") && !tBlackhead.includes("合计"), tBlackhead);
  const tPustule = await record.$eval('[data-tzone="脓包痘"]', (element) => element.textContent ?? "");
  check("t-zone pustule sums both explicit counts", tPustule.includes("合计 3"), tPustule);
  await record.screenshot({ path: `${outDir}/mobile-record-summary.png` });

  const foreheadEdit = await record.$("article button");
  await foreheadEdit.click();
  await record.waitForFunction(() => document.body.innerText.includes("开始时不会替你填 0"));
  const stillZero = await cellStatus("额头", "黑头");
  check("edit keeps explicit zero", stillZero.value === "0", JSON.stringify(stillZero));

  await record.click("text=返回问卷");
  await record.waitForSelector("dialog[open]");
  await record.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("先到这里就很好"),
  );
  for (let step = 0; step < 5; step += 1) {
    await record.evaluate(() => {
      [...document.querySelectorAll("dialog button")]
        .find((button) => button.textContent?.trim() === "上一步")
        ?.click();
    });
  }
  await record.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("了解你的皮肤"),
  );
  const keptConcern = await record.$eval(
    'dialog button[aria-pressed="true"]',
    (element) => element.textContent?.trim() === "闭口",
  );
  check("wizard answer survives the round trip", keptConcern);
  for (let step = 0; step < 4; step += 1) {
    await record.evaluate(() => {
      [...document.querySelectorAll("dialog button")]
        .find((button) => button.textContent?.trim() === "下一步")
        ?.click();
    });
  }
  await record.evaluate(() => {
    [...document.querySelectorAll("dialog button")]
      .find((button) => button.textContent?.trim() === "完成")
      ?.click();
  });
  await record.waitForFunction(() =>
    document.querySelector("dialog")?.innerText.includes("建立我的首次记录"),
  );
  await record.click('dialog a[href="/first-record"]');
  await record.waitForFunction(() => location.pathname === "/first-record");
  const keptZero = await cellStatus("额头", "黑头");
  check("record count survives the round trip", keptZero.status === "count" && keptZero.value === "0", JSON.stringify(keptZero));

  const storageWrites = await record.evaluate(() => window.__storageWrites ?? []);
  check("health answers are not written to localStorage", storageWrites.length === 0, storageWrites.join(","));

  await record.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const desktopRecord = await record.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  check("record desktop no horizontal scroll", desktopRecord);
  await record.screenshot({ path: `${outDir}/desktop-record.png` });

  await record.goto(`${baseUrl}/first-record`, { waitUntil: "networkidle0" });
  const reloaded = await record.evaluate(() => document.body.innerText);
  check("reload does not restore the record", reloaded.includes("未填") && !reloaded.includes("明确记为 0"));
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
if (report.fail.length) process.exit(1);
