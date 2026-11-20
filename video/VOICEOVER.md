# Bunon demo: voice-over script

Total: 3:00 in five parts. Each line stays on screen for its length; about 150 words a minute is a calm pace.

**ElevenLabs:** generate each line as its own clip and save it as `video/public/vo/line-NN.mp3` (NN = the # column, 01 to 38). Then run `npm run vo` in `video/`: it measures every clip, times each line to its voice (each part keeps its official length) and lists any clip that is too long. Render with `npm run render:voice` (captions on) or `npm run render:clean` (no captions).

Pronunciation: write Bunon as "Boo-non", SLCP as "S. L. C. P.", Qwen as "Kwen" if the voice gets them wrong.

## 1. Problem (0:00.0–0:30.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 01 | 0:00.0 | 3.7 s | 8 | 3.6 s | We're Bunon, a small team in Dhaka, Bangladesh. |
| 02 | 0:03.7 | 6.9 s | 11 | 7.1 s | Bangladesh has about 3,555 export garment factories and three million workers. |
| 03 | 0:10.7 | 2.8 s | 7 | 2.6 s | Every brand sends its own compliance questionnaire. |
| 04 | 0:13.5 | 3.6 s | 6 | 3.5 s | One questionnaire alone has 871 questions. |
| 05 | 0:17.1 | 4.4 s | 10 | 4.3 s | Most ask the same things: fire safety, wages, child labour. |
| 06 | 0:21.5 | 5.5 s | 14 | 5.5 s | 45 percent of surveyed factories spend 5,000 to 20,000 dollars a year on audits. |
| 07 | 0:27.0 | 3.0 s | 9 | 2.9 s | And new EU rules will bring even more questions. |

## 2. Solution (0:30.0–1:00.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 08 | 0:30.0 | 3.6 s | 8 | 3.5 s | Bunon lets a factory answer every buyer once. |
| 09 | 0:33.6 | 3.9 s | 13 | 3.8 s | It's built for garment factories, and for the brands that buy from them. |
| 10 | 0:37.5 | 4.6 s | 9 | 4.6 s | The factory uploads its documents once: licences, policies, reports. |
| 11 | 0:42.1 | 4.0 s | 10 | 3.9 s | AI drafts each answer, quoting the exact sentence it used. |
| 12 | 0:46.1 | 3.1 s | 10 | 2.9 s | A person checks every answer before a buyer sees it. |
| 13 | 0:49.2 | 3.3 s | 8 | 3.2 s | Approved answers are sealed in a tamper-evident ledger. |
| 14 | 0:52.6 | 3.7 s | 11 | 3.6 s | So every answer can be traced back to its source sentence. |
| 15 | 0:56.3 | 3.7 s | 8 | 3.6 s | Bunon checks documents. It does not certify factories. |

## 3. Demo (1:00.0–2:00.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 16 | 1:00.0 | 4.8 s | 15 | 4.4 s | A buyer writes one questionnaire and sends it to all of its factories at once. |
| 17 | 1:04.8 | 4.2 s | 14 | 3.7 s | Each factory finds it in its inbox, with its own documents already on file. |
| 18 | 1:09.0 | 4.2 s | 12 | 3.7 s | One click drafts every answer, and each draft quotes its source sentence. |
| 19 | 1:13.2 | 4.3 s | 16 | 3.8 s | When a draft doesn't hold up, Bunon never guesses. It hands the question to a person. |
| 20 | 1:17.5 | 3.6 s | 13 | 3.2 s | The factory approves and sends, and the answer is sealed in the ledger. |
| 21 | 1:21.2 | 4.4 s | 17 | 3.9 s | When another buyer asks the same thing in other words, the earlier answer is ready to check. |
| 22 | 1:25.6 | 6.6 s | 19 | 6.1 s | A factory can also connect its own AI agent: it prepares answers, and a person checks and sends them. |
| 23 | 1:32.2 | 4.5 s | 12 | 4.1 s | Setting it up takes three steps, and one click tests the connection. |
| 24 | 1:36.7 | 4.6 s | 15 | 4.1 s | The buyer sees every factory's answer side by side, with the source of each one. |
| 25 | 1:41.3 | 4.2 s | 12 | 3.7 s | Each home screen shows only the next job, with one big button. |
| 26 | 1:45.5 | 3.4 s | 12 | 3.0 s | Factory staff can switch the whole workspace to Bangla with one click. |
| 27 | 1:48.9 | 4.4 s | 15 | 3.9 s | Either side can unlink, with a 12-hour undo and 30 days to download its data. |
| 28 | 1:53.3 | 6.7 s | 17 | 6.2 s | And when a rule changes, the Compliance Action Plan shows what it affects and drafts the fixes. |

## 4. AI approach (2:00.0–2:30.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 29 | 2:00.0 | 7.8 s | 14 | 6.2 s | Drafts are personal: hybrid search covers only that factory's documents, in English and Bangla. |
| 30 | 2:07.8 | 7.8 s | 17 | 6.2 s | Qwen, an open-source AI model, drafts the answer, and it can run on the factory's own computer. |
| 31 | 2:15.6 | 5.8 s | 16 | 4.5 s | Then the checks: the quote must exist word for word, and a second model must agree. |
| 32 | 2:21.5 | 8.5 s | 23 | 6.8 s | On our test set, the right document came back in the top four for 16 of 16 questions, with zero wrong answers kept. |

## 5. Impact & next step (2:30.0–3:00.0)

| # | Start | Length | Words | Voice clip | Line |
|---|---|---|---|---|---|
| 33 | 2:30.0 | 3.7 s | 9 | 3.5 s | Factories answer each question once, not once per brand. |
| 34 | 2:33.7 | 3.2 s | 10 | 3.0 s | An AI draft takes about three seconds, with its source. |
| 35 | 2:36.9 | 4.3 s | 12 | 4.1 s | Pilots will measure hours saved, answers with a source, and buyer follow-ups. |
| 36 | 2:41.2 | 9.4 s | 21 | 9.5 s | Factories pay one plan for every brand: a free first month, then 3,500 taka, or 7,500 for Pro. Buyers join free. |
| 37 | 2:50.6 | 6.7 s | 15 | 6.6 s | Next: factory pilots, register checks, iOS and Android apps, and the full SLCP question set. |
| 38 | 2:57.2 | 2.8 s | 5 | 2.5 s | Bunon. Answer every buyer once. |

## Sources for the numbers

- 3,555 export garment factories, about 3 million workers: Mapped in Bangladesh, Dec 2024, via The Financial Express, 16 Feb 2025.
- 871 base questions: SLCP converged assessment framework v1.7.1 (public flat file).
- 45% of facilities pay $5,000–20,000 a year on audits: WRAP, "How Many Social Audits Are Enough?", Oct 2023.
- Test results (16/16, 0 wrong drafts kept, 8/10 with Qwen 3.5 4B): Bunon's own tests, described in the project README.
