# Bunon demo: voice-over script

Total: 3:00 in five parts. Each line stays on screen for its length; about 150 words a minute is a calm pace.

**ElevenLabs:** generate each line as its own clip and save it as `video/public/vo/line-NN.mp3` (NN = the # column, 01 to 33). Then run `npm run vo` in `video/`: it measures every clip, times each line to its voice (each part keeps its official length) and lists any clip that is too long. Render with `npm run render:voice` (captions on) or `npm run render:clean` (no captions).

Pronunciation: write Bunon as "Boo-non", SLCP as "S. L. C. P.", Qwen as "Kwen" if the voice gets them wrong.

## 1. Problem (0:00.0–0:30.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 01 | 0:00.0 | 7.9 s | 11 | 7.1 s | Bangladesh has about 3,555 export garment factories and three million workers. |
| 02 | 0:07.9 | 3.2 s | 7 | 2.6 s | Every brand sends its own compliance questionnaire. |
| 03 | 0:11.1 | 4.1 s | 6 | 3.5 s | One questionnaire alone has 871 questions. |
| 04 | 0:15.2 | 5.0 s | 10 | 4.3 s | Most ask the same things: fire safety, wages, child labour. |
| 05 | 0:20.2 | 6.3 s | 14 | 5.5 s | 45 percent of surveyed factories spend 5,000 to 20,000 dollars a year on audits. |
| 06 | 0:26.5 | 3.5 s | 9 | 2.9 s | And new EU rules will bring even more questions. |

## 2. Solution (0:30.0–1:00.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 07 | 0:30.0 | 4.1 s | 8 | 3.5 s | Bunon lets a factory answer every buyer once. |
| 08 | 0:34.1 | 5.3 s | 9 | 4.6 s | The factory uploads its documents once: licences, policies, reports. |
| 09 | 0:39.4 | 4.6 s | 10 | 3.9 s | AI drafts each answer, quoting the exact sentence it used. |
| 10 | 0:44.0 | 3.6 s | 10 | 2.9 s | A person checks every answer before a buyer sees it. |
| 11 | 0:47.6 | 3.8 s | 8 | 3.2 s | Approved answers are sealed in a tamper-evident ledger. |
| 12 | 0:51.4 | 4.3 s | 11 | 3.6 s | So every answer can be traced back to its source sentence. |
| 13 | 0:55.7 | 4.3 s | 8 | 3.6 s | Bunon checks documents. It does not certify factories. |

## 3. Demo (1:00.0–2:00.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 14 | 1:00.0 | 6.5 s | 15 | 4.4 s | A buyer writes one questionnaire and sends it to all of its factories at once. |
| 15 | 1:06.5 | 5.6 s | 14 | 3.7 s | Each factory finds it in its inbox, with its own documents already on file. |
| 16 | 1:12.1 | 5.6 s | 12 | 3.7 s | One click drafts every answer, and each draft quotes its source sentence. |
| 17 | 1:17.8 | 5.8 s | 16 | 3.8 s | When a draft doesn't hold up, Bunon never guesses. It hands the question to a person. |
| 18 | 1:23.6 | 4.9 s | 13 | 3.2 s | The factory approves and sends, and the answer is sealed in the ledger. |
| 19 | 1:28.5 | 5.9 s | 17 | 3.9 s | When another buyer asks the same thing in other words, the earlier answer is ready to check. |
| 20 | 1:34.4 | 8.9 s | 19 | 6.1 s | A factory can also connect its own AI agent: it prepares answers, and a person checks and sends them. |
| 21 | 1:43.3 | 6.1 s | 15 | 4.1 s | The buyer sees every factory's answer side by side, with the source of each one. |
| 22 | 1:49.5 | 4.6 s | 12 | 3.0 s | Factory staff can switch the whole workspace to Bangla with one click. |
| 23 | 1:54.1 | 5.9 s | 15 | 3.9 s | Either side can unlink, with a 12-hour undo and 30 days to download its data. |

## 4. AI approach (2:00.0–2:30.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 24 | 2:00.0 | 7.7 s | 14 | 6.2 s | Drafts are personal: hybrid search covers only that factory's documents, in English and Bangla. |
| 25 | 2:07.7 | 8.2 s | 17 | 6.6 s | Qwen, an open AI model, drafts the answer, and it can run on the factory's own computer. |
| 26 | 2:15.9 | 5.7 s | 16 | 4.5 s | Then the checks: the quote must exist word for word, and a second model must agree. |
| 27 | 2:21.6 | 8.4 s | 23 | 6.8 s | On our test set, the right document came back in the top four for 16 of 16 questions, with zero wrong answers kept. |

## 5. Impact & next step (2:30.0–3:00.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 28 | 2:30.0 | 3.7 s | 9 | 3.5 s | Factories answer each question once, not once per brand. |
| 29 | 2:33.7 | 3.2 s | 10 | 3.0 s | An AI draft takes about three seconds, with its source. |
| 30 | 2:36.9 | 4.3 s | 12 | 4.1 s | Pilots will measure hours saved, answers with a source, and buyer follow-ups. |
| 31 | 2:41.2 | 9.4 s | 21 | 9.5 s | Factories pay one plan for every brand: a free first month, then 3,500 taka, or 7,500 for Pro. Buyers join free. |
| 32 | 2:50.6 | 6.7 s | 15 | 6.6 s | Next: factory pilots, register checks, iOS and Android apps, and the full SLCP question set. |
| 33 | 2:57.2 | 2.8 s | 5 | 2.5 s | Bunon. Answer every buyer once. |

## Sources for the numbers

- 3,555 export garment factories, about 3 million workers: Mapped in Bangladesh, Dec 2024, via The Financial Express, 16 Feb 2025.
- 871 base questions: SLCP converged assessment framework v1.7.1 (public flat file).
- 45% of facilities pay $5,000–20,000 a year on audits: WRAP, "How Many Social Audits Are Enough?", Oct 2023.
- Test results (16/16, 0 wrong drafts kept, 8/10 with Qwen 3.5 4B): Bunon's own tests, described in the project README.
