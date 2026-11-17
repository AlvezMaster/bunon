/**
 * Captures the product screenshots the demo video uses, into public/shots/.
 * Run again whenever the UI changes:  npm run capture
 *
 *   LOCAL (default http://localhost:3001): the dev server. Demo answers are sent there (in-memory data),
 *          never on the live site.
 *   LIVE  (default https://bunon-ten.vercel.app): only read-only views (document search by meaning).
 *
 * Uses Remotion's own headless Chrome, 1440x900 at 2x for crisp shots.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const LOCAL = process.env.LOCAL ?? "http://localhost:3001";
const LIVE = process.env.LIVE ?? "https://bunon-ten.vercel.app";
const OUT = join(process.cwd(), "public", "shots");
const CHROME = join(process.cwd(), "node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe");
const FACTORY = { email: "factory@nodiwear.example", password: "demo123" };
const BUYER = { email: "buyer@nordlys-apparel.example", password: "demo123" };
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Signs in through the app's own API, from inside the page, so the cookie and the app's state match. */
async function signIn(page, base, who, lang = "en") {
  await page.goto(`${base}/login`, { waitUntil: "networkidle2" });
  await page.evaluate(async (who, lang) => {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(who) });
    const j = await r.json();
    const st = JSON.parse(localStorage.getItem("bunon-storage-v8") || '{"state":{},"version":0}');
    st.state.session = j.user;
    st.state.lang = lang;
    localStorage.setItem("bunon-storage-v8", JSON.stringify(st));
    localStorage.setItem("bunon-theme", "light");
  }, who, lang);
}

async function open(page, url, settle = 1800) {
  await page.goto(url, { waitUntil: "networkidle2" });
  // The Next.js dev badge is not part of the product.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await sleep(settle);
}

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log("  saved", name);
}

/** Answers a few demo questions as the factory, through the API (local only). */
async function seedAnswers(page) {
  const sent = await page.evaluate(async () => {
    const out = [];
    // q10 (building assessment) is the answer Vela's question v03 reuses in the "factory-reuse" shot.
    for (const id of ["q01", "q03", "q05", "q06", "q10"]) {
      const d = (await (await fetch("/api/questionnaire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", questionId: id }) })).json()).draft;
      if (!d || d.status !== "draft") continue;
      const answer = d.answer === "yes" ? (d.value ? `Yes: ${d.value}` : "Yes") : d.answer === "no" ? (d.value ? `No: ${d.value}` : "No") : d.value;
      const r = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", questionId: id, answer, quote: d.quote, docId: d.docId, aiDrafted: true }),
      });
      if (r.ok) out.push(id);
    }
    return out;
  });
  console.log("  answers sent:", sent.join(", ") || "none (already sent?)");
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--font-render-hinting=none"],
});
const page = await browser.newPage();

try {
  console.log("Factory (local)");
  await signIn(page, LOCAL, FACTORY);
  await seedAnswers(page);
  await open(page, `${LOCAL}/factory/questionnaire`);
  await shot(page, "factory-inbox");
  await open(page, `${LOCAL}/factory/questionnaire/nordlys-2026`);
  // Draft the open questions with the model, then show the first drafts.
  await page.locator("button::-p-text(Draft all with AI), button::-p-text(Suggest all from documents)").click();
  await page.waitForFunction(() => ![...document.querySelectorAll("button")].some((b) => /Drafting \d/.test(b.textContent ?? "")), { timeout: 180_000 });
  await sleep(800);
  // A finished draft: the card that shows a quoted source sentence.
  await page.evaluate(() => {
    const card = [...document.querySelectorAll("main ol > li")].find((li) => li.querySelector("blockquote"));
    card?.scrollIntoView({ block: "start" });
    window.scrollBy(0, -110);
  });
  await sleep(600);
  await shot(page, "factory-drafts");
  await page.evaluate(() => {
    const card = [...document.querySelectorAll("li")].find((li) => /Please answer this one yourself/.test(li.textContent ?? ""));
    card?.scrollIntoView({ block: "center" });
  });
  await sleep(600);
  await shot(page, "factory-needs-person");
  await open(page, `${LOCAL}/ledger`);
  await shot(page, "ledger");
  // A second buyer (Vela) asks the building question in other words: the earlier answer is already filled in.
  await open(page, `${LOCAL}/factory/questionnaire/vela-2026`);
  await page.evaluate(() => {
    const banner = [...document.querySelectorAll("main p[role='status']")].find((p) => /ready from/.test(p.textContent ?? ""));
    banner?.scrollIntoView({ block: "start" });
    window.scrollBy(0, -96); // clear the sticky top bar
  });
  await sleep(600);
  await shot(page, "factory-reuse");

  console.log("Factory in Bangla (local)");
  await signIn(page, LOCAL, FACTORY, "bn");
  await open(page, `${LOCAL}/factory`);
  await shot(page, "factory-bangla");

  console.log("Buyer (local)");
  await signIn(page, LOCAL, BUYER);
  await open(page, `${LOCAL}/buyer/questions/new`);
  await page.locator("input[maxlength='120']").fill("Fire safety and wages check");
  // Click the common-question chips directly (a real click can land on the sticky Send bar).
  await page.evaluate(() => {
    const want = ["Does the factory hold a valid fire licence?", "Are all workers paid at least the legal minimum wage?", "Is overtime voluntary?"];
    for (const q of want) [...document.querySelectorAll("button")].find((b) => (b.textContent ?? "").trim().endsWith(q))?.click();
  });
  await sleep(400);
  await page.evaluate(() => window.scrollTo(0, 120));
  await sleep(600);
  await shot(page, "buyer-new");
  await open(page, `${LOCAL}/buyer/questions/nordlys-2026`);
  await page.evaluate(() => {
    const row = [...document.querySelectorAll("main button[aria-expanded]")].find((b) => !b.disabled);
    row?.click();
    row?.closest("li")?.closest("li")?.scrollIntoView({ block: "start" });
    window.scrollBy(0, -120);
  });
  await sleep(800);
  await shot(page, "buyer-compare");
  await open(page, `${LOCAL}/buyer/factories`);
  await shot(page, "buyer-factories");

  console.log("Document search by meaning (live, read-only)");
  await signIn(page, LIVE, FACTORY);
  await open(page, `${LIVE}/factory/documents`, 2500);
  await page.locator("#try-q").fill("কারখানায় কি ১৮ বছরের কম বয়সী কেউ কাজ করে?");
  await page.locator("button::-p-text(Search)").click();
  await page.waitForFunction(() => document.querySelectorAll("section[aria-labelledby='try-title'] ol li").length > 0, { timeout: 60_000 });
  await page.evaluate(() => document.getElementById("try-title")?.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -90));
  await sleep(800);
  await shot(page, "documents-search");
} finally {
  await browser.close();
}
