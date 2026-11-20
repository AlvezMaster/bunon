# Bunon: preliminary submission

**International AI Builders Congress 2026 · Idea to Unicorn · JusticeSphere (compliance)**

Bunon lets a Bangladeshi garment factory answer every buyer's compliance questionnaire once. AI drafts each answer from the factory's own documents and quotes the sentence it used; a person checks and sends it; every answer is sealed in a tamper-evident record. Buyers use it free; factories pay a monthly plan.

| | |
|---|---|
| Live product | https://bunon-ten.vercel.app |
| Code | https://github.com/AlvezMaster/bunon (README has the full technical write-up) |
| 3-minute video | https://youtu.be/z1i6rHLLpqw |
| Team | Maku |
| Try it | Factory `factory@nodiwear.example` · Buyer `buyer@nordlys-apparel.example` · passphrase `demo123` (fictional companies; demo data is labelled on screen) |

---

## 1. The seven mandatory items (Participants Guide §9.2) and where to see them

| Item | In the video | In the product |
|---|---|---|
| 3-minute structured pitch | 0:00–3:00 in the five official parts (Problem, Solution, Demo, AI approach, Impact) | – |
| Clear problem and users | 0:00–0:30: 3,555 export factories, a separate questionnaire from every brand, 871 questions in one industry set | Factory compliance officers; EU buyers |
| AI-native approach (LLM / RAG / graph / ML) | 2:00–2:30: hybrid RAG, Qwen drafting, two-model checks; 1:28: answer memory (question graph) | `/factory/documents` "Try a question"; `/factory/questionnaire` |
| Basic system flow (input → AI → output) | 0:34–0:52: documents → AI draft with quote → person checks → sealed record | Section 2 below |
| Working demo | 1:00–2:00, all screens from the live product | https://bunon-ten.vercel.app |
| Bangla / localisation | 1:49: whole workspace in Bangla; 2:00: search in English and Bangla | Language button on every page; bias check in Section 4 |
| Impact (KPIs) | 2:30–2:50: about 3 s per draft with its source; pilot KPIs: hours saved, answers with a source, buyer follow-ups | Section 4 below; in the app, **Questions** shows "Your results so far", counted from real answers (sent, with a source, reused, time to answer) |

---

## 2. Submission package (Participants Guide §9.1)

### Problem definition
A factory sells to many brands, and each brand sends its own questionnaire about the same things: fire safety, wages, working hours, child labour. One industry questionnaire alone has 871 questions, and 45% of surveyed facilities spend $5,000–20,000 a year on audits (WRAP, 2023). Compliance officers copy the same facts from folders of licences and policies into form after form, and a wrong or out-of-date answer can cost an order. New EU due-diligence rules will add more questions.

**Users:** factory compliance officers and managers (pay), and EU brand sourcing and compliance teams (free).

### AI architecture
```
Factory documents (PDF, text, photos) ──▶ passages (~700 chars, + context) ──▶ hybrid search: keywords + Qwen3 embeddings,
                                                             fused by reciprocal rank (+ Bangla glossary offline)
Buyer's question ──────────────────────────────────────────▶ top 4 passages of THAT factory only
                                                                     │
         answer memory (question graph: topic, question kind,        ▼
         negatives, numbers, wording) ── earlier approved ──▶ Qwen drafts: answer + exact quote + source
         answer for the same question? ──▶ pre-filled                │
                                                                     ▼
                       checks: quote must be word for word in the document · a second (decision) model must
                       agree · a "Yes" may not rest on a negative · "when / how many" needs a value
                                                                     │ fails → "please answer yourself"
                                                                     ▼
                       a person approves, edits or writes ──▶ sent to the buyer ──▶ SHA-256 hash-chained ledger
```
- **Models, open first:** Qwen 3.5 4B, an open model, runs through Ollama on the factory's own computer, so documents never leave the factory; Qwen3-Embedding 0.6B (open) for meaning search; a small Naive Bayes decision model. The hosted website drafts and reads photos with Claude Sonnet 5.5 (Anthropic) when a key is set, or with Qwen on Cloudflare Workers AI (`AI_DRAFTER=qwen`). Personal details are masked before any cloud call.
- **Multimodal:** a factory can upload a photo or scan of a document (JPG, PNG). The same Qwen model reads its text (vision), copying it exactly; the document is marked "read from a photo" so a person checks it. On the factory's own computer the photo never leaves it.
- **Contextual chunking:** documents are split at paragraph and sentence lines, a heading always stays with the text under it, and each passage keeps its context (document title, section heading, the document's opening sentence). The context is searched and embedded with the passage but never quoted, so a passage deep in a long policy still matches a question about that policy's subject.
- **Evidence graph** (`/factory/evidence`): documents, the answers they back and the buyers who received them, as a graph (document → answer → buyer, and answer → reused answer). Walking it answers "if this certificate changes or expires, which answers and which buyers are affected?" It also lists answers sent without a source.
- **Agents (MCP, two servers):** a factory can connect its own AI agent through the factory MCP server (`/api/mcp/factory`): 10 tools scoped to that factory; it can prepare answers but only a person can send them. A buyer can connect its agent to the read-only buyer MCP server (`/api/mcp/buyer`): 6 tools to read answers with their source sentence, search answers across factories and read its activity log.
- **Compliance Action Plan** (`/factory/action-plan`): Bunon watches a list of rules (minimum wage, wage payment, working hours, minimum age; labelled demo versions for now). When a newer version appears than the one the factory last reviewed, the page reports the change on its own and builds the plan: a regulatory diff (what changed, numbers and number words), the documents that state the old wording and those that already meet the new one, the sent answers and buyers affected, a redrafted policy passage, and a fix list. A person approves each fix; every approval and review is recorded in the activity log. Real feeds (Gazette, DIFE, EUR-Lex, buyers' codes) are next.
- **Sample agent** (`examples/factory-agent`): a small factory agent built with the Vercel AI SDK agent loop, running Qwen locally through Ollama, using Bunon's factory MCP server as its tools.
- **Stack:** Next.js 16 on Vercel, Cloudflare D1, TypeScript; 92 automated tests.

### Data and sovereignty strategy
- **Whose data:** each factory's own documents and answers. Every API filters by company and link on the server; a buyer sees only answers sent to it.
- **Where AI runs:** our answer is open models. A factory can run **Qwen, an open model, on its own computer: nothing leaves the factory**. On the hosted website the AI runs in the cloud (Claude, or Qwen on Cloudflare) with **personal data masked first**: names, phone numbers, emails and ID numbers become placeholders and are restored only on Bunon's server.
- **What the record keeps:** the ledger stores company ids and fingerprints, never answer text, so shared answers can be deleted while the proof remains.
- **Original files:** on the hosted site, each uploaded original is kept as a private file in Cloudinary, named by its fingerprint. There is no public link: only the factory's own people can open it, through a signed link that expires after 5 minutes, and deleting the document deletes the file. On a factory's own computer, nothing is sent out.
- **Leaving:** either side can unlink (12-hour undo); both can download the shared data for 30 days; then shared answers are deleted.
- **Demo data:** all companies and documents in the demo are fictional and labelled; the certificate registry is a labelled simulation. Public numbers in the video cite their sources (README, VOICEOVER.md).
- Designed with GDPR and Bangladesh's personal-data rules in mind; we do not claim certification of compliance.

### Demo: a two-minute tour for judges
1. Sign in as the factory → **Questions** → the Nordlys questionnaire → **Draft all with AI**: drafts with quoted sources; questions the documents can't answer go to a person.
2. Still in Nordlys, draft and **send question 10** (independent building safety assessment). Then open the **Vela Outfitters** questionnaire: Vela asks the same thing in other words, and it arrives pre-filled from that answer (answer reuse).
3. **Documents** → "Try a question" in Bangla: কারখানায় কি ১৮ বছরের কম বয়সী কেউ কাজ করে? You can also upload a photo of a document; the AI reads its text (on the website Claude, on a factory's own computer Qwen).
4. **Evidence map** (`/factory/evidence`, after sending an answer or two): select a document to see every answer and buyer that rests on it. **Your results so far** on the Questions page now has a weekly chart of answers sent and reused.
5. **AI agents**: make a token for your own agent (MCP); its prepared answers wait for a person. Buyers have their own read-only **AI agents** page.
6. Sign in as the buyer → **Questions** → one questionnaire sent to two factories, answers side by side with sources.
7. **Pricing** (`/pricing`): plans in taka; factories sign up on a plan and pay through SSLCommerz.

### Scalability roadmap
| When | Product | Scale and markets |
|---|---|---|
| Now (built) | Drafting with sources, answer reuse, Bangla, buyer comparison, ledger, MCP connector, plans and billing | Serverless on Vercel, D1 database, per-factory data scoping; local or cloud AI |
| Next 3 months | Pilots with Bangladeshi factories; checks against official registers; the full SLCP question set | Grow factory by factory; buyers join free and bring their factories |
| 6–12 months | iOS and Android apps; reading scanned licences; more questionnaire standards | Other garment exporters that answer the same industry questionnaires (for example Vietnam, Cambodia, Pakistan, Sri Lanka), each with a language pack |

### Ethical safeguards
- **A person sends every answer.** The AI only drafts; agents can only prepare. The server refuses to let an agent send, link, upload or pay.
- **Grounded answers only.** Every AI answer quotes its source sentence, checked word for word on the server, even after a person edits it.
- **Bunon checks documents; it does not certify factories.** Said in the video and on screen.
- **Bias checked:** English and Bangla measured side by side; two gaps found and fixed (Section 4).
- **Privacy:** personal data masked before any cloud AI call; local mode keeps everything inside the factory.
- **Honesty:** demo data, simulated registry and test-mode payments are labelled; planned features are called "Next".

---

## 3. Business model
| Plan | Price | For |
|---|---|---|
| Starter | first month free, then ৳3,500 / month | one factory, up to 3 buyers, 50 documents |
| Pro | ৳7,500 / month | unlimited buyers, unlimited documents, the factory's own AI agents |
| Enterprise | quote | groups and large factories, AI on their own computers, training |

- **Buyers are always free**, so each buyer brings its factories: the network grows from the buyer side.
- **Payments in Bangladesh:** bKash, Nagad, Rocket, cards and internet banking through SSLCommerz; pay 1–12 months ahead. Trials, limits and grace days are enforced in the product.
- **Size, as an illustration (not a forecast):** if 10% of Bangladesh's 3,555 export factories (about 356) paid Starter to Pro prices, that is ৳15–32 million a year, against the $5,000–20,000 a year many facilities already spend on audits.

---

## 4. Measured results (our own tests; small labelled sets on synthetic documents)
| Test | Result |
|---|---|
| Right document in the top 4 (hybrid search, 16 reworded questions, 4 in Bangla) | 16 / 16 |
| Correct cited answers, local Qwen 3.5 4B (13 labelled questions) | 8 / 10, with 0 wrong drafts kept and 3 / 3 left for a person |
| Language bias check, after fixes | Bangla 8 / 10 = English 8 / 10; Bangla search on new questions 7 / 8 vs English 6 / 8 |
| Answer reuse (40 questions from two more buyers) | 18 / 24 repeats found, 16 / 16 look-alikes left alone, **0 wrong suggestions** |
| Compliance Action Plan (10 labelled synthetic rule changes on the demo documents, keyword search) | 10 / 10 correct plans: 0 documents missed, 0 false alarms, 5 / 5 redrafts carry the new value. Small set; the value-matching rule was tuned on it |
| Draft time | about 3 s per answer (local Qwen 3.5 4B) |
| Photo of a document (a synthetic fire licence, slightly tilted) | Licence number, dates and counts read correctly by local Qwen 3.5 4B; about 1 minute on a laptop |
| Automated tests | 92 passing; plus end-to-end checks of both MCP servers |

Details and how to rerun each test: README, "Evaluation" sections.

---

## 5. Team and roles
| Name | Role |
|---|---|
| _add_ | Product and engineering |
| _add_ | Business and research (factory interviews, pricing, business case) |
| _add_ | _role_ |

---

## 6. Tools and AI disclosure
Built with Claude Code (Anthropic) as the coding assistant. Product AI: Qwen models (Ollama locally, Cloudflare Workers AI online) and Qwen3-Embedding. Video: made with Remotion; the voice-over is generated with Google Gemini text-to-speech. Full list in the README.

## 7. Honest limits
- Test sets are small and the documents are synthetic; real pilots are the next step.
- Photo reading has been tested on one synthetic photo so far; a person checks the text of every photo before it is used.
- No real payments yet: until SSLCommerz is set up, a clearly labelled test checkout shows the payment steps and takes no money, and test payments are marked as tests in the payment history and activity log.
- The certificate registry is a labelled simulation; checks against official registers are planned.
- Bangla interface text still needs a native-speaker review.
