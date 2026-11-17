# Bunon demo: voice-over script

Read each line so it starts at its time code; the length column is how long it stays on screen. Total: 3:00. About 150 words a minute is a calm pace.

Record one file for the whole video and save it as `video/public/voiceover.mp3`, then render with `npm run render:voice` (or tell Claude to fit the timings to your recording).

## 1. Problem (0:00.0–0:30.0)

| Start | Length | Words | Line |
|---|---|---|---|
| 0:00.0 | 4.8 s | 12 | Bangladesh has about 3,555 export garment factories and around three million workers. |
| 0:04.8 | 4.2 s | 10 | Every brand they sell to sends its own compliance questionnaire. |
| 0:09.1 | 3.3 s | 7 | One industry questionnaire alone has 871 questions. |
| 0:12.4 | 5.5 s | 14 | Most of them ask the same things: fire safety, wages, working hours, child labour. |
| 0:17.9 | 6.4 s | 17 | In one industry survey, 45 percent of factories paid 5,000 to 20,000 dollars a year on audits. |
| 0:24.2 | 5.8 s | 15 | And new EU rules on due diligence and digital product passports mean even more questions. |

## 2. Solution (0:30.0–1:00.0)

| Start | Length | Words | Line |
|---|---|---|---|
| 0:30.0 | 3.6 s | 8 | Bunon lets a factory answer every buyer once. |
| 0:33.6 | 4.2 s | 10 | The factory uploads its own documents: licences, policies and reports. |
| 0:37.7 | 5.3 s | 14 | AI drafts each answer from those documents and quotes the exact sentence it used. |
| 0:43.1 | 4.2 s | 10 | A person checks every answer before a buyer sees it. |
| 0:47.2 | 3.9 s | 9 | Every approved answer is sealed in a tamper-evident ledger. |
| 0:51.1 | 5.3 s | 14 | So every answer a buyer gets can be traced back to its source sentence. |
| 0:56.4 | 3.6 s | 8 | Bunon checks documents. It does not certify factories. |

## 3. Demo (1:00.0–2:00.0)

| Start | Length | Words | Line |
|---|---|---|---|
| 1:00.0 | 6.4 s | 15 | A buyer writes one questionnaire and sends it to all of its factories at once. |
| 1:06.4 | 6.1 s | 14 | Each factory finds it in its inbox, with its own documents already on file. |
| 1:12.5 | 5.4 s | 12 | One click drafts every answer, and each draft quotes its source sentence. |
| 1:17.9 | 6.7 s | 16 | When a draft doesn't hold up, Bunon never guesses. It hands the question to a person. |
| 1:24.6 | 5.7 s | 13 | The factory approves and sends, and the answer is sealed in the ledger. |
| 1:30.3 | 8.4 s | 21 | When another buyer asks the same thing in other words, Bunon fills in the earlier answer, and a person checks it. |
| 1:38.8 | 6.4 s | 15 | The buyer sees every factory's answer side by side, with the source of each one. |
| 1:45.2 | 7.1 s | 17 | Factory staff can switch the whole workspace to Bangla with one click. এক ক্লিকেই পুরো বুনন বাংলায়। |
| 1:52.2 | 7.8 s | 19 | Either side can unlink, with a 12-hour undo, then download its data for 30 days before it is deleted. |

## 4. AI approach (2:00.0–2:30.0)

| Start | Length | Words | Line |
|---|---|---|---|
| 2:00.0 | 6.4 s | 14 | Drafts are personal: hybrid search covers only that factory's documents, in English and Bangla. |
| 2:06.4 | 7.1 s | 16 | Qwen drafts the answer: on the factory's own computer, or on Cloudflare for our online demo. |
| 2:13.4 | 7.1 s | 16 | Then the checks: the quote must exist word for word, and a second model must agree. |
| 2:20.5 | 9.5 s | 23 | On our test set, the right document came back in the top four for 16 of 16 questions, with zero wrong answers kept. |

## 5. Impact & next step (2:30.0–3:00.0)

| Start | Length | Words | Line |
|---|---|---|---|
| 2:30.0 | 3.9 s | 9 | Factories answer each question once, not once per brand. |
| 2:33.9 | 5.6 s | 15 | An AI draft takes about three seconds, and every answer traces back to its source. |
| 2:39.5 | 5.6 s | 15 | Pilots will measure hours saved per questionnaire, answers with a source, and buyer follow-up questions. |
| 2:45.1 | 6.5 s | 18 | Factories pay one subscription for every brand they serve. Buyers join free and bring their factories with them. |
| 2:51.7 | 5.6 s | 15 | Next: factory pilots in Bangladesh, checks against official registers, and the full SLCP question set. |
| 2:57.3 | 2.7 s | 5 | Bunon. Answer every buyer once. |

## Sources for the numbers

- 3,555 export garment factories, about 3 million workers: Mapped in Bangladesh, Dec 2024, via The Financial Express, 16 Feb 2025.
- 871 base questions: SLCP converged assessment framework v1.7.1 (public flat file).
- 45% of facilities pay $5,000–20,000 a year on audits: WRAP, "How Many Social Audits Are Enough?", Oct 2023.
- Test results (16/16, 0 wrong drafts kept, 9/10): Bunon's own tests, described in the project README.
