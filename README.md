# Bunon (বুনন): answer every buyer once

Bangladeshi garment factories answer the same compliance questions again and again, for every brand they sell to. Bunon keeps a factory's evidence in one place, checks each certificate, and drafts answers to buyers' questionnaires **from the factory's own documents, quoting the exact sentence each answer rests on**. A person at the factory approves every answer before the buyer sees it, and every approved answer is sealed in a tamper-evident ledger.

Bunon **checks documents; it does not certify factories.**

- **Live demo:** https://bunon-ten.vercel.app
- **Demo accounts** (fictional companies, passphrase `demo123`):
  - Factory: `factory@nodiwear.example` (Nodiwear Apparel Ltd.)
  - Buyer: `buyer@nordlys-apparel.example` (Nordlys Apparel AB)
- **Track:** International AI Builders Congress 2026, Idea to Unicorn (JusticeSphere → ComplianceOS)

## What is real and what is simulated

| Part | Status |
|---|---|
| Companies, orders, people | **Fictional.** Every company name is invented and marked "(fictional …)" on screen. |
| Factory documents (fire licence, wage policy, …) | The demo factory's are **synthetic**, written for this demo (`src/lib/fixtures/factory-documents.ts`). **Any factory can upload its own** PDFs and text files on the Documents page. |
| Certificate registry | **Simulated** (`src/lib/certificate-registry.ts`), labelled "Simulated registry" on screen. |
| Buyer questionnaires | Written for this demo in the style of common social-audit topics (`src/lib/questionnaire.ts`). |
| Questionnaire drafting, quote checks, ledger, access rules, sign-up, invites, unlink, export | **Real and working** in the code and on the live site. |
| AI model | **Real.** On a factory's own computer (and in our live demo on the day): Qwen 3.5 4B through Ollama, fully local. On the public website, which can't reach anyone's computer: Qwen 3.8 (27B) on Cloudflare Workers AI, working only on the fictional demo documents, and labelled as such on screen. |
| Factory sign-up details (trade licence, BIN, ERC, DIFE) | **Self-declared.** Bunon checks the format only and shows them to buyers as "not checked by Bunon". |

## How it works

```
Factory PC (Ollama, Qwen 3.5 4B)            Bunon web app (Next.js on Vercel)             Cloudflare D1
──────────────────────────────────          ─────────────────────────────────────         ───────────────
read certificate  ─────────────────▶        /api/ingest   check + seal + save renewal ──▶ ledger (append-only)
draft answer with quote ───────────▶        /api/questionnaire  quote must exist in doc ─▶ answers, questions
                                            /api/catalog, /api/links, /api/export        ─▶ companies, links, invites
                                            access.ts: every API returns only your company's
                                            data and that of companies you are linked to
```

1. **Certificates.** A factory uploads a certificate. Bunon reads it (local model, or rules), compares it with the registry, and seals the result in the ledger. Only the server can mark a certificate renewed, and only for that factory's own order and the named supplier.
2. **Buyer questions.** A buyer writes a questionnaire once and sends it to one or more linked factories. For each question Bunon searches **that factory's own documents** two ways at once (keywords, and meaning through multilingual Qwen embeddings, merged with reciprocal rank fusion), and the model drafts an answer from the top 4 passages with a quote. The server then checks:
   - the quote must appear word for word in the cited document;
   - a separate Naive Bayes decision model must agree that the question is answerable from a document;
   - a "Yes" may not rest on a negative sentence, and a "when / how many" question needs a value, not just "Yes".
   Anything that fails goes to a person. Nothing reaches the buyer until a person presses Send.
3. **Answer memory (answer every buyer once).** When a second buyer asks something the factory already answered for another buyer, the earlier approved answer is filled in, with its quote and source. A small question graph links every question to compliance topics (fire safety, wages, child labour, … in English and Bangla). An answer is reused only when both questions share a topic, ask the same kind of thing (yes/no or a value), agree on negatives, numbers and time periods, and are worded alike (shared words, or meaning through embeddings plus some shared words). The quoted sentence must still be in the factory's documents, only the factory's own answers are used, and a person still checks and sends each one. Buyers never see that an answer was reused or for whom. Rules and tests: `src/lib/answer-reuse.ts`, `tests/answer-reuse.test.ts`.
4. **Ledger.** Every check, approval and link event is a block in a SHA-256 hash chain. The database refuses to edit or delete blocks. Blocks hold company ids and fingerprints, not answer text, so shared answers can be deleted later while the proof stays.
5. **Accounts and links.** Buyers sign up with email and passphrase; factories add a self-declared profile. A factory invites a buyer with a single-use link (7 days). Either side can unlink alone; nothing changes for 12 hours (undo window), then both can download a ZIP of the shared data for 30 days, after which shared answers are deleted.
6. **The factory's own AI agent (MCP).** A factory that runs its own AI agent can connect it to Bunon (see below). The agent works inside that factory's data only and can prepare answers, but a person still sends them.

## Connect a factory's AI agent (MCP)

Endpoint: `POST /api/mcp/factory`, Model Context Protocol over JSON-RPC (protocol 2024-11-05). A person at the factory makes an agent token on the **AI agents** page (`/factory/agents`). The token is shown once; Bunon stores only its SHA-256 hash; the factory can have up to 5 and revoke any of them at once. The agent sends `Authorization: Bearer bnn_agent_…`.

```json
{ "mcpServers": { "bunon": { "url": "https://<your-bunon-site>/api/mcp/factory", "headers": { "Authorization": "Bearer <agent token>" } } } }
```

| Tool | What it does |
|---|---|
| `get_overview` | Buyers, open questionnaires, unanswered questions, answers ready to reuse or prepared, documents on file |
| `list_questionnaires`, `get_questionnaire` | Questionnaires and each question's state: sent (with answer and source), prepared, ready from an earlier answer, or open |
| `list_documents`, `search_documents` | The factory's documents, and hybrid search over them (English or Bangla) |
| `draft_answer` | A draft from the factory's documents with its verified quote, after Bunon's checks; saves nothing |
| `prepare_answer` | Leaves an answer for a person to check and send; a quote must be in the cited document |
| `list_buyers` | Linked buyers, unlink states and invites (never the invite links) |
| `get_activity_log` | The factory's tamper-evident log, and whether the chain verifies |
| `list_orders` | Orders and whether every supplier certificate is in date |

**How it stays safe.** Each tool calls the same API handler the web app uses, with a 5-minute session signed for the agent (`agent:<token id>`, that factory only), so the agent sees exactly what a person at the factory sees through `src/lib/server/access.ts`, and nothing more. Sending an answer, linking, unlinking or inviting buyers, uploading or deleting documents, adding orders and writing ledger entries are refused for agent sessions on the server, and no tool offers them. Making or revoking a token and every prepared answer are recorded in the factory's ledger. Code: `src/lib/server/factory-mcp.ts`, `src/lib/server/agent-tokens.ts`, `src/app/api/mcp/factory/route.ts`. Tests: `tests/agent-tokens.test.ts`, and `node scripts/check-factory-mcp.mjs` against a local dev server (every tool, no token or a wrong token refused, another factory's questionnaire not found, made-up quotes refused, a revoked token stops working).

The older `/api/mcp` endpoint is the buyer-side demo: read-only tools over the demo order catalog.

## Plans and billing (factories pay, buyers are free)

| Plan | Price (BDT) | Limits |
|---|---|---|
| Starter | 1 month free, then ৳3,500 a month | 3 linked buyers, 20 documents, no AI agents |
| Pro | ৳7,500 a month | unlimited buyers, 50 documents, up to 5 AI agent tokens |
| Enterprise | quoted per customer (form on `/pricing`) | agreed per contract |

- **Sign-up:** `/pricing` → `/signup?plan=…` creates the factory account on that plan. Starter starts its free month; Pro and Enterprise go to `/factory/billing`.
- **Paying:** through **SSLCommerz**, Bangladesh's payment gateway: bKash, Nagad, Rocket, cards and internet banking in one checkout, for 1, 3, 6 or 12 months at a time (automatic monthly debits are rare in Bangladesh, so Bunon tracks the paid-until date and the factory pays ahead). A payment counts only after SSLCommerz's Order Validation API confirms it and the transaction id, amount and currency match what Bunon asked for; the browser return and the server-to-server IPN both validate, and settling twice changes nothing.
- **When unpaid:** after the free month or paid time ends there are 7 days' grace; then *sending* answers pauses until payment. Reading, drafting and the factory's data are never touched. Plan limits are enforced on the server (buyers on invite and accept, documents on upload, AI agents on token creation and MCP calls). Accounts made before billing existed, such as the demo accounts, keep full use.
- **Records:** plan changes and payments go into the factory's ledger (amounts and references, never card or wallet details).
- **Setup:** register a free sandbox store at developer.sslcommerz.com and set `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` (add `SSLCOMMERZ_LIVE=true` only for a live store). Without them, checkout says "Online payment is not switched on yet".
- Code: `src/lib/plans.ts` (plans and rules), `src/lib/server/billing.ts`, `src/lib/server/sslcommerz.ts`, `src/app/api/billing/`, pages `src/app/pricing` and `src/app/factory/billing`. Tests: `tests/billing.test.ts`.

## Responsible AI

- **Local model first.** Qwen 3.5 4B runs through Ollama on the factory's computer, so documents do not leave the factory for drafting.
- **Online demo model.** The public website uses the same model family, Qwen, hosted on Cloudflare Workers AI, only on fictional documents. Cloudflare states it does not train on content sent to Workers AI. Drafts are cached for a week to stay within the free daily allowance; if the allowance runs out, the site falls back to rules.
- **Human in the loop.** The model only drafts. A person approves, edits or writes every answer.
- **Grounded answers only.** An answer must quote its source sentence; the quote is checked against the document on the server, including after a person edits the answer.
- **Two models must agree** (language model and decision model) before a draft is offered; disagreements go to a person.
- **Personal data never reaches the cloud model.** Before any call to Cloudflare (drafting or search vectors), names after a title or "Name:" label, phone numbers, email addresses and 10–17 digit ID or account numbers are replaced with placeholders such as `[PHONE_1]`; Bunon puts the real values back in the reply on its own server, so quotes still check word for word (`src/lib/personal-data.ts`, `tests/personal-data.test.ts`). The local model needs no masking: nothing leaves the factory.
- **Checked for language bias.** English and Bangla questions are measured side by side, and the gaps found were fixed (see "Language bias check" below).
- **Honest labelling.** Simulated data, self-declared profiles and "no AI on this website" are stated on screen.
- **Limits.** The test set is small (13 questions); the decision model's score is optimistic because its training examples were added after the first run. Bangla screen text uses a fixed, reviewed dictionary (not machine translation); a native-speaker review is still pending.

### Evaluation (13 labelled questions; local runs with `npm run eval:qa`, the online model through the same checks on a preview deployment)

| Model | Correct cited answers | Wrong drafts kept | Left for a person (should be) | Avg time |
|---|---|---|---|---|
| qwen3.5:4b | 8 / 10 | 0 | 3 / 3 | 2.7 s |
| qwen3:4b-instruct | 8 / 10 | 0 | 3 / 3 | 2.4 s |
| qwen3.8-27b (Cloudflare Workers AI, online demo) | 9 / 10 | 0 | 3 / 3 | about 2.5 s typical, occasionally 10 s+ |

Certificate reading with qwen3.5:4b takes about 3.4 s per document (valid → verified, expired → flagged, tampered → flagged).

### Retrieval (16 reworded questions, 4 of them in Bangla; `scripts/rag-questions.ts`)

Does the right document come back? Keyword search runs with `node scripts/eval-retrieval.ts`; hybrid search was measured on a preview deployment through the Documents page's search.

| Search | Right document first | Right document in the top 4 | Bangla questions (first / top 4) |
|---|---|---|---|
| Keywords only, before the Bangla glossary | 9 / 16 | 10 / 16 | 0 / 4 and 0 / 4 |
| Keywords only, with the Bangla glossary | 13 / 16 | 14 / 16 | 4 / 4 and 4 / 4 |
| Keywords + meaning (Qwen3-Embedding 0.6B; measured before the glossary) | 13 / 16 | 16 / 16 | 3 / 4 and 4 / 4 |

### Language bias check (`scripts/eval-bias.ts`, `scripts/bias-questions.ts`)

The same questions in English and in Bangla, on a factory's own computer (keyword search, no embedding model, local qwen3.5:4b). The check found two gaps, both now fixed:

1. **Bangla questions could not find English documents offline** (0 of 12). Fix: a reviewed glossary of compliance terms adds English search words to a Bangla question, and Bangla digits are read as numbers (`src/lib/bangla-glossary.ts`). Because the glossary was written alongside the first 12 questions, we also wrote 8 held-out pairs afterwards and did not change the glossary after seeing their results.
2. **The "a 'when / how many' question needs a value, not just Yes" rule only knew English question words**, so one Bangla "when" question kept a bare "Yes". Fix: Bangla question words (কবে, কত, কী, কোন …; not the yes/no particle কি, and not কোনো "any").

| Check | English | Bangla |
|---|---|---|
| Search, 12 reworded pairs, right document in the top 4 (before the fix) | 10 / 12 | 0 / 12 |
| Search, 12 reworded pairs, after the fix | 10 / 12 | 12 / 12 |
| Search, 8 held-out pairs, after the fix (the honest number) | 6 / 8 | 7 / 8 |
| Drafting, 13 labelled questions, before the fix: correct cited answers · wrong drafts kept | 8 / 10 · 0 | 8 / 10 · 1 |
| Drafting, after the fix: correct cited answers · wrong drafts kept · left for a person (should be) | 8 / 10 · 0 · 3 / 3 | 8 / 10 · 0 · 3 / 3 |

A small labelled sample on synthetic documents: it shows whether one language is served worse, not how good the system is overall.

### Answer reuse (`scripts/eval-reuse.ts`, `scripts/reuse-questions.ts`)

Buyer A's 20 questions are answered. Buyers B and C then ask 40 questions in their own words: 24 repeat one of A's questions, 16 look similar but ask something else (another number, period, detail or kind of answer). Words-only matching, as on a factory computer without an embedding model:

| Repeated questions found | Different questions correctly left alone | Wrong suggestions |
|---|---|---|
| 18 / 24 (75%) | 16 / 16 | 0 of 18 |

The 6 misses use different words for the same thing ("employees" and "statutory" for "workers" and "legal", "women" for "female"); those questions are simply drafted from the documents as usual. A wrong suggestion is the costly mistake, so the rules prefer missing a repeat; a person checks every suggestion anyway. The test set was written by us, not taken from real buyers. `tests/answer-reuse.test.ts` fails if a wrong suggestion ever appears.

### How documents are handled

Upload (PDF with a text layer, .txt or .md, up to 4 MB) → text extraction → passages of about 700 characters split at paragraph and sentence boundaries → an embedding per passage, stored as 8-bit numbers → the file's SHA-256 fingerprint sealed in the ledger. Scanned PDFs without text are refused with a clear message (no OCR yet). The Documents page has a "Try a question" box that shows which passages a question would be answered from, and whether each was found by keywords or by meaning.

## Impact we are aiming for (targets, not measured results)

- Time to answer a 50-question buyer questionnaire: from days to under an hour of review.
- Share of answers that cite a source document: 100%.
- Wrong answers sent to a buyer: 0 (every answer is human-approved and quote-checked).
- Repeat work: each document is uploaded once and reused for every buyer.

## Bangla and localisation

The whole interface switches between English and Bangla (বাংলা) with one button. Factory staff can work in Bangla while buyers read English.

## Privacy and security

- Passwords: scrypt. Sessions: HMAC-signed, httpOnly cookie, 8 hours; the deployment refuses to start without its secret.
- Every API filters on the server by company and link (`src/lib/server/access.ts`).
- Ledger entries are append-only in the database itself (`db/d1-schema.sql`).
- Personal data is masked before any text goes to the cloud AI model and restored only on Bunon's server (`src/lib/personal-data.ts`).
- Unlink → 30-day export → deletion of shared answers (`src/lib/server/lifecycle.ts`, daily cron in `vercel.json`).
- Designed with GDPR and Bangladesh's personal-data rules in mind; we do not claim compliance.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000, data in memory
npm test             # unit tests
npm run eval:qa      # questionnaire accuracy test (needs Ollama with qwen3.5:4b)
```

Meaning search uses `@cf/qwen/qwen3-embedding-0.6b` online (`WORKERS_AI_EMBED_MODEL` to change it) and, on a local computer, an Ollama embedding model named in `OLLAMA_EMBED_MODEL` (default `qwen3-embedding:0.6b`); without one, search uses keywords only.

Settings (see `.env.example`): `BUNON_SESSION_SECRET`; `BUNON_DATA_SOURCE` (`auto`, `memory`, `postgres` or `d1`); for D1: `D1_ACCOUNT_ID`, `D1_DATABASE_ID`, `D1_API_TOKEN`; `CRON_SECRET`; `OLLAMA_BASE_URL`. For the hosted model: `AI_PROVIDER=workers-ai` and optionally `WORKERS_AI_MODEL` (the token also needs Workers AI access). Leave `AI_PROVIDER` unset to use Ollama on the same computer. Create the D1 tables with `npx wrangler d1 execute bunon --remote --file db/d1-schema.sql`.

## Tools we used (disclosure)

- **Claude Code (Anthropic)** as an AI coding assistant for design, code and reviews.
- **Qwen 3.5 4B via Ollama** for certificate reading and answer drafting on a local computer, and **Qwen 3.8 27B on Cloudflare Workers AI** for the public demo (prompts in `src/lib/server/questionnaire-ai.ts` and `src/lib/server/ollama.ts`).
- **MCP:** a factory MCP connector at `/api/mcp/factory` for a factory's own AI agent (see above), and a small buyer-side endpoint at `/api/mcp` serving the demo catalog.
- **Video:** made with **Remotion** (`video/`); the voice-over is generated with **Google Gemini text-to-speech** (voice "Charon", `video/scripts/voice-gemini.mjs`).
- **Payments:** **SSLCommerz** (test mode until the store is approved).
- Hosting: **Vercel**; database: **Cloudflare D1**; framework: Next.js 16, React 19, TypeScript, Tailwind CSS.

## Team

| Name | Role |
|---|---|
| _to be filled in_ | _e.g. product and pitch_ |
| _to be filled in_ | _e.g. engineering_ |
| _to be filled in_ | _e.g. research and Bangla review_ |

## Planned (not built yet)

- Checks of factory details against government and BGMEA/BKMEA records, with an admin review.
- Per-link encryption keys, email verification and notifications, multi-user companies, billing.
