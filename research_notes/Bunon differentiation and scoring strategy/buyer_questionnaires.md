# Buyer compliance questionnaires, self-assessments and data requests for Bangladeshi garment factories (as of 2026-11-09), and how an AI could answer them from verified documents

Access date: every URL below was searched or fetched on 2026-11-09. "(snippet)" means the fact comes from the search-engine summary of that page; the page itself was not opened (fetch blocked with HTTP 403 or not attempted). Facts with no tag come from a page or file that was opened and read. "(file)" means a public PDF or Excel file was downloaded and parsed locally.

## 1. The main instruments and how they are structured

### Takeaway
A Bangladeshi exporter faces three groups of requests. (1) Social-labour assessments: SLCP CAF / Higg FSLM, amfori BSCI, Sedex SAQ + SMETA, and WRAP. (2) Environmental and chemical assessments: Higg FEM, ZDHC Supplier to Zero / InCheck / ClearStream, plus RSC safety for building safety. (3) Newer regulatory data requests that flow down from EU buyers: the VSME / Voluntary Standard (VS) value-chain cap, evidence for the EU Forced Labour Regulation, and Scope 3 / decarbonisation data, mostly collected through Higg FEM. The SLCP question bank is the largest (871 base questions in v1.7.1) and the most machine-readable. It is also the backbone of Higg FSLM.

### Cited Findings

**SLCP Converged Assessment Framework (CAF)**
- The CAF has three elements: (1) the Data Collection Tool, the questionnaire a facility answers by self- or joint-assessment, (2) the Verification Protocol and (3) the Verifier Guidance. The tool can be filled online on an Accredited Host platform or offline in Excel. — [SLCP Glossary PDF (file)](https://slcp.zendesk.com/hc/article_attachments/16346752622620)
- Current version is v1.7.1. Earlier versions (v1.7, v1.6) are on the Help Center as English flat files and difference files. Translations: Chinese, Turkish, Vietnamese, Latin American Spanish and Italian. **No Bengali/Bangla.** "All self-assessment answers must be submitted in English." The Help Center copy is "for information purposes only". A facility must download the tool from its Accredited Host to start an assessment. The article was updated 31 Aug 2026. — [SLCP Help Center: Data Collection Tool](https://slcp.zendesk.com/hc/en-us/articles/6808698730780)
- I parsed the public v1.7.1 English flat file ("1.7.1 Content Alpha 42" sheet). It has 2,109 rows of type "Question" plus 232 "Follow-up" rows. **871 of them are base questions (no multi-select key).** The rest are multi-select sub-items. Base questions by Step: 504 apply to "Step 1, 2 and 3", 292 to "Step 2 and 3" only, 44 to "Step 3 only" and 31 to "Verifier only". — [SLCP v1.7.1 flat file (file)](https://slcp.zendesk.com/hc/article_attachments/25627363522460)
- Question rows by section, all 2,109 including sub-items: Management Systems 449, Health & Safety 410, Facility Profile 309, Wages & Benefits 236, Worker Involvement 168, Worker Treatment 163, Recruitment & Hiring 132, Above & Beyond 83, Working Hours 69, Verification/Assessment Details 51, Termination 39. — [SLCP v1.7.1 flat file (file)](https://slcp.zendesk.com/hc/article_attachments/25627363522460)
- Answer data types across the 2,109 question rows: boolean 1,143, array (pick-list) 604, whole number 194, string 113, numeric 29, percentage 20, date 4, latitude/longitude 1 each. Each row has a stable Key (e.g. `wb-wage-2`), a Number (e.g. `WB-WAGE-2`), Section, Sub-Section, Main Text, More Info, Option List, Show/Hide logic, Validation Scope, "Mandatory Narrative Required" and Step. The Column Explanation sheet notes that keys stay the same from version to version when a question's intent is unchanged, so the file mixes keys from v1.3 to v1.7.0. — [SLCP v1.7.1 flat file (file)](https://slcp.zendesk.com/hc/article_attachments/25627363522460)
- Example questions: "Facility Name (as per business license):" (FP-BAS-1); "OS ID (Open Supply Hub ID) Number:" (FP-OAR-1); "Does the facility maintain only one accurate payroll record?" (WB-WAGE-2); "Payroll records for each worker are not maintained for at least the last 12 months" (WB-WAGE-3-1, a sub-item); "Does the facility evaluate exposure to concentrations of airborne particulates … in line with legal requirements?" (HS-GEN-2). The Overall Completion Percentage must reach 95% before verification. — [SLCP v1.7.1 flat file (file)](https://slcp.zendesk.com/hc/article_attachments/25627363522460)

**Higg Facility Social & Labor Module (FSLM), via Worldly/Cascale**
- The SLCP question sets are built into Higg FSLM, and SLCP verification is valid for FSLM. Cascale says the full module typically takes **4–6 weeks**. The FSLM is completed once every 12 months on a rolling cycle with no fixed deadline. Sources disagree on the CAF version used (Cascale page says v1.6; Worldly release notes say v1.7 / v1.7.1). — [Cascale How to Higg: Prepare for the FSLM (snippet)](https://howtohigg.cascale.org/higg-index-tools/higg-fslm/getting-started/prepare-for-the-fslm); [Worldly FSLM CAF FAQ (snippet)](https://support.worldly.io/hc/en-us/articles/34512746940955-FSLM-CAF-Frequently-Asked-Questions-FAQ); [Worldly April 2025 release notes (snippet)](https://support.worldly.io/hc/en-us/articles/36491576581147-April-2025-release-notes-for-facilities)
- Worldly lets facilities complete the FSLM from an offline Excel file and upload it. — [Worldly: Completing the FSLM from the Offline Excel File (snippet)](https://support.worldly.io/hc/en-us/articles/36568469424667-FSLM-Completing-the-FSLM-Assessment-from-the-Offline-Excel-File)

**Higg Facility Environmental Module (FEM) 2025**
- Sections: Facility Site Info, Permits, EMS, Energy, Water, Wastewater, Air Emissions, Waste, Chemicals, plus Exports & Results. All Level 1 questions now sit in "Foundations". Changes in 2025:
  - Finished Product Processing facility type split in two.
  - Permits questions reworded (operating licences; outstanding environmental violations).
  - Energy: definitions of Energy Attribute Certificates (EACs) and Power Purchase Agreements (PPAs), plus guidance on onsite solar and third-party boilers.
  - New Wastewater Q24 on microfiber control (TSS testing under ZDHC guidelines).
  - Chemical Inventory List guidance.
  - Questions mapped to SASB.
  - Scores may be shared only when third-party verified.
  - **Facilities without a valid business licence or required permit get an automatic 0% score.**
  - Unposting allowed up to 60 days after first posting.
  - The cadence ends 31 Dec 2026.

  — [Worldly: FEM 2025 Summary of Updates](https://support.worldly.io/hc/en-us/articles/41919624428187-FEM-2025-Summary-of-Updates-to-the-Higg-FEM-4-0)
- Higg FEM 2025 went live 6 Nov 2025; the module purchase deadline was 31 Oct 2026. Verification covers Level 1 only. The verification protocol has a Level 1 quantitative-metrics appendix. — [Cascale Higg Facility Tools (snippet)](https://cascale.org/?p=764); [Worldly FEM Verification FAQ (snippet)](https://support.worldly.io/hc/en-us/articles/34232861702811-FEM-Verification-Frequently-Asked-Questions-FAQ); [FEM Verification Protocol v1.6, Oct 2025 (snippet)](https://howtohigg.cascale.org/wp-content/uploads/2025/11/Verification-Protocol-FEMVP2025101.6-_20251031_Final2-1.pdf)
- Worldly publishes a pre-submission checklist built from commonly missed FEM 2024 questions. — [Higg FEM 2025 pre-submission checklist (snippet)](https://go.worldly.io/hubfs/Education%20files/Higg%20FEM%202025%20pre-submission%20checklist.pdf)

**amfori BSCI**
- Audits run against the amfori Code of Conduct, which is translated into **13 Performance Areas**. Full audits every two years cover all 13; ratings run A–E. — [SGS amfori BSCI (snippet)](https://www.sgs.com/services/amfori-bsci); [Eurofins: amfori BSCI audit (snippet)](https://www.eurofins.com/assurance/resources/articles/what-is-amfori-bsci-audit-requirement-benefits-and-process/)
- Before an audit, producers complete a pre-audit information pack that includes a Self-Assessment Questionnaire (SAQ), plus supply-chain mapping and a producer profile on the amfori platform. A small-producer self-declaration, no more than 2 months old, is a precondition for a Small Producer Assessment. — [Bureau Veritas amfori BSCI (snippet)](https://cps.bureauveritas.com/needs/amfori-bsci-social-audit); [amfori support: Small Producer Assessment (snippet)](https://support.amfori.org/en/support/solutions/articles/24000079546-does-my-producer-qualify-for-a-small-producer-assessment-spa-)
- A Consumer Goods Forum SSCI benchmark of amfori mentions 81 questions rated Yes/No/Partial/N/A. It is unclear whether that is the SAQ or the benchmark's own checklist. — [CGF SSCI Benchmarking Report amfori, Nov 2025 (snippet)](https://www.theconsumergoodsforum.com/wp-content/uploads/2025/11/SSCI-Benchmarking-Report_amfori_241125.pdf)

**Sedex SAQ / SMETA**
- In the revised goods-provider SAQ, the maximum number of questions fell from **286 to 158** (−57%). Sites with fewer than 10 workers face at most 52 questions. Which questions appear depends on business type and earlier answers. The SAQ mirrors the sections of the SMETA audit report. A site profile must exist in Sedex Advance before the SAQ can be filled in. Separate SAQs exist for service providers and for environment. — [Sedex: changes to the SAQ for goods providers (snippet; fetch 403)](https://www.sedex.com/knowledge-hub/news/changes-coming-to-the-self-assessment-questionnaire-saq-for-goods-providers/); [Sedex SAQ Guidance PDF (snippet)](https://growers.sunkist.com/wp-content/uploads/sites/4/2021/05/Sedex-SAQ-Guidance.pdf); [Sedex environment SAQ blog (snippet)](https://www.sedex.com/blog/elevate-your-environmental-performance-with-sedexs-environment-self-assessment-questionnaire/)
- Sedex Radar risk assessment uses SAQ data. — [Sedex Radar one-pager (snippet)](https://info.sedex.com/hubfs/Product%20_%20Service%20One%20Pagers/Sedex%20Product%20-%20Radar%20Risk%20Assessment.pdf)

**WRAP (12 Principles)**
- The April 2026 Condensed Pre-Audit Self-Assessment (PASA) is a ~19-page public PDF.
  - Questions: 52 numbered facility questions (Q50–52 apply only to Canada/Mexico), plus annexes: a CAP sign-off page, Appendix C on common non-compliances, and a working-hours improvement form.
  - Example questions: Q13 "Provide applicable business license, other legally required license, and permits, such as environmental, H&S, building safety licenses and permits"; Q18 main buyers and percentages; Q19 audits in the past 12 months; Q21 headcount by gender; Q27 young workers; Q31 domestic migrant workers; Q40 lowest wage paid; Q41 whether wage and attendance records are kept on site.
  - Rules it states: fire drills at least every six months for all shifts, with time-stamped photos and the dates of the last two drills; 30 days of 24/7 CCTV for US-bound goods; internal monitoring every six months; auditors review 90 days of records (production, payroll, licences, permits).
  - Audits are unannounced within a four-week window.
  - WRAP audits assess all 11 ILO forced-labour indicators.
  - In ~6,300 WRAP audits in 2025, 97% of non-compliances fell under four Principles: Health & Safety 57%, Security 21%, Hours of Work 12%, Compliance with Laws 7%.

  — [WRAP Condensed PASA, April 2026 (file)](https://wrapcompliance.org/wp-content/uploads/2026/04/WRAP-Condensed-PASA-April-17-2026-FINAL.pdf)
- The PASA is optional, but WRAP monitoring partners may require it. A 2025 Facility Handbook is public. — [WRAP certification page (snippet)](https://wrapcompliance.org/certification/); [2025 WRAP Facility Handbook (snippet)](https://wrapcompliance.org/wp-content/uploads/2026/03/2025-WRAP-Facility-Handbook.pdf)

**ZDHC (chemicals and wastewater)**
- Supplier to Zero V2 Manual (Version 1, July 2026):
  - Three performance levels (L1 entry to L3 best practice) and several assessment types.
  - Self-assessment is self-declared; "supporting evidence is not required to be submitted", but facilities should keep it.
  - Third-party assessment (desktop or on-site, by a ZDHC Approved Assessment Provider) needs documented evidence for every criterion marked "meets".
  - The assessment period is the 12 months before the assessment. Results are valid one year and must be repeated annually. Level 2 and Level 3 certificates can be extended by desktop assessment.
  - Level 2 requires all L1 criteria, the mandatory L2 criteria, and ≥80% of the remaining L2 criteria in each of the Input, Process and Output focus areas. One failed L1 question means no L1.
  - Example requirements: an active ZDHC InCheck subscription, with an InCheck report in the last three months (12 monthly reports at some levels); wastewater testing at least quarterly; at least one ClearStream report a year (two at higher levels); a valid operating licence; and an SDS / chemical inventory with batch numbers and expiry dates.

  — [ZDHC Supplier to Zero V2 Manual, July 2026 (file)](https://downloads.roadmaptozero.com/Supplier-to-Zero-V2-Manual)
- ClearStream is the wastewater-quality report from ZDHC-accredited labs against the ZDHC Wastewater Guidelines, and brands see it on the ZDHC Gateway. The Wastewater Guidelines V2.2 (Sept 2024) went live on the Gateway on 1 Nov 2024. The newer "Wastewater and Sludge Guidelines V2" take effect **1 Nov 2026**. — [ZDHC Wastewater Guidelines download (snippet)](https://downloads.roadmaptozero.com/output/ZDHC-Wastewater-Guidelines); [ZDHC WWG V2.2 Gateway implementation (snippet)](https://roadmaptozero.com/post/zdhc-wastewater-guidelines-v2-2-implementation-on-zdhc-gateway-includes-process-changes); [ZDHC Wastewater & Sludge Guidelines V2 (snippet)](https://programme.roadmaptozero.com/suppliers/output/wastewater-and-sludge-guidelines-v2)
- BKMEA and ZDHC announced a 36-month programme for Bangladeshi knitwear. It includes InCheck and Supplier to Zero support and ClearStream testing at 25 wet-processing sites. — [Just Style: BKMEA–ZDHC (snippet)](https://www.just-style.com/news/bkmea-zdhc-bangladesh-apparel/); [Global Textile Times (snippet)](https://www.globaltextiletimes.com/news/zdhc-and-bkmea-join-forces-to-strengthen-chemical-and-wastewater-management-in-bangladeshs-knitwear-sector/)

**RSC Bangladesh (successor to the Accord's in-country work)**
- As of 30 June 2026: 1,773 factories, 1,680 active, 81% "RSC Verified as Corrected". Since Jan 2026 the progress reports are quarterly. File names do not match contents: the "DEC-2026" file holds 31 Mar 2026 data. — [RSC BSA Progress Rate Report, Jun 2026 (snippet)](https://internationalaccord.org/wp-content/uploads/2026/08/RSC-BSA-Progress-Rate-Report_JUN-2026_FINAL.pdf); [RSC BSA Progress report "DEC-2026" (snippet)](https://internationalaccord.org/wp-content/uploads/2026/05/RSC-BSA-Progress-Rate-Report_DEC-2026_FINAL.pdf)
- A Corrective Action Plan (CAP) lists time-bound remedial actions by finding severity. Inspection reports go to factory owners, signatory brands and worker representatives. Inspection reports and CAPs are searchable on the International Accord site; the snippet seen showed data as of 31 Dec 2025. — [International Accord: Bangladesh factories (snippet)](https://internationalaccord.org/bangladesh-factories); [RSC About (snippet)](https://www.rsc-bd.org/en/about-us)

**Brand codes and onboarding**
- **H&M:** the Business Partner Sustainability Commitment must be signed by all partners, who must pass it down to the next tier. 2025 Human Rights, Environmental and Due Diligence policies are public PDFs. — [H&M Sustainability Commitment PDF (snippet)](https://hmgroup.com/wp-content/uploads/2020/10/Business-Partner-Sustainability-Commitment_en.pdf); [H&M Sustainability Due Diligence Policy 2025 (snippet)](https://hmgroup.com/wp-content/uploads/2025/09/HMGroup-Sustainabiltiy-Due-Diligence-Policy-2025_v3.pdf)
- **Inditex:** Code of Conduct for Manufacturers and Suppliers. — [Inditex Code PDF via UNGC (snippet)](https://cop.unglobalcompact.org/2023/files/7679_Inditex%20Code%20of%20Conduct%20for%20Manufacturers%20and%20Suppliers.pdf)
- **Primark:** 13-clause Supplier Code of Conduct based on ILO core conventions, a condition of trade. — [Primark Supplier Code (snippet)](https://corporate.primark.com/resources/our-supplier-code-of-conduct)
- **C&A:** public PDFs of the Code of Conduct (March 2023), Supporting Guidelines, Zero Tolerance Issues List and Undisclosed Production Rules (12.2025). C&A has run only unannounced social and environmental audits since 2019. — [C&A Code of Conduct Mar 2023 (snippet)](https://www.c-and-a.com/image/upload/v1681742898/corporate/pdf/reporting/suppliers-business-partners/C_A_Code_of_Conduct_March_2023.pdf); [C&A Zero Tolerance list (snippet)](https://www.c-and-a.com/image/upload/v1768491256/corporate/pdf/Zero%20Tolerance%20Issues%20List.pdf); [C&A Undisclosed Production Rules 12.2025 (snippet)](https://www.c-and-a.com/image/upload/v1764947182/corporate/pdf/Undisclosed_Production_Rules_12.2025.pdf)
- **Bestseller:** suppliers sign a supplier agreement committing to the Code of Conduct and all policies. — [Bestseller supply-chain commitments (snippet)](https://bestseller.com/supply-chain/supply-chain-our-commitments)
- **Lidl:** Supplier Social Compliance Guidance V3 is a public PDF; the Code of Conduct is contractual for direct and indirect suppliers. — [Lidl GB Supplier Social Compliance Guidance V3 (snippet)](https://corporate.lidl.co.uk/content/download/22554/fileupload/Supplier%20Social%20Compliance%20Guidance_V3.pdf)

**EU VSME / Voluntary Standard (VS)**
- EFRAG issued VSME in Dec 2024. The Commission adopted it as Recommendation (EU) 2025/1710 on 30 July 2025. — [EFRAG press release (snippet)](https://www.efrag.org/en/news-and-calendar/news/press-release-efrag-welcomes-european-commissions-recommendation-on-vsme); [EFRAG Digital Template release (snippet)](https://www.efrag.org/en/news-and-calendar/news/release-of-the-vsme-digital-template-xbrl-taxonomy-converter)
- An EFRAG news item (Sept 2026) reports that the Commission adopted the revised ESRS and the **Voluntary Sustainability Reporting Standard (VS)** and that both are in the Official Journal, with minor corrections to the Delegated Acts published 3 July 2026. The VS builds on VSME and targets undertakings with **fewer than 1,000 employees**. Its purpose is to help them answer information requests from larger companies, investors and banks. EFRAG plans an updated Digital Template and Excel-to-XBRL converter features in **Nov 2026**. — [EFRAG: Commission adopts revised ESRS and VS](https://www.efrag.org/en/news-and-calendar/news/european-commission-adopts-revised-esrs-and-voluntary-sustainability-reporting-standard-efrag)
- Value-chain cap: secondary sources say large ESRS reporters may not request more information from smaller value-chain partners than the voluntary standard covers. Sources differ on the legal route and date (one says 19 July 2026). — [EcoVadis blog (snippet)](https://ecovadis.com/blog/efrag-vsme-standard/); [Generation Impact VSME guide (snippet)](https://generationimpact.global/blog/vsme-standard-guide/)
- VSME Basic Module: B1–B2 are general disclosures and B3–B11 are metrics, about 50–54 datapoints depending on how they are counted.
  - B3: energy in MWh (renewable / non-renewable), gross Scope 1 and location-based Scope 2, and GHG intensity per turnover. Scope 3 is not required in Basic.
  - B8: workforce; B9: health & safety; B10: pay, collective bargaining and training; B11: corruption and bribery convictions and fines.

  — [EFRAG Knowledge Hub VSME (snippet)](https://knowledgehub.efrag.org/eng/interactive/vsme); [Coolset VSME Basic Module (snippet)](https://www.coolset.com/academy/the-vsme-standard-understanding-the-basic-module); [csr-tools VSME (snippet)](https://csr-tools.com/en/vsme/); [Green Calculus VSME calculator (snippet)](https://greencalculus.com/calculators/vsme-calculator/)

**EU Forced Labour Regulation (EU) 2024/3015**
- Guidelines adopted 26 June 2026, together with the Forced Labour Single Portal. Linklaters says the final version appeared in the Official Journal on 3 Sept 2026 unchanged. The Regulation applies from **14 Dec 2027**. Due diligence is not mandatory but is recommended (six-step OECD framework). The guidelines include risk indicators based on the 11 ILO indicators. The risk database is still being built. — [Covington, July 2026](https://www.cov.com/en/news-and-insights/insights/2026/07/european-commission-publishes-forced-labour-regulation-guidelines-key-takeaways-for-companies); [Linklaters (snippet)](https://sustainablefutures.linklaters.com/post/102n7tb/eu-forced-labour-regulation-commission-publishes-long-awaited-implementation-gui); [EC FLR page (snippet)](https://single-market-economy.ec.europa.eu/single-market/goods/forced-labour-regulation/what-forced-labour-regulation-and-how-does-it-work_en)
- Evidence an authority may request, which is effectively what buyers will ask suppliers for:
  - traceability documents and certificates of origin;
  - supply-chain maps and affidavits;
  - geolocation;
  - purchase orders, invoices and receipts;
  - production-capacity reports;
  - worker lists, worker-interview transcripts, photos and video, social audits and remediation records;
  - corporate policies, codes of conduct and grievance-mechanism documentation.

  — [Covington, July 2026](https://www.cov.com/en/news-and-insights/insights/2026/07/european-commission-publishes-forced-labour-regulation-guidelines-key-takeaways-for-companies)

**Carbon / Scope 3 supplier data**
- Future Supplier Initiative (Bestseller, Gap Inc., H&M Group, Mango): the first programme is in Bangladesh and covers renewable-energy barriers for Tier 1 and Tier 2 factories, with technical support and de-risked loans. It estimates 99% of brand emissions are Scope 3. — [Fashion Pact press release (snippet)](https://www.thefashionpact.org/the-future-supplier-initiative-press-release/); [H&M news (snippet)](https://hmgroup.com/news/major-brands-commit-to-innovative-collective-financing-model-to-decarbonise-the-fashion-sector/)
- Cascale's State of the Industry 2026 uses verified Higg FEM energy data for 2023–24. Findings: renewables about 2% of energy in Tier 1 and Tier 2; coal 31% overall and 40% in Tier 2; Tier 2 produces more than 50% of supply-chain emissions against about 9% for Tier 1. Nearly 1,300 Bangladeshi factories reported Higg FEM data in 2023. — [Cascale decarbonization topic (snippet)](https://cascale.org/resource-topic/decarbonization/); [Trellis (snippet)](https://trellis.net/article/fashion-mills-emissions-deep-cuts/)
- According to a BHRRC review: H&M targets a 56% absolute Scope 3 cut by 2030 and an onsite-coal phase-out by 2026; Bestseller sets per-factory GHG and energy targets in Bangladesh; Mango gives environmental performance (Higg FEM) 20% of the supplier rating. — [BHRRC: The cost of transition (snippet)](https://www.bhrrc.org/fr/derni%C3%A8res-actualit%C3%A9s/the-cost-of-transition-bangladeshs-suppliers-and-workers-in-fashions-green-rush/)

### Inferences
- The SLCP v1.7.1 flat file is the best canonical question bank for Bunon. It covers SLCP and Higg FSLM directly, its keys are stable across versions, it has typed answers (boolean / array / number), and it is public. Questions from WRAP, Sedex, amfori and brand codes can be mapped onto SLCP keys as a crosswalk.
- On the environmental side there is no equally open bank. Higg FEM content is proprietary. ZDHC Supplier to Zero and the VSME Basic Module are public and could anchor the environment and chemicals datapoints.
- In regulatory terms, VSME/VS (energy, Scope 1/2, workforce) and FLR (traceability plus labour evidence) are the requests rising fastest for EU-facing Bangladeshi suppliers. Both are fully public and lend themselves to document-grounded answering.

### Gaps
- No total question count for Higg FEM 2025 was found; the Worldly and How-to-Higg pages returned 403 or did not state one.
- The current Sedex SAQ count after its relaunch is not confirmed (the Sedex page returned 403).
- The amfori SAQ content is not public; the CGF "81 questions" figure is ambiguous.
- Brand-specific onboarding questionnaires (H&M, Inditex, Primark, C&A, Bestseller, Lidl/Aldi) were not found publicly. Only codes and policies are public.
- Aldi was not researched (no results surfaced).
- I did not confirm whether the VS legal value-chain cap is in force on a specific date.

## 2. Which templates are public (URLs, licences) and which are behind logins

### Takeaway
Fully public and usable in a demo: the SLCP Data Collection Tool v1.7.1 (Excel, downloadable without login; verified with HTTP 200/206), the WRAP Condensed PASA (April 2026 PDF), the ZDHC Supplier to Zero V2 manual and Wastewater Guidelines, the EFRAG VSME/VS Digital Template (free Excel + XBRL converter), the EU FLR guidelines, RSC inspection reports and CAPs, and brand codes of conduct. Behind logins or paywalls: Higg FEM/FSLM on Worldly (paid module purchase), the Sedex SAQ (Sedex Advance site profile), the amfori BSCI SAQ (amfori platform), ZDHC Gateway / InCheck (subscription), and brand supplier portals. Licence terms are mostly not stated anywhere, so the demo should cite and link rather than redistribute.

### Cited Findings
- **SLCP Data Collection Tool v1.7.1:** English versions ("all questions visible", "functional (with macros)", "flat file", "difference file"), plus Chinese, Italian, Spanish, Turkish and Vietnamese. Files are Zendesk attachments. I fetched them without logging in: HTTP 200 for the 1.0 MB English flat file (content-type xlsx) and HTTP 206 for the macro-enabled .xlsm files. The article says the Help Center copy is "for information purposes only". No licence or terms of use are stated in the article. — [SLCP Help Center article](https://slcp.zendesk.com/hc/en-us/articles/6808698730780); [flat file (file)](https://slcp.zendesk.com/hc/article_attachments/25627363522460)
- **WRAP Condensed PASA (April 2026)**, 52 questions, is a public PDF. A grep of the extracted text found no copyright or reproduction statement. — [WRAP Condensed PASA (file)](https://wrapcompliance.org/wp-content/uploads/2026/04/WRAP-Condensed-PASA-April-17-2026-FINAL.pdf). The 2025 Facility Handbook is also public. — [WRAP Facility Handbook 2025 (snippet)](https://wrapcompliance.org/wp-content/uploads/2026/03/2025-WRAP-Facility-Handbook.pdf)
- **ZDHC Supplier to Zero V2 Manual (July 2026)** is a public PDF. — [ZDHC downloads (file)](https://downloads.roadmaptozero.com/Supplier-to-Zero-V2-Manual). The ZDHC Wastewater Guidelines are public. — [ZDHC WWG download (snippet)](https://downloads.roadmaptozero.com/output/ZDHC-Wastewater-Guidelines). The ZDHC Gateway (ClearStream / InCheck reports) is where brands access reports. — [Just Style / ZDHC (snippet)](https://www.just-style.com/news/bkmea-zdhc-bangladesh-apparel/)
- **EFRAG VSME Digital Template:** a free Excel file (v1.2.0 as of Feb 2026) built on an XBRL taxonomy. Users fill in the workbook, upload it to EFRAG's converter at xbrl.efrag.org/convert, and get Inline XBRL, an XBRL report package and XBRL-JSON. A June 2026 explanatory note updates the taxonomy and converter, and EFRAG will maintain the template until at least end-2026. — [VSME Digital Template Explanatory Note Feb 2026 (snippet)](https://xbrl.efrag.org/downloads/vsme/VSME-Digital-Template-and-XBRL-Taxonomy-Explanatory-Note-February-2026.pdf); [June 2026 note (snippet)](https://xbrl.efrag.org/downloads/vsme/VSME-Digital-Template-and-XBRL-Taxonomy-Explanatory-Note-June-2026.pdf); [EFRAG release news (snippet)](https://www.efrag.org/en/news-and-calendar/news/release-of-the-vsme-digital-template-xbrl-taxonomy-converter)
- **Higg FEM:** the facility must buy the module (2025 purchase deadline 31 Oct 2026), and it is completed on the Worldly platform. — [Cascale Higg Facility Tools (snippet)](https://cascale.org/?p=764); [Worldly FEM Getting Started (snippet)](https://support.worldly.io/hc/en-us/articles/36568688024859-Facility-Environmental-Module-FEM-Getting-Started-Guide). Some Higg FEM verification documents (protocol, field guide, QA manual) are public PDFs. — [FEM Verifier Field Guide (snippet)](https://howtohigg.cascale.org/wp-content/uploads/2025/05/Higg-FEM-Verifier-Field-Guide-FEMVFG2024111.1_20251029_Final.pdf); [FEM QA Manual (snippet)](https://marketing-cdn.production.worldly.io/guides/femveri/Higg%20FEM%20QA%20Manual%20-%20FEMQAM2024041.1.pdf)
- **Sedex SAQ:** requires a site in Sedex Advance. — [Sedex SAQ Guidance (snippet)](https://growers.sunkist.com/wp-content/uploads/sites/4/2021/05/Sedex-SAQ-Guidance.pdf)
- **amfori:** the authoritative System Manual needs a member login (per search summary). The SAQ sits in the platform's pre-audit pack. — [Bureau Veritas amfori BSCI (snippet)](https://cps.bureauveritas.com/needs/amfori-bsci-social-audit)
- **RSC:** factory inspection reports and CAPs are searchable publicly. — [International Accord Bangladesh factories (snippet)](https://internationalaccord.org/bangladesh-factories)
- **FLR guidelines** are public, with secondary summaries from law firms and Sedex. — [Sedex FLR blog (snippet)](https://www.sedex.com/blog/eu-forced-labour-regulation-guidelines-and-supply-chain-implications/); [Covington](https://www.cov.com/en/news-and-insights/insights/2026/07/european-commission-publishes-forced-labour-regulation-guidelines-key-takeaways-for-companies)

### Inferences
- A demo pack built only from public sources: (a) the **WRAP Condensed PASA**, a real 52-question pre-audit form that buyers' monitoring partners require; (b) an **SLCP Step 1 subset**, 504 base questions, from the public flat file; (c) **VSME Basic B3 / B8–B10** datapoints from the EFRAG template. That covers social, environment/GHG and EU-regulatory requests without touching proprietary Higg, Sedex or amfori content.
- Because licence terms are not stated, the safest pattern is to load the official file at runtime from its public URL (or keep a local copy for internal demo use only), show attribution, and avoid republishing question text in bulk.

### Gaps
- No explicit licence or terms were found for the SLCP tool, the WRAP PASA, the ZDHC manuals or the EFRAG template; reuse rights are unknown.
- I did not verify whether ZDHC Gateway supplier accounts are free; InCheck needs a subscription per the Supplier to Zero manual.
- Higg FEM/FSLM module prices were not found.

## 3. Size, frequency, time burden, number of buyer formats, and audit fatigue

### Takeaway
Bangladesh has the highest number of social audits per facility of any SLCP country: about 3.6 a year in 2021–2023, while the average fell elsewhere. Typical sizes: SLCP 871 base questions (504 at Step 1), Sedex SAQ up to 158, WRAP PASA 52, VSME Basic about 50 datapoints. Most are annual (SLCP/FSLM every 12 months, Higg FEM yearly cycle, Supplier to Zero annual, amfori full audit every 2 years). Factories pay most of the audit cost themselves, and duplication is widely documented. That is the motivation behind SLCP.

### Cited Findings
- ITC report *Navigating the Regulatory Landscape: Audit fatigue in the garment and textile industry* (July 2024, doc GIVC-24-173.E): average social audits per facility in Bangladesh were 3.6 (2021), 3.7 (2022) and 3.6 (2023). Comparable 2023 figures: China 2.8, Vietnam 2.6, Türkiye 2.3, India 2.2. Bangladesh is the only country where the average did not fall. 439 SLCP signatories were surveyed; 57% source from Bangladesh. — [Apparel Resources, 29 Aug 2024](https://apparelresources.com/business-news/sustainability/report-says-bangladesh-rmg-industry-tops-global-social-audits/); [ITC page (snippet)](https://intracen.org/es/media/18763)
- For facilities using the CAF, average social audits fell 13% over three years, from 3.1 (2021) to 2.7 (2023). — [ITC via search summary (snippet)](https://intracen.org/fr/node/396571)
- WRAP survey (Aug–Sep 2023), 525 facilities in 32 countries:
  - Audits in 2022: 30.3% had 1–2, 46.2% had 3–5, 16.0% had 6–10, 5.2% had 11–15 and 2.3% had 16 or more.
  - Audit fees in 2022: 36% paid USD 2–5k, 30% USD 5–10k, 15% USD 10–20k and 7% over USD 20k.
  - Who pays: 68% paid the full audit fees and fewer than 1% had a buyer pay in full.
  - Duration: 56% of audits took 1–2 days, 31.5% 3–4 days and 12.5% five days or more.
  - 76% had at least one brand insisting on its own proprietary audit.
  - "All facilities absorb the labor expense to support and staff responses for each audit."

  — [WRAP: How Many Social Audits Are Enough? Oct 2023 (file)](https://wrapcompliance.org/wp-content/uploads/2023/10/How-Many-Social-Audits-Are-Enough-WRAP-Oct-2023.pdf)
- A 2018 SLCP estimate, cited by Asia Garment Hub: 92,084 audits a year in apparel and footwear, averaging 2.7 person-days at USD 500/day, for a total of USD 124.3M. — [Asia Garment Hub: Audit fatigue (snippet)](https://asiagarmenthub.net/resources/2024/audit-fatigue.pdf)
- Bangladeshi exporters say the same auditors collect duplicate information for different buyers. Babylon Group's audits fell from about 12 a year to 7–8 after it joined Better Work Bangladesh. BGMEA is exploring a unified code of conduct. — [Financial Express BD (snippet)](https://thefinancialexpress.com.bd/trade/bangladeshi-rmg-factories-reap-benefits-from-bwb-programme); [Alchempro: How Bangladesh plans to tackle audit fatigue (snippet)](https://www.alchempro.com/news/textile-news/how-bangladesh-plans-to-tackle-the-issue-of-audit-fatigue--305940-newsdetails.htm)
- A Daily Star op-ed on a study of 10 Bangladeshi factories reports audit fatigue from multiple, parallel audits, and some concealment of non-conformities. — [The Daily Star (snippet)](https://www.thedailystar.net/opinion/views/news/proper-audits-can-ensure-social-compliance-the-rmg-industry-3786246)
- Better Buying 2025, as cited by Cascale: 67.9% of suppliers reported savings of USD 5,000 or more from a common framework such as SLCP. — [Cascale blog (snippet; fetch 403)](https://cascale.org/resources/blogs/supply-chain-accountability-is-rising-its-still-costing-the-industry-without-this-one-shift/)
- Suppliers are "inundated with overlapping and inconsistent data requests from multiple customers at once" going into 2026. — [ESG News (snippet)](https://esgnews.com/?p=41809)
- Buyer counts (Mapped in Bangladesh / CPD): 3,600 brands, buyers and retailers sourced from 3,211 export factories over four years. More than 1,300 brands used a single factory, while 175 buyers used 5–49 factories each. — [Alchempro: Bangla apparel relies on too few buyers (snippet)](https://www.alchempro.com/news/apparel-news/bangla-apparel-sector-relies-on-too-few-buyers-study-272126-newsdetails.htm)
- Frequency and time: FSLM every 12 months and 4–6 weeks to complete. — [Cascale How to Higg (snippet)](https://howtohigg.cascale.org/higg-index-tools/higg-fslm/getting-started/prepare-for-the-fslm); [Worldly FSLM CAF FAQ (snippet)](https://support.worldly.io/hc/en-us/articles/34512746940955-FSLM-CAF-Frequently-Asked-Questions-FAQ). Supplier to Zero is annual, covering 12 months of evidence, with InCheck monthly or every 3 months and ClearStream 1–2 times a year. — [ZDHC S2Z manual (file)](https://downloads.roadmaptozero.com/Supplier-to-Zero-V2-Manual). WRAP requires internal monitoring every 6 months and fire drills every 6 months. — [WRAP PASA (file)](https://wrapcompliance.org/wp-content/uploads/2026/04/WRAP-Condensed-PASA-April-17-2026-FINAL.pdf). amfori full audits run every 2 years. — [SGS (snippet)](https://www.sgs.com/services/amfori-bsci)
- The Worldly Assistant is pitched as helping facilities "finish assessments faster", which suggests completion time is a recognised pain point. No figure is given. — [Worldly AI guidance article](https://worldly.io/zh/资源/strengthening-brand-supplier-collaboration-with-smarter-ai-guidance-and-faster-global-platform-performance)

### Inferences
- A typical mid-size Bangladeshi exporter serving 3–5 EU/US buyers probably maintains at least one SLCP/FSLM, one Higg FEM, one or two of amfori / Sedex / WRAP, ZDHC (if wet processing) and RSC. On top of that come brand codes and the new VSME and FLR requests. That is easily 5–8 formats a year asking for the same core facts: licences, headcount, wages, hours, fire safety, energy and wastewater.
- The overlap is the opportunity. Answer the same evidence once, in canonical form, and reuse it across formats.

### Gaps
- No source gives an independent average number of distinct buyer questionnaire formats per Bangladeshi factory.
- No hour-level time burden was found for Higg FEM, the Sedex SAQ or the amfori SAQ.
- The ITC report PDF itself was not read; its figures come via press coverage.
- The SLCP 2018 cost estimate is secondary (via Asia Garment Hub).

## 4. Which answers can come from documents a factory already holds, and which need new measurement

### Takeaway
A large share of the questions are facts already stated in documents the factory holds:
- licences and permits (trade licence, DIFE factory licence, Fire licence, DoE Environmental Clearance Certificate, boiler certificate, building approvals);
- headcount, payroll and attendance;
- policies (code of conduct, grievance, anti-harassment);
- fire-drill logs and photos;
- RSC CAP status;
- ClearStream wastewater reports and InCheck / chemical inventories;
- utility bills (energy in MWh);
- existing audit reports and certificates.

Answers that need new measurement or calculation: GHG Scope 1/2 calculations, airborne-exposure monitoring, quarterly wastewater lab tests (ZDHC-approved lab), turnover rates, living-wage gaps, worker-interview evidence, and anything that requires judgement ("is X in line with legal requirements?").

### Cited Findings
- Bangladeshi RMG licences and permits:
  - DIFE factory licence (Bangladesh Labour Act 2006);
  - Fire licence and fire-safety plan (Fire Service Act 1980), plus a special permit for multi-storey buildings;
  - DoE Environmental Clearance Certificate (Environment Conservation Act 1995, Green/Orange/Red categories, IEE/EIA);
  - boiler permission and annual boiler inspection;
  - electricity certificate;
  - trade licence, VAT BIN, building and occupancy approvals, EPB registration, BGMEA/BKMEA membership and bond licence.

  — [CPD: Setting up a Factory in Bangladesh (snippet)](https://cpd.org.bd/resources/2022/09/Setting-up-a-Factory-in-Bangladesh-Institutional-Operational-and-Legal-Requirements.pdf); [Legalseba DIFE guide (snippet)](https://legalseba.com/bd-services/?p=2214); [ILO document (snippet)](https://www.ilo.org/media/380601/download)
- The ILO suggests keeping a list of all licences with their renewal dates. — [ILO (snippet)](https://www.ilo.org/media/380601/download)
- WRAP PASA document-backed fields:
  - business licence and permits ("expired licenses or permits are treated as noncompliance");
  - main buyers and audits in the last 12 months;
  - headcount by gender, young workers, migrants and agency workers;
  - working days, shifts and breaks;
  - lowest wage paid;
  - wage and attendance records;
  - fire-drill dates with time-stamped photos;
  - CCTV retention.

  — [WRAP PASA (file)](https://wrapcompliance.org/wp-content/uploads/2026/04/WRAP-Condensed-PASA-April-17-2026-FINAL.pdf)
- SLCP examples that come straight from documents: facility name "as per business license", OS Hub ID, payroll-record questions. Examples that need assessment or measurement: airborne-particulate exposure "in line with legal requirements". Of the 2,109 question rows, 1,143 are boolean, 604 pick-list and about 244 numeric, percentage or date. — [SLCP flat file (file)](https://slcp.zendesk.com/hc/article_attachments/25627363522460)
- Higg FEM: an automatic 0% score without a valid business licence or permits; EAC/PPA renewable-energy evidence; ZDHC-aligned wastewater testing, including TSS for microfibers; a Chemical Inventory List. — [Worldly FEM 2025 updates](https://support.worldly.io/hc/en-us/articles/41919624428187-FEM-2025-Summary-of-Updates-to-the-Higg-FEM-4-0)
- ZDHC: InCheck reports (based on a complete chemical inventory), ClearStream reports, quarterly wastewater testing and a valid operating licence. For third-party assessment, evidence must be valid for the 12-month period for every "meets". — [ZDHC S2Z manual (file)](https://downloads.roadmaptozero.com/Supplier-to-Zero-V2-Manual)
- VSME B3 requires energy in MWh split renewable / non-renewable (from bills), plus computed Scope 1, location-based Scope 2 and intensity per turnover. — [Coolset (snippet)](https://www.coolset.com/academy/the-vsme-standard-understanding-the-basic-module); [Green Calculus (snippet)](https://greencalculus.com/calculators/vsme-calculator/)
- FLR evidence: certificates of origin, POs and invoices, capacity reports, worker lists, social audits, policies and grievance records are mostly existing documents. Interview transcripts and geolocation may be new. — [Covington](https://www.cov.com/en/news-and-insights/insights/2026/07/european-commission-publishes-forced-labour-regulation-guidelines-key-takeaways-for-companies)
- RSC CAP status and inspection reports already exist per factory. — [International Accord (snippet)](https://internationalaccord.org/bangladesh-factories)

### Inferences
Answer classes for Bunon:

| Class | What it is | Examples | How Bunon handles it |
|---|---|---|---|
| A, document fact | Directly extractable from a document | licence number and expiry, permit list, headcount, ClearStream date and pass/fail, energy MWh from bills | Auto-fill with a citation |
| B, derived | Calculated from document data | Scope 1/2 from fuel and electricity using a cited emission factor; turnover %; wage vs. legal minimum | Auto-fill and show the calculation |
| C, policy existence | Yes/No backed by a policy file | "Does the facility have a grievance policy?" | Auto-fill Yes with a citation; a reviewer confirms the policy is implemented |
| D, judgement or measurement | Needs on-site measurement, interviews or legal interpretation | exposure monitoring, "in line with legal requirements", worker-interview findings | Never auto-fill; route to a person |

- A Bunon-verified certificate (already hashed in the ledger) can act as a strong evidence node for class A answers. Expiry dates checked against the question's period, such as WRAP's "expired permit = noncompliance" or ZDHC's "valid for the assessment period", give a deterministic validity check that needs no model.

### Gaps
- I found no official, current Bangladesh government checklist of RMG licences; the CPD 2022 study is the most thorough source.
- I found no published estimate of what share of SLCP or Higg questions can be answered from documents. The A/B/C/D split above is my inference.

## 5. AI approaches and existing tools

### Takeaway
Tools from general security questionnaires and RFPs (Vanta, Loopio, Responsive, Conveyor and others) already follow the pattern Bunon needs: index a knowledge base, retrieve, draft an answer with citations, and have a person approve it. Garment-sector tools are adjacent but do not do this: Worldly Assistant (guidance only), TrusTrace (AI-OCR on certificates, free for suppliers), EcoVadis (AI that verifies submitted documents), Inspectorio (maps Higg results to codes) and Ditchcarbon (CDP/EcoVadis autofill). None was found that autofills SLCP, Higg or WRAP answers from a factory's own verified documents, with a tamper-evident evidence trail, in Bangla. Bangla is a real gap: SLCP has no Bangla translation and requires English answers. Technical-domain Bangla–English machine translation also lacks benchmarks.

### Cited Findings
- **Vanta Questionnaire Automation:** resources are "extracted and indexed". When no exact match exists, Vanta AI "generates well-cited responses for you to review and approve". Past questionnaires can be imported into an answer library. A browser extension works inside customer portals, unclear questions can be tagged to subject experts, and a person approves before anything is returned. A Trust Center chat answers from published resources. — [Vanta product page (snippet)](https://www.vanta.com/products/questionnaire-automation); [Vanta implementation guide (snippet)](https://help.vanta.com/en/articles/11488356-vanta-questionnaire-automation-implementation-guide); [Vanta Trust Center + AI (snippet)](https://www.vanta.com/resources/vanta-trust-center-enhanced-questionnaire-automation-ai)
- **Library-based tools** (Loopio, Responsive) depend on manually curated Q&A pairs that need upkeep. **AI-native tools** advertise per-answer confidence scores ("how closely an answer is grounded in verified source content") and links to the source document. These are vendor claims (Tribble pages); Conveyor claims 95%+ accuracy. No independent accuracy evaluation was found. — [Orbiq: security questionnaire automation (snippet)](https://www.orbiqhq.com/compliance-automation/security-questionnaire-response-automation.md); [Conveyor vs Vanta (snippet)](https://conveyor.com/compare/conveyor-vs-vanta)
- **Worldly Assistant:** an AI assistant inside Higg assessments, trained on Cascale's Higg guidance. It gives "real-time, contextual answers" to help facilities understand requirements and to cut back-and-forth with verifiers. The article does not say it fills or submits answers, or cites the factory's own documents. — [Worldly article](https://worldly.io/zh/资源/strengthening-brand-supplier-collaboration-with-smarter-ai-guidance-and-faster-global-platform-performance)
- **TrusTrace:** free for suppliers; certificate details are uploaded "automatically using AI-OCR"; drag-and-drop upload of up to 1,000 documents at once with automatic translation into English. — [TrusTrace supplier benefits (snippet)](https://trustrace.com/platform/benefits-suppliers); [TrusTrace supplier data management (snippet)](https://trustrace.com/products/supplier-data-management)
- **EcoVadis:** AI reviews and verifies documents suppliers submit, giving an evidence-backed risk score. DocScan looks for public documents on supplier websites. EcoVadis says 42% of companies rely on unverified supplier questionnaires. Its Chief Rating Officer is quoted that suppliers "either don't have that data or can't report it in a form the tools can use". — [EcoVadis Vitals (snippet)](https://ecovadis.com/solutions/iq/vitals/); [Supply Chain Digital (snippet)](https://supplychaindigital.com/news/ecovadis-lack-of-esg-supply-chain-strategy-in-80-of-firms)
- **Inspectorio** maps Higg Index results to a customer's code of conduct. **Ditchcarbon "survey responder"** auto-completes CDP, EcoVadis and custom ESG questionnaires from existing data. — [SoftwareOne listing (snippet)](https://platform.softwareone.com/product/responsible-sourcing-compliance/PCP-8523-3304); [Ditchcarbon survey responder (snippet)](https://ditchcarbon.com/survey-responder)
- **Cross-scheme convergence:**
  - Cascale's 2026 legislation mapping warns that without technical interoperability, manufacturers face duplicate reporting. — [Cascale (snippet)](https://cascale.org/resources/blogs/supply-chain-accountability-is-rising-its-still-costing-the-industry-without-this-one-shift/)
  - Efforts under way include UNECE core sustainability metrics, the Apparel Alliance Supply Chain Taxonomy, and an Italian luxury tool tested with 74 suppliers. — [IADS / Vogue Business (snippet)](https://www.iads.org/articles-reports/confused-by-supply-chain-reporting-rules-you-re-not-the-only-one); [green.earth (snippet)](https://www.green.earth/news/luxury-giants-unite-to-streamline-esg-data-across-europes-fashion-supply-chain)
  - SLCP keys persist across versions when a question's intent is unchanged. — [SLCP flat file (file)](https://slcp.zendesk.com/hc/article_attachments/25627363522460)
- **Bangla:**
  - SLCP translations exist for zh/tr/vi/es/it but not Bangla, and answers must be in English. — [SLCP article](https://slcp.zendesk.com/hc/en-us/articles/6808698730780)
  - WRAP PASA Q22–24 ask which languages workers, supervisors and management speak, so language is itself a compliance data point. — [WRAP PASA (file)](https://wrapcompliance.org/wp-content/uploads/2026/04/WRAP-Condensed-PASA-April-17-2026-FINAL.pdf)
  - BanglaSTEM (arXiv Nov 2025; ACL 2026 SRW) reports no published technical-domain Bangla–English MT work or benchmark for 2019–2025. It builds 5,000 sentence pairs and proposes a term-weighted BLEU because standard metrics treat terminology errors like common-word errors. — [BanglaSTEM arXiv](https://arxiv.org/abs/2511.03498v1); [ACL Anthology entry (snippet)](https://preview.aclanthology.org/ingest-acl/2026.acl-srw.34/)

### Inferences
Recommended design for Bunon: one flow, building on what exists today.

1. **Question bank.** Import the SLCP v1.7.1 flat file and the WRAP PASA as a `questions` table with key, section, text, data type, option list and step. Optionally add the VSME B3/B8–B10 datapoints.
2. **Crosswalk / knowledge graph.** Link question → canonical datapoint → evidence-document type, e.g. `WRAP Q13` / `SLCP FP-BAS-*` / `Higg FEM Permits` → `datapoint:business_licence{number, expiry}` → `doc:trade_licence.pdf`. Start with about 30 high-overlap datapoints: licences, headcount by gender, wages, hours, fire drills, energy MWh, wastewater test date and result, chemical inventory, policies, RSC CAP %. Even a small graph answers dozens of questions per scheme.
3. **Retrieval-augmented answering with a local model.** Use the existing Ollama setup. Retrieve only from Bunon-verified documents. The model must return {answer, cited doc ID + page/field, quote span, confidence}. Hard rules: no citation, no answer; expired document means flag; class D questions always go to a person.
4. **Confidence tiers.**
   - Green: deterministic field match from a verified certificate.
   - Amber: model-extracted value with a quote, needs one-click confirmation.
   - Red: no evidence, measurement needed, or a legal-judgement question.

   Each accepted answer is appended to the hash-chained ledger: question key, answer, evidence hash, reviewer. A buyer can then confirm that a given answer was grounded in a specific, unmodified document. This tamper-evident evidence trail is something none of the surveyed tools offer.
5. **Bangla.**
   - Show each question in Bangla next to the original English, with an English source-of-truth flag, as SLCP's rule requires.
   - Let factory staff confirm answers in Bangla.
   - Always submit in English.
   - Keep a glossary of compliance terms (e.g. "Corrective Action Plan", "EAC", "ClearStream") so the model does not paraphrase terms of art.
   - BanglaSTEM's point about terminology errors supports glossary-locked translation over free MT.
6. **Demo script.**
   - Upload trade licence, fire licence, DIFE licence, a ClearStream report, an electricity bill and a payroll summary (verified by Bunon).
   - Pick "WRAP Condensed PASA (April 2026)".
   - About 15–20 of the 52 questions auto-fill with citations in English and Bangla.
   - Red items list what is missing ("Fire drill dates: no evidence uploaded").
   - Show the same evidence answering the matching SLCP Step 1 questions, to demonstrate convergence.

Positioning against existing tools:
- Vanta, Conveyor and Loopio target SaaS security questionnaires, not SLCP, Higg or WRAP.
- Worldly gives guidance but does not fill answers.
- TrusTrace and EcoVadis extract and verify documents for brands but do not answer factory questionnaires.

Bunon's niche: a factory-side, on-prem or local model, Bangla-first, with answers backed by ledger-anchored evidence.

### Gaps
- No independent benchmark of questionnaire-autofill accuracy (Vanta, Conveyor, Tribble) was found; all accuracy figures are vendor claims.
- No garment-specific tool was found that autofills SLCP, Higg or WRAP from factory documents. Absence of evidence is not proof none exists; vendors such as Segura, Retraced, Sourcemap and Carbonfact were not checked individually.
- Bangla LLM quality for compliance terms is not measured anywhere I found, and local Ollama-class models were not evaluated.
- Whether Accredited Hosts or Worldly allow programmatic or Excel import of AI-prefilled answers beyond the offline Excel upload was not confirmed for SLCP. The SLCP article says the offline Excel route exists; Worldly documents an offline FSLM Excel import.
