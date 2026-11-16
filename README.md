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
| Factory documents (fire licence, wage policy, …) | **Synthetic**, written for this demo (`src/lib/fixtures/factory-documents.ts`). |
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
2. **Buyer questions.** A buyer sends a questionnaire to a linked factory. For each question Bunon finds the most relevant passages, and the model drafts an answer with a quote. The server then checks:
   - the quote must appear word for word in the cited document;
   - a separate Naive Bayes decision model must agree that the question is answerable from a document;
   - a "Yes" may not rest on a negative sentence, and a "when / how many" question needs a value, not just "Yes".
   Anything that fails goes to a person. Nothing reaches the buyer until a person presses Send.
3. **Ledger.** Every check, approval and link event is a block in a SHA-256 hash chain. The database refuses to edit or delete blocks. Blocks hold company ids and fingerprints, not answer text, so shared answers can be deleted later while the proof stays.
4. **Accounts and links.** Buyers sign up with email and passphrase; factories add a self-declared profile. A factory invites a buyer with a single-use link (7 days). Either side can unlink alone; nothing changes for 12 hours (undo window), then both can download a ZIP of the shared data for 30 days, after which shared answers are deleted.

## Responsible AI

- **Local model first.** Qwen 3.5 4B runs through Ollama on the factory's computer, so documents do not leave the factory for drafting.
- **Online demo model.** The public website uses the same model family, Qwen, hosted on Cloudflare Workers AI, only on fictional documents. Cloudflare states it does not train on content sent to Workers AI. Drafts are cached for a week to stay within the free daily allowance; if the allowance runs out, the site falls back to rules.
- **Human in the loop.** The model only drafts. A person approves, edits or writes every answer.
- **Grounded answers only.** An answer must quote its source sentence; the quote is checked against the document on the server, including after a person edits the answer.
- **Two models must agree** (language model and decision model) before a draft is offered; disagreements go to a person.
- **Honest labelling.** Simulated data, self-declared profiles and "no AI on this website" are stated on screen.
- **Limits.** The test set is small (13 questions); the decision model's score is optimistic because its training examples were added after the first run. Bangla screen text uses a fixed, reviewed dictionary (not machine translation); a native-speaker review is still pending.

### Evaluation (13 labelled questions; local runs with `npm run eval:qa`, the online model through the same checks on a preview deployment)

| Model | Correct cited answers | Wrong drafts kept | Left for a person (should be) | Avg time |
|---|---|---|---|---|
| qwen3.5:4b | 8 / 10 | 0 | 3 / 3 | 2.7 s |
| qwen3:4b-instruct | 8 / 10 | 0 | 3 / 3 | 2.4 s |
| qwen3.8-27b (Cloudflare Workers AI, online demo) | 9 / 10 | 0 | 3 / 3 | about 2.5 s typical, occasionally 10 s+ |

Certificate reading with qwen3.5:4b takes about 3.4 s per document (valid → verified, expired → flagged, tampered → flagged).

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
- Unlink → 30-day export → deletion of shared answers (`src/lib/server/lifecycle.ts`, daily cron in `vercel.json`).
- Designed with GDPR and Bangladesh's personal-data rules in mind; we do not claim compliance.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000, data in memory
npm test             # unit tests
npm run eval:qa      # questionnaire accuracy test (needs Ollama with qwen3.5:4b)
```

Settings (see `.env.example`): `BUNON_SESSION_SECRET`; `BUNON_DATA_SOURCE` (`auto`, `memory`, `postgres` or `d1`); for D1: `D1_ACCOUNT_ID`, `D1_DATABASE_ID`, `D1_API_TOKEN`; `CRON_SECRET`; `OLLAMA_BASE_URL`. For the hosted model: `AI_PROVIDER=workers-ai` and optionally `WORKERS_AI_MODEL` (the token also needs Workers AI access). Leave `AI_PROVIDER` unset to use Ollama on the same computer. Create the D1 tables with `npx wrangler d1 execute bunon --remote --file db/d1-schema.sql`.

## Tools we used (disclosure)

- **Claude Code (Anthropic)** as an AI coding assistant for design, code and reviews.
- **Qwen 3.5 4B via Ollama** for certificate reading and answer drafting on a local computer, and **Qwen 3.8 27B on Cloudflare Workers AI** for the public demo (prompts in `src/lib/server/questionnaire-ai.ts` and `src/lib/server/ollama.ts`).
- **MCP:** Bunon exposes a small MCP endpoint at `/api/mcp` serving the demo catalog.
- Hosting: **Vercel**; database: **Cloudflare D1**; framework: Next.js 16, React 19, TypeScript, Tailwind CSS.

## Team

| Name | Role |
|---|---|
| _to be filled in_ | _e.g. product and pitch_ |
| _to be filled in_ | _e.g. engineering_ |
| _to be filled in_ | _e.g. research and Bangla review_ |

## Planned (not built yet)

- Real document uploads for any factory's questionnaires (today the demo factory's documents are built in).
- Checks of factory details against government and BGMEA/BKMEA records, with an admin review.
- Per-link encryption keys, email verification and notifications, multi-user companies, billing.
