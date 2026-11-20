/**
 * Captures the newer screens for the video (dashboards, AI agent setup, account, pricing) into public/shots/,
 * plus public/shots/targets.json: where the buttons and panels sit in each shot, as fractions of the image, so
 * the video's cursor, camera and callouts land on the real UI.
 *
 *   node scripts/capture-new.mjs        (needs the app's dev server on http://localhost:3001)
 *
 * Local dev server only: its data lives in memory, so nothing here touches the live site.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const LOCAL = process.env.LOCAL ?? "http://localhost:3001";
const OUT = join(process.cwd(), "public", "shots");
const CHROME = join(process.cwd(), "node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe");
const FACTORY = { email: "factory@nodiwear.example", password: "demo123" };
const BUYER = { email: "buyer@nordlys-apparel.example", password: "demo123" };
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const targets = {};

async function setSession(page, user, lang) {
  await page.evaluate((user, lang) => {
    const st = JSON.parse(localStorage.getItem("bunon-storage-v8") || '{"state":{},"version":0}');
    st.state.session = user;
    st.state.lang = lang;
    localStorage.setItem("bunon-storage-v8", JSON.stringify(st));
    localStorage.setItem("bunon-theme", "light");
  }, user, lang);
}

async function signIn(page, who, lang = "en") {
  await page.goto(`${LOCAL}/login`, { waitUntil: "networkidle2" });
  const user = await page.evaluate(async (who) => (await (await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(who) })).json()).user, who);
  await setSession(page, user, lang);
}

async function open(page, url, settle = 1800) {
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} *{caret-color:transparent!important}" });
  await sleep(settle);
}

/**
 * As the live site shows it: the MCP address is the live one, and agent tokens are partly hidden
 * (the local dev token is never valid on the live site, but a video should not show a whole token).
 */
async function tidy(page) {
  await page.evaluate(() => {
    const mask = (t) => t.replace(/bnn_agent_([A-Za-z0-9_-]{4})[A-Za-z0-9_-]+/g, "bnn_agent_$1••••••••••••••••");
    document.querySelectorAll("pre").forEach((p) => (p.textContent = mask((p.textContent ?? "").replace(/http:\/\/localhost:3001/g, "https://bunon-ten.vercel.app"))));
    document.querySelectorAll("input").forEach((i) => {
      if (/bnn_agent_/.test(i.value)) i.value = mask(i.value);
    });
  });
}

/**
 * Saves the shot and the boxes of the named elements, as fractions of the image. A full-page shot is taken with a
 * window as tall as the page, so fixed backgrounds and the top bar sit where they do for a visitor at the top.
 */
async function shot(page, name, boxes = {}, fullPage = false) {
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  if (fullPage) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewport({ width: 1440, height: h, deviceScaleFactor: 2 });
    await sleep(700);
  }
  await tidy(page);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  const found = await page.evaluate((boxes) => {
    const W = document.documentElement.clientWidth;
    const H = window.innerHeight;
    const pick = (sel) => {
      if (sel.startsWith("text=")) {
        const want = sel.slice(5);
        return [...document.querySelectorAll("main button, main a, main p, main h2, main summary, nav a, header button")].find((e) => (e.textContent ?? "").trim().startsWith(want));
      }
      return document.querySelector(sel);
    };
    const out = { aspect: H / W };
    for (const [k, sel] of Object.entries(boxes)) {
      const el = pick(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      out[k] = [r.left / W, r.top / H, r.width / W, r.height / H].map((v) => Math.round(v * 10000) / 10000);
    }
    return out;
  }, boxes);
  if (fullPage) await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  targets[name] = found;
  console.log("  saved", name, Math.round(found.aspect * 1440), "px tall:", Object.keys(found).filter((k) => k !== "aspect").join(", "));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--font-render-hinting=none"],
});
const page = await browser.newPage();

try {
  const nextUp = { card: "section[aria-labelledby='next-up-title']", button: "section[aria-labelledby='next-up-title'] a, section[aria-labelledby='next-up-title'] button", quick: "nav[aria-label='Go to'], nav[aria-label='যান']", lang: "button[aria-label*='Bangla'], button[aria-label*='English']" };

  console.log("Factory dashboards (local)");
  console.log("Compliance Action Plan (local)");
  await signIn(page, FACTORY);
  await open(page, `${LOCAL}/factory/action-plan`, 2500);
  const apBoxes = { form: "form", run: "form button[type=submit]" };
  await shot(page, "action-plan-0", apBoxes, true);
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.evaluate(() => document.querySelector("form button[type=submit]")?.click());
  await page.waitForFunction(() => !!document.querySelector("section[aria-label='Compliance Action Plan']"), { timeout: 30_000 });
  await sleep(800);
  await shot(page, "action-plan-1", { ...apBoxes, plan: "section[aria-label='Compliance Action Plan']", draft: "section[aria-label='Compliance Action Plan'] > div:nth-child(3)", fixes: "section[aria-label='Compliance Action Plan'] > div:last-child" }, true);
  // Keep the other shots' boxes: merge into targets.json.
  const all = JSON.parse(readFileSync(join(OUT, "targets.json"), "utf8"));
  writeFileSync(join(OUT, "targets.json"), JSON.stringify({ ...all, ...targets }, null, 1));
  console.log("targets.json updated");
} finally {
  await browser.close();
}
