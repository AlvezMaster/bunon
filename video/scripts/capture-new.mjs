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
import { mkdirSync, writeFileSync } from "node:fs";
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
  await signIn(page, FACTORY);
  await open(page, `${LOCAL}/factory`);
  await shot(page, "dash-factory", nextUp);
  await setSession(page, await page.evaluate(async () => (await (await fetch("/api/auth/session")).json()).user), "bn");
  await open(page, `${LOCAL}/factory`);
  await shot(page, "dash-factory-bn", nextUp);

  console.log("AI agent setup (local)");
  await setSession(page, await page.evaluate(async () => (await (await fetch("/api/auth/session")).json()).user), "en");
  await open(page, `${LOCAL}/factory/agents`);
  const agentBoxes = { steps: "ol", name: "#token-name", create: "text=Create token", config: "pre", copy: "text=Copy config", test: "text=Test connection", testInput: "#test-token" };
  await shot(page, "agents-0", agentBoxes, true);
  await page.type("#token-name", "Compliance assistant", { delay: 20 });
  await sleep(300);
  await page.locator("button::-p-text(Create token)").click();
  await page.waitForFunction(() => /Token ready/.test(document.body.textContent ?? ""), { timeout: 20_000 });
  await sleep(700);
  await shot(page, "agents-1", { ...agentBoxes, ready: "text=Token ready" }, true);
  await page.locator("button::-p-text(Test connection)").click();
  await page.waitForFunction(() => /Connected ·/.test(document.body.textContent ?? ""), { timeout: 30_000 });
  await sleep(700);
  await shot(page, "agents-2", { ...agentBoxes, connected: "text=Connected ·", tokens: "#tokens-title" }, true);

  console.log("Buyer dashboard (local)");
  await signIn(page, BUYER);
  await open(page, `${LOCAL}/buyer`);
  await shot(page, "dash-buyer", nextUp);

  console.log("Account page for a new fictional factory (local)");
  await page.goto(`${LOCAL}/login`, { waitUntil: "networkidle2" });
  const user = await page.evaluate(async (pw) => {
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "factory", plan: "starter", company: "Padma Knitwear Ltd. (fictional factory)", fullName: "Farhana Akter", email: `farhana-${Date.now()}@padma-knit.example`, password: pw, country: "BD", address: "Plot 14, BSCIC Industrial Area, Narayanganj", district: "Narayanganj", workers: 640, tradeLicence: "TRAD/NRJ/2026/0417", bin: "0045123987016", erc: "ERC-260417", association: "BKMEA", membershipNo: "BK-2291", difeLicence: "DIFE/NRJ/9912", declaration: true }),
    });
    return (await r.json()).user;
  }, randomUUID());
  await setSession(page, user, "en");
  await open(page, `${LOCAL}/account`);
  const acctBoxes = { profile: "section[aria-label='Your company']", plan: "section[aria-label='Your company'] a", name: "#full-name", pass: "#current-pass", everywhere: "main section:last-of-type button" };
  await shot(page, "account-0", acctBoxes, true);
  await page.evaluate(() => [...document.querySelectorAll("main button")].find((b) => (b.textContent ?? "").trim() === "Sign out everywhere")?.click());
  await page.waitForFunction(() => /Other devices are signed out/.test(document.body.textContent ?? ""), { timeout: 20_000 });
  await sleep(500);
  await shot(page, "account-1", { ...acctBoxes, done: "text=Done." }, true);

  console.log("Pricing (local, public page)");
  await open(page, `${LOCAL}/pricing`);
  await shot(page, "pricing", { plans: "section[aria-label='Plans']", starter: "section[aria-label='Plans'] > *:nth-child(1)", pro: "section[aria-label='Plans'] > *:nth-child(2)", enterprise: "section[aria-label='Plans'] > *:nth-child(3)" }, true);

  writeFileSync(join(OUT, "targets.json"), JSON.stringify(targets, null, 1));
  console.log("targets.json written");
} finally {
  await browser.close();
}
