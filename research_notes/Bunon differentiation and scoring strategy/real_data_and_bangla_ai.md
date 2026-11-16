# Real Data, Bangla AI Building Blocks and Cheap Evaluation for Bunon (as of 2026-11-09)

All sources were accessed on 2026-11-09 unless noted. "Fetch status" records what happened when an automated fetcher hit the page that day. A 403 or TLS error is a practical sign that automated access is unwelcome or fragile. It is not a legal finding.

## Q1. Certificate and facility registries: what a lookup returns, whether automation is allowed, limits, and a sample query

### Takeaway
Open Supply Hub (OS Hub) is the only registry here with a documented API and an explicit open-data licence: facility data is CC BY-SA 4.0, a free account can search and download through the website, and the API is paid. It also carries a BGMEA member-factory integration announced in May 2026. That makes it the strongest legal source of "real, not simulated" Bangladeshi factory data. Certificate registries (OEKO-TEX Label Check, GOTS, Textile Exchange) are public web lookups with no published automation terms; Textile Exchange's lookup returned 403 to a fetcher. Each brand states its database is not definitive proof on its own. Use deep-link, human-in-the-loop lookups and bulk-imported public lists (the Textile Exchange banned log, an OS Hub CSV) rather than scraping.

### Cited Findings

**Open Supply Hub (formerly Open Apparel Registry)**
- Website Terms of Service: Facility Information is licensed under Creative Commons Attribution-ShareAlike 4.0 (§1.3 and §2.2). §4.1(b) requires attribution "to OS Hub or the contributor thereof". §4.2(a) forbids using the Services "to develop any registry or other service that is competitive with the Services". **Flag:** §4.2(d) requires OS Hub's prior written consent to "combine or integrate the Services or OS Hub Materials with any software". The terms do not mention scraping, bots or rate limits, and the page shows no last-updated date. — [OS Hub Terms of Service](https://info.opensupplyhub.org/terms-of-service)
- Free website use: "It's completely free to upload, search, or download data from OS Hub", and "Every facility listed in OS Hub has an OS ID… Anyone can access and make use of these IDs, for free" (search-result excerpts from OS Hub pages). — [OS Hub FAQs](https://info.opensupplyhub.org/faqs); [OS Hub ID](https://info.opensupplyhub.org/os-hub-id)
- Download limits (sources conflict): one OS Hub page excerpt says "All Open Supply Hub account holders are able to download up to 5,000 production locations at no cost", with additional downloads sold in blocks of 10,000. — [OS Hub Terms of Service (search excerpt)](https://info.opensupplyhub.org/terms-of-service). The older August 2024 blog instead says to contact the team for a custom download only when "your search is resulting in more than 10,000 facilities". — [OS Hub blog, Aug 2024](https://blog.opensupplyhub.org/2024/08/07/using-open-supply-chain-data-to-collaborate-on-responses-to-unrest-in-bangladesh/)
- Bangladesh search recipe from OS Hub's own guide: Country = Bangladesh, Sector = "Apparel, Footwear, and Textiles". You can also filter by data contributor. — [OS Hub blog, Aug 2024](https://blog.opensupplyhub.org/2024/08/07/using-open-supply-chain-data-to-collaborate-on-responses-to-unrest-in-bangladesh/)
- API pricing has no free tier. API 2,500 calls/yr costs $2,700/yr ($225/mo), and API 5,000 costs $5,100/yr; 25k and 50k tiers exist. "Downloading facilities = 1 call for up to 50 facilities at a time". A 14-day trial gives staging access only, and staging "uses test data only and should not be used for any real-world application". No rate limits are stated, only annual call quotas. — [Connect to OS Hub's API](https://info.opensupplyhub.org/api)
- API Terms of Service require an account (§4.3(a)). They require attribution to OS Hub, a link to the site, and an OS ID kept "prominently visible" (§4.4). They forbid resale or sharing with data brokers (§4.6(a)) and forbid competing services during the term plus 12 months (§4.6(b)). Uptime target is 99.0% (§5.1). No last-updated date is shown. — [OS Hub API Terms of Service](https://info.opensupplyhub.org/resources/api-terms-of-service)
- Endpoints: production base URL `https://opensupplyhub.org/api/`, staging `https://staging.opensupplyhub.org/api/`. The Quick Start sample query is `GET /api/v1/production-locations/?os_id=IN2021079TDH72D`. The token goes in every request header; the exact header format is not shown in the Quick Start. Response fields: `count`, `data[]` with `os_id`, `name`, `local_name`, `address`, `country{alpha_2,alpha_3,name,numeric}`, `coordinates{lat,lng}`, `sector`, `product_type`, `processing_type`, `parent_company`, `claim_status`, `claimed_at`, `number_of_workers{min,max}`, `percent_female_workers`, `affiliations`, `minimum_order_quantity`, `average_lead_time`, `geocoded_address`, `geocoded_location_type`, `description`. Full references are the legacy docs at https://opensupplyhub.org/api/docs/ and the beta docs at https://opensupplyhub.github.io/open-supply-hub-api-docs/. — [OS Hub API examples: Quick Start](https://raw.githubusercontent.com/opensupplyhub/open-supply-hub-api-examples/main/how_to/1_quick_start_guide.md); [API examples repo](https://github.com/opensupplyhub/open-supply-hub-api-examples)
- The Python client `pyoshub` is MIT-licensed and still pre-1.0 ("in constant development until… release version 1.x"). Pull-only access is for users who only extract data; push-pull access needs an annual subscription plus an onboarding fee. — [pyoshub on GitHub](https://github.com/opensupplyhub/pyoshub)
- Bangladesh coverage: BGMEA signed an MoU with OS Hub, announced 10 May 2026. Under it, "information and locations of BGMEA member factories will be integrated into Open Supply Hub", and each factory receives a Universal OS ID. — [BGMEA news, 10 May 2026](https://bgmea.com.bd/page/BGMEA_Partners_with_Open_Supply_Hub_to_Enhance_Transparency_of_Bangladesh%E2%80%99s_Apparel_Industry); [TBS News](https://www.tbsnews.net/bangladesh/bgmea-os-hub-sign-mou-1436151). Under a separate BKMEA agreement, each member factory gets an OS ID and can manage its own data. — [Just Style](https://www.just-style.com/news/bkmea-open-supply-hub/)

**OEKO-TEX Label Check / API / CertLink**
- Label Check is free and needs no registration: enter the certificate number and press "check". The result is valid, expired or withdrawn. The number is printed on the label; MADE IN GREEN labels use a product ID or QR code instead. — [Hohenstein guide: How to read OEKO-TEX certificates](https://hohenstein.com/fileadmin/user_upload/Downloads/Tools_and_Guides/OEKO-TEX_Guide_How_to_Read_OEKO-TEX_Certificates_and_Check_Their_Validity.pdf)
- Deep-link URL pattern seen in search results: `https://www.oeko-tex.com/v/<certificate-number>`, for example `https://www.oeko-tex.com/v/23.HTR.39050` and `https://www.oeko-tex.com/v/18.HPK.48415`. The certificate number embeds the testing-institute code (HTR, HPK, …). — [OEKO-TEX Label Check example](https://www.oeko-tex.com/v/23.HTR.39050). These pages were not fetched, so the response layout is unverified.
- An OEKO-TEX API exists for companies to integrate certificate validation "into online portals, cloud applications or databases". It returns validity, issue date, expiry date and product class for STANDARD 100 certificates. CertLink is a separate Texbase-powered platform for linking item numbers to certificates. It requires an OEKO-TEX customer number plus a valid certificate number, so it is meant for certificate holders and retailers, not anonymous users. — [Hohenstein CertLink infosheet](https://www.hohenstein.de/fileadmin/user_upload/Downloads/Factsheets/Infosheet_OEKO-TEX_CertLink_EN.pdf)
- The OEKO-TEX Terms of Use (in force 1 September 2026) govern OEKO-TEX's relationship with its customers. They do not mention automated access, scraping or bots. §14.3: the Label Check "can contain certain certificate data". §14.4: company name and address appear in a searchable reference list only while the certificate is valid. — [OEKO-TEX Terms of Use](https://www.oeko-tex.com/ToU)

**GOTS (Global Organic Textile Standard) certified-supplier database**
- GOTS's disclaimer: database entries "cannot be used as a definitive verification of the valid certified status of a company and its products". Buyers should also obtain a Transaction Certificate (TC) per shipment, and can check the Scope Certificate (SC) copy linked to the database entry and then confirm with the issuing certification body. Not all products of a certified entity are necessarily GOTS-certified. — [GOTS Q&A](https://global-standard.org/q-and-a)
- Fetch status: `global-standard.org/find-suppliers-shops-and-inputs/certified-suppliers` returned **301 to `https://global-standards.org/suppliers/certified-suppliers`**, a new domain with a trailing "s". The new page says "Certification Bodies (CBs) are still in the process of updating their data in our new repository. If you are missing information, please refer directly to your CB." It lists no search fields, export or terms in machine-readable text. — [GOTS certified suppliers (new)](https://global-standards.org/suppliers/certified-suppliers)
- Old entry URL format: `https://global-standard.org/find-suppliers-shops-and-inputs/certified-suppliers/database/search_result/26288`. — [GOTS search result example](https://global-standard.org/find-suppliers-shops-and-inputs/certified-suppliers/database/search_result/26288)
- The database covers certified entities along the supply chain, with location, fields of operation and product categories, and approved CBs update the entries. — [GOTS find suppliers](https://global-standard.org/find-suppliers-shops-and-inputs)
- The TC issuance procedure (template v4.0) is public. A TC may only be issued to a seller holding a valid SC for the product, and not when that SC is suspended or withdrawn. — [GOTS TC procedure v4.0](https://global-standard.org/images/resource-library/documents/certificate-policies-and-templates/Procedure%20%20Template%20For%20Issuance%20Of%20Transaction%20Certificates%20-%20GOTS%20Version%204.0.signed.pdf)

**Textile Exchange (RCS/GRS/OCS/RWS…)**
- "Find a Certified Company" is built from active CBs' latest data and is described as a "single source of truth for all scope certificates". It also lets certified organisations authenticate the TCs they receive. If a company or SC is missing, lodge an enquiry with your CB. A maintenance notice dated November 2025 was noted. **Fetch status: HTTP 403** to the automated fetcher, so treat it as human-only lookup. — [Textile Exchange: Find a Certified Company](https://www.textileexchange.org/find-certified-company)
- A Textile Exchange ID (TE-ID) is a facility identifier and "does not indicate certification status". The TE-ID list does not show linked SCs. — [Textile Exchange ID](https://textileexchange.org/?p=50125)
- A third-party blog claims GRS can be checked at `certification.textileexchange.org` by company name or certificate number. **This is unverified against an official source.** — [Traceforgood blog](https://www.traceforgood.com/blog/mastering-certificates-management)
- Banned list: entities previously in ASR-225 and ASR-226 are now in a single **TE-TXL-LOG-225 Banned Entities Log**. The latest version found is **V2026.5, published 1 June 2026**. Expired bans stay listed "so that they may be factored into risk assessments". Some bans cover only the listed address; others extend "to all of [the entity's] subsidiaries at other addresses and/or in other countries". Lifting a ban requires the organisation to contact Textile Exchange. These are public PDFs that can be imported as a table. — [ASR-225 V2.0 Certification Eligibility Policy (Nov 2025)](https://textileexchange.org/app/uploads/2025/11/ASR-225-V2.0-Certification-Eligibility-Policy.pdf); [ASR-225 V2025.1](https://textileexchange.org/app/uploads/2024/12/ASR-225-V2025.1-Certification-Eligibility-Policy-and-List-of-Banned-Entities.pdf)

**bluesign**
- The bluesign FINDER is a public web search of bluesign APPROVED **chemical products** (a positive list), registered by System Partner chemical suppliers and verified by bluesign experts. Counts: more than 12,000 products (2020) and more than 20,000 (2022). It is not a facility or certificate registry, and no API or automation terms were found. — [bluesign FAQ](https://www.bluesign.com/en/faq); [Just Style](https://www.just-style.com/news/bluesign-finder-upgrade-to-define-green-attributes-in-chemicals/); [Ecotextile (sponsored)](https://www.ecotextile.com/sponsored-content/bluesign-finder-easy-entry-to-chemical-management.html)

**ZDHC Gateway**
- The Chemical Module lets suppliers and brands with Gateway accounts search public chemical product information, safety data sheets (SDS), certifications and the MRSL conformance level. Levels run from 0 (self-declaration, valid 2 years) to 3 (chemical supplier site visit). Organisations have public profile pages. ChemCheck reports carry a fee in the annual product fee. A free, anonymous public search is **not confirmed**. — [ZDHC KB: Search FAQ](https://knowledge-base.roadmaptozero.com/hc/en-gb/articles/360009953438-Use-the-Search-function-Frequently-asked-questions); [ZDHC KB: public profile page](https://knowledge-base.roadmaptozero.com/hc/en-gb/articles/37952543865245-Understanding-an-organisation-s-public-profile-page); [ZDHC Gateway Chemical Module launch](https://roadmaptozero.com/post/zdhc-gateway-chemical-module-launch-june-1st)

**Mapped in Bangladesh (MiB)**
- MiB is coordinated by BRAC and implemented by the Centre for Entrepreneurship Development (CED) at BRAC University, funded by the Laudes Foundation and the Netherlands government. It held 3,723 export-oriented RMG (ready-made garment) factories as of mid-March 2022; about 3,630 were reported earlier. Fields include name, address, contacts, factory type, year established, products, worker counts by gender, brands served, memberships, inspection and certification status, and export countries. Data was viewable and sortable on the project website. **No bulk download or licence was found.** — [Dhaka Tribune](https://www.dhakatribune.com/amp/business/265715/bangladesh-lists-3-723-rmg-factories-on-mib); [Daily Star](https://online-d11.thedailystar.net/tech-startup/science-gadgets-and-tech/news/3600-garments-now-digitally-mapped-2961671); [Fibre2Fashion](https://www.fibre2fashion.com/news/apparel-news/over-3-600-rmg-factories-in-bangladesh-now-digitally-mapped-278976-newsdetails.htm)

**RSC (RMG Sustainability Council) Bangladesh**
- The factory list at `rsc-bd.org/en/factories` shows remediation progress for covered factories. Filters include remediation status and training status. Separate lists cover independent factories listed by BGMEA/BKMEA, ineligible suppliers (made ineligible for business with signatories for failing to implement safety measures), and factories handed over to the Government of Bangladesh. Monthly reports define finding statuses ("In progress", "Pending verification"); the latest found is October 2025. **Fetch status: TLS error ("unable to verify the first certificate")**, so automated access is fragile. No terms were found. — [RSC factory list](https://rsc-bd.org/en/factories); [RSC Monthly Report Oct 2025](https://rsc-bd.org/wp-content/uploads/2025/12/10.-Monthly-Report-October-2025.pdf)
- The International Accord hosts a Bangladesh factory search showing CAP (corrective action plan) status, factory status and training status. Some entries look like older snapshots. — [International Accord: Bangladesh factories](https://internationalaccord.org/bangladesh-factories)

**BGMEA member directory**
- The BGMEA site navigation has "Search a Member", "General Member List" and "Associate Member List". An online Membership Management System (bgmeamember.com) launched in March 2022 and lets members update details and generate e-certificates. Fields and terms were not verified. — [BGMEA MMS launch](https://www.bgmea.com.bd/page/BGMEA_launches_Membership_Management_System_to_provide_faster_and_simpler_services); [TBS News](https://www.tbsnews.net/economy/rmg/bgmea-launches-membership-management-system-provide-faster-and-simpler-services-378958)

### Inferences
- **Legal "real data" path for the demo:** with a free OS Hub account, download Bangladesh apparel facilities (up to the free cap, 5,000 or 10,000 depending on which source is current) as a CSV. Import them into Postgres with `os_id` as the key, show the OS ID and an "Open Supply Hub, CC BY-SA 4.0" attribution next to every record, and link each row to `https://opensupplyhub.org/facilities/<os_id>`. This avoids paid API calls and scraping. The §4.2(d) "integrate with any software" clause is ambiguous for API or live integration, so do not call the live API without a trial or written OK. A local copy of CC BY-SA data with attribution is the safer reading.
- **Certificate checks:** build a "Verify on registry" button that opens `https://www.oeko-tex.com/v/<number>` (OEKO-TEX) or the GOTS or Textile Exchange search in a new tab. Record the human-confirmed result (valid/expired/withdrawn, date checked, who checked) in the hash-chained ledger. That makes the result real without automated queries to sites with no published automation terms.
- **Bulk-importable lists that are real and public:** the Textile Exchange banned-entities log (a PDF table), RSC monthly report PDFs, and the OS Hub CSV. The GOTS approved certification-body list is another candidate, but its page was not fetched here. These support a "banned entity" or "known facility" match without live scraping.
- The OEKO-TEX number prefix (for example "23.HTR.39050") can be parsed offline to validate format and the institute code before any lookup, as a cheap pre-filter rule.

### Gaps
- OEKO-TEX API endpoints, authentication and eligibility are not public, so automation terms for the Label Check are unknown. **Treat it as manual-only.** The Label Check page response was not fetched.
- GOTS: the new global-standards.org repository's search fields, export function and terms of use could not be read, because the page text exposed no form fields. The CBs' data migration is ongoing.
- Textile Exchange: whether search by certificate number is supported officially was not confirmed (403), and terms of use were not found.
- Mapped in Bangladesh: the current site URL, data licence, whether the data still exists after 2022, and whether it was contributed to OS Hub were all unconfirmed.
- RSC, BGMEA, bluesign and ZDHC: no terms of use on automated access were found, and no rate limits are published for any registry except OS Hub's call quotas.
- The current count of Bangladeshi facilities in OS Hub was not found.

## Q2. Bangla on small local models, Bangla OCR, and a practical setup for a laptop already running Qwen3 4B in Ollama

### Takeaway
No published Bangla benchmark for Qwen3-4B, Qwen2.5-7B or Gemma-3-4B was found. Evidence from the TigerLLM paper shows general multilingual small models score poorly on Bangla knowledge tasks: Llama 3.2 11B scores 0.22 on MMLU-bn, while purpose-built TigerLLM 1B scores 0.61. TigerLLM-1B-it (now Gemma 3-based, CC BY 4.0 plus Gemma terms) is the best-documented small Bangla model. Tesseract `ben` (Apache-2.0) is the practical local OCR at about 11% character error rate (CER) on real-world images. Keep Qwen3 4B for English certificate extraction. Add Bangla only where it adds value (UI, explanations, Bangla documents), and test it on a small set.

### Cited Findings

**General multilingual models**
- Qwen3 supports 119 languages and dialects, including Bengali (up from 29 in Qwen2.5). It is Apache 2.0 and had day-one Ollama support. These claims come from secondary blogs and were not checked against the Qwen model card here. — [AsiaTechLens](https://asiatechlens.substack.com/p/alibabas-open-source-qwen-3-redefines); [Markaicode: Qwen3 multilingual Ollama](https://www.markaicode.com/qwen3-multilingual-ollama-setup-guide/)
- Gemma 3 has "pretrained support for over 140 languages", per Google. A comparison blog says 100+, so the counts conflict. Gemma 3 uses Google's custom Gemma licence. One blog says Gemma 4 (2 April 2026) moved to Apache 2.0 (unverified). — [Google Developers Blog](https://developers.googleblog.com/unlock-global-communication-gemma-projects/); [Codersera](https://codersera.com/blog/gemma-4-vs-qwen-3-5-comparison-2026/)
- A Bengali multitask text-classification preprint (April 2026, not peer-reviewed) found "Gemma-3-4B demonstrates the most stable and consistent performance" among the models tested. — [Preprints.org](https://www.preprints.org/frontend/manuscript/b87ef093c701dcddbbd1136188e5ca3d/download_pub)
- LilTii, a 0.6B Bengali model trained from scratch, reportedly "consistently outperforms" Qwen2.5-0.5B and Qwen3-0.6B on Bengali benchmarks. This is a vendor-authored blog. — [Hugging Face blog: LilTii](https://huggingface.co/blog/Polygl0t/liltii)
- No independent Qwen3 Bengali benchmark was found. A SiliconFlow "best LLM for Bengali 2026" guide ranks Qwen3-8B and Llama-3.1-8B but gives no numbers; it reads as marketing. — [SiliconFlow](https://www.siliconflow.com/articles/best-open-source-llm-for-bengali)

**Bangla-specific models**

TigerLLM paper (ACL 2025), Table 2 on the Bangla benchmarks, as reported on the model card:

| Model | MMLU-bn | PangBench-bn | BanglaQuaD | BEnQA |
|---|---|---|---|---|
| GPT-3.5 | 0.55 | 0.55 | 0.50 | 0.50 |
| GPT-4o-mini | 0.67 | 0.62 | 0.65 | 0.60 |
| LLaMA 3.2 11B | 0.22 | 0.19 | 0.21 | 0.18 |
| Gemma 2 27B | 0.35 | 0.51 | 0.43 | 0.50 |
| Titu-LLM | 0.06 | 0.19 | 0.08 | 0.17 |
| TigerLLM 1B (Llama 3.2, deprecated) | 0.61 | 0.55 | 0.68 | 0.59 |
| TigerLLM 9B-it (deprecated) | 0.72 | 0.68 | 0.70 | 0.65 |

These scores are self-reported by the authors. — [TigerLLM-1B-it model card](https://huggingface.co/md-nishat-008/TigerLLM-1B-it); [arXiv 2503.10995](https://arxiv.org/html/2503.10995v3)

- TigerLLM-1B-it (current) is based on Gemma 3 1B (`Gemma3ForCausalLM`), licensed CC BY 4.0 (also check the Gemma 3 terms), with 32,768-token context. It ships as BF16 safetensors of about 1.9 GiB, with community quantisations for llama.cpp, Ollama and LM Studio. The card reports it is "+2–4% vs. LLaMA-based 1B" and lists a TigerLLM-12B-it at "+5–10% vs. 9B". No absolute scores are given for the new 1B. — [TigerLLM-1B-it](https://huggingface.co/md-nishat-008/TigerLLM-1B-it)
- TituLLMs (Hishab, ACL Findings 2025) are Llama 3.2 1B and 3B models continually pretrained on about 37B Bangla tokens with an extended tokenizer, under a Llama 3.2-like licence. The model cards claim they beat base Llama-3.2-3B on BoolQ-BN, CommonsenseQA-BN, OpenBookQA-BN and PIQA-BN but are weaker in English. GGUF builds exist (`tensorblock/titulm-llama-3.2-3b-v1.1-GGUF`). **Conflict:** TigerLLM's table scores Titu-LLM at only 0.06 on MMLU-bn, likely because a base (non-instruct) model was evaluated. — [hishab/titulm-llama-3.2-3b-v1.1](https://huggingface.co/hishab/titulm-llama-3.2-3b-v1.1); [arXiv 2502.11187](https://web3.arxiv.org/abs/2502.11187); [TensorBlock GGUF](https://huggingface.co/tensorblock/titulm-llama-3.2-3b-v1.1-GGUF/tree/main)
- BanglaT5 NMT checkpoints (`csebuetnlp/banglat5_nmt_bn_en` and `_en_bn`, about 247M parameters) are licensed **CC BY-NC-SA 4.0, non-commercial research only**. **Flag** for any commercial pitch. They require the csebuetnlp normalizer before tokenisation. — [banglat5_nmt_bn_en](https://huggingface.co:443/csebuetnlp/banglat5_nmt_bn_en); [BanglaNLG GitHub](https://github.com/csebuetnlp/BanglaNLG)
- Community Bangla GGUFs exist that run on CPU via llama.cpp or Ollama (for example `KillerShoaib/llama-3-8b-bangla-GGUF-Q4_K_M` and `rickystanley76/ft-llama3.1-with-bangla-GGUF`). Their quality is unbenchmarked. — [KillerShoaib GGUF](https://huggingface.co/KillerShoaib/llama-3-8b-bangla-GGUF-Q4_K_M); [rickystanley76 GGUF](https://huggingface.co/rickystanley76/ft-llama3.1-with-bangla-GGUF)
- TigerCoder (a Bangla code model built on TigerLLM, LREC 2026) reports that most models drop 20–50% Pass@1 when prompted in Bangla rather than English. — [TigerCoder-9B](https://huggingface.co/md-nishat-008/TigerCoder-9B)

**Bangla OCR**
- Tesseract `tessdata_best` is Apache-2.0 ("All data in the repository are licensed under the Apache-2.0 License"), includes `ben.traineddata`, and works with the LSTM engine only. — [tesseract-ocr/tessdata_best](https://github.com/tesseract-ocr/tessdata_best)
- On 216 real-world Bengali images (BRAC University thesis), Tesseract scored CER 11.46% and word error rate (WER) 20.01%. EasyOCR scored CER 9.02% and WER 21.94%. A Tesseract, EasyOCR and Google Vision hybrid did best. — [BRAC University DSpace](https://dspace.bracu.ac.bd/bitstreams/ba79fe28-fbb3-41bb-8f7b-53990b1f892d/download)
- bbOCR, an open-source multi-domain Bengali document OCR pipeline, adopts Tesseract 5.0 as its base engine. — [arXiv 2308.10647](https://arxiv.org/pdf/2308.10647)
- PaddleOCR appears in Bengali work only for handwritten text in tables (91.37% vs a modified YOLOv8 at 92.72%). No head-to-head comparison with Tesseract on printed Bengali was found. — [arXiv 2402.05158 summary](https://fugumt.com/fugumt/paper_check/2402.05158v1_enmode)

### Inferences (recommended setup)
- **Keep Qwen3 4B as the extractor.** GOTS, OEKO-TEX and Textile Exchange certificates are English-language documents, so Bangla does not need to be on the extraction path. Bangla is better spent on supplier- and worker-facing output: a Bangla explanation of each conflict, Bangla questionnaire prompts, and Bangla OCR of local documents such as trade licences or BGMEA certificates.
- **Bangla generation:** pull TigerLLM-1B-it from a community GGUF (`ollama run hf.co/<user>/<repo>:Q4_K_M`) or run it via Transformers. Compare it with Qwen3 4B, and Gemma 3 4B if RAM allows, on 20 fixed Bangla prompts, such as "explain this conflict to a factory compliance officer". Have a Bangla speaker rate them on adequacy and fluency (1–5 each). This is cheap and credible.
- **UI strings:** use static, human-reviewed Bangla i18n JSON rather than live machine translation, so the demo never shows broken Bangla.
- **OCR:** run `tesseract input.png out -l ben+eng --oem 1` with `tessdata_best`, then send the text to the LLM. Tell judges the measured CER on a few of your own pages rather than quoting the thesis.
- **Licence hygiene:** prefer Apache-2.0 (Qwen3, Tesseract) or CC BY 4.0 (TigerLLM-1B-it, plus the Gemma terms). Avoid BanglaT5 for anything commercial.

### Gaps
- No published Bangla scores were found for Qwen3-4B, Qwen2.5-7B, Gemma-3-4B or Llama 3.x small instruct models on translation or generation (for example FLORES-200 bn).
- Whether an official TigerLLM-1B-it GGUF or Ollama library entry exists was not confirmed. BanglaBERT's licence was not found. BanglaLLaMA was not checked.
- No 2025–2026 Bengali benchmark of PaddleOCR (PP-OCRv5) against Tesseract was found.

## Q3. Small but real graph reasoning, and published fraud patterns that define detection rules

### Takeaway
Detection rules can be grounded directly in published policy and incidents. Five sources supply them:
- GOTS's "TC only if a valid SC covers the product" rule.
- GOTS's statement that a database listing is not definitive proof.
- Textile Exchange's statement that a TE-ID is not certification.
- Banned-entity scopes that extend to subsidiaries.
- The 2020 India fraud: forged TCs on government templates, with fake QR codes pointing to a cloned verification site.

A claim → certificate → facility → registry-status graph in Postgres, with about 8 rules derived from these sources, is small, explainable and defensible.

### Cited Findings
- **2020 India organic cotton fraud:** IOAS surveillance audits attended by GOTS experts found fake raw-cotton TCs made on APEDA templates, "with fake QR codes which led to a cloned APEDA website". GOTS had "assured knowledge of 20.000 metric tons fake material". Responses: certification bans on 11 companies, one certification-body contract terminated, upstream TCs cancelled, and GOTS itself to check all incoming organic-raw-material TCs for authenticity. — [textile-network.com, 2 Nov 2020](https://textile-network.com/en/Fasern-Garne/GOTS-findet-Beweise); [Just Style](https://www.just-style.com/news/fake-organic-cotton-found-by-gots-in-india/)
- Textile Exchange also banned the fraudulent companies for two years. It withdrew accreditation from Extensive Standard Technical Services (ESTS), and Control Union India's GOTS approval was suspended after IOAS findings. — [Apparel Resources](https://in.apparelresources.com/business-news/sustainability/no-evidence-fraud-since-uncovering-fraud-india-2020-gots); [OI Compass](https://www.oicompass.com/legal-and-institutional/fake-organic-cotton-detected-in-india/85303.article). A 2025 press-release-style article alleging bribery is uncorroborated; do not use it.
- A TC may only be issued to a seller with a valid SC for the product, and not if the SC is suspended or withdrawn. — [GOTS TC procedure v4.0](https://global-standard.org/images/resource-library/documents/certificate-policies-and-templates/Procedure%20%20Template%20For%20Issuance%20Of%20Transaction%20Certificates%20-%20GOTS%20Version%204.0.signed.pdf)
- A database entry is not definitive. Get a per-shipment TC, check the SC linked to the entry, and confirm with the CB. Not all products of a certified entity are certified. — [GOTS Q&A](https://global-standard.org/q-and-a)
- A TE-ID "does not indicate certification status". — [Textile Exchange ID](https://textileexchange.org/?p=50125)
- Bans can apply to a specific address or extend to subsidiaries at other addresses or in other countries. Expired bans are kept for risk assessment. — [ASR-225 V2025.1](https://textileexchange.org/app/uploads/2024/12/ASR-225-V2025.1-Certification-Eligibility-Policy-and-List-of-Banned-Entities.pdf)
- OEKO-TEX status is valid, expired or withdrawn, and MADE IN GREEN uses a product ID rather than a certificate number. — [Hohenstein guide](https://hohenstein.com/fileadmin/user_upload/Downloads/Tools_and_Guides/OEKO-TEX_Guide_How_to_Read_OEKO-TEX_Certificates_and_Check_Their_Validity.pdf)
- Red flags from low-authority supplier blogs (use only as supplementary rules): copied genuine certificates with names and addresses swapped, logos that differ from the official one, a certificate number with no matching database record, and quantity mismatches between purchase order (PO), invoice and TC. — [Fumao blog](https://fumaofabric.com/?p=14726); [GCA Poland: fraudulent GOTS certificate](https://gca.org.pl/en/fraudulent-gots-certificate-discovered/)
- GOTS security advice asks buyers to request the SC, the TC and a certifier release. — [GOTS security advice (retail)](https://gotslive.global-standard.org/images/resource-library/documents/security-advice-adverts/GOTS_SecAdvise_Retail_engl_210x99.pdf)

### Inferences (rule set for a small graph)
- **Nodes:** Claim (product, PO, quantity), Document (SC, TC, OEKO-TEX certificate, invoice), Certificate (number, standard, CB, scope, valid_from, valid_to), Facility (name variants, address, `os_id`), RegistryCheck (source, status, checked_at, checked_by, ledger hash), BannedEntity (name, address, scope_extends_to_subsidiaries).
- **Rules:**
  - (R1) TC date falls outside the SC validity window, or the SC status is suspended or withdrawn.
  - (R2) The SC's product scope or category does not cover the claimed product.
  - (R3) The same certificate number appears with two different holder names or addresses. Normalise names first: lowercase, strip "Ltd/Limited/Pvt", transliterate Bangla to Latin script, then use token-set similarity.
  - (R4) A QR or verification URL's domain is not on an allowlist of official registries. This rule comes from the cloned-APEDA-site case.
  - (R5) The facility name or address fuzzy-matches the Textile Exchange banned log. Apply subsidiary extension where the log says so.
  - (R6) TC quantity exceeds invoice or PO quantity (supplementary).
  - (R7) A TE-ID or OS ID is presented as if it proved certification.
  - (R8) The certificate number format or institute code is invalid for the standard.
- Store the graph as Postgres tables plus a recursive CTE or in-memory adjacency list. No graph database is needed for 20–40 documents. Every fired rule should cite its source (the GOTS TC procedure, ASR-225, and so on) in the UI, which makes the "graph reasoning" auditable.

### Gaps
- No official GOTS or Textile Exchange guidance enumerating machine-checkable fraud patterns was found. The rules above combine official policy with incident reports.
- APEDA TraceNet specifics and the detailed forgery forensics of the India case were not documented in the sources fetched (the Just Style article is paywalled).

## Q4. Evaluation: building a legal 20–40 document labelled test set, metrics, and fair comparison of rules vs local model vs cloud model

### Takeaway
Use strict field-level exact match (EM) per field as the headline metric, following SROIE (Scanned Receipts OCR and Information Extraction, ICDAR 2019) and DocParser, where one wrong character fails the field. Report micro-F1 over all fields. Apply documented normalisation (dates to ISO format, case and whitespace for names, numeric tolerance), as recent receipt and invoice benchmarks do. Build the set from synthetic certificates clearly watermarked "SYNTHETIC", modelled on public templates and guides, plus seeded conflicts. Run all three extractors on the identical set.

### Cited Findings
- Field-level F1 is strict: "the extraction has failed even if one single character is poorly predicted". Precision is exact matches over predicted fields; recall is exact matches over ground-truth fields. — [DocParser, arXiv 2304.12484](https://arxiv.org/pdf/2304.12484)
- SROIE has 4 key fields (company, date, address, total), with 626 training and 347 test receipts. That makes it a precedent for a small fixed field schema. — [DocParser, arXiv 2304.12484](https://arxiv.org/pdf/2304.12484)
- A 2026 receipt benchmark keeps exact match for strict-fidelity fields such as tax numbers. It uses normalised string equality, then a small-LLM semantic judge, for variable fields like seller names, and a numeric tolerance of 0.05. — [arXiv 2605.22413](https://arxiv.org/pdf/2605.22413)
- Invoice extraction work proposes field-level precision, consistency-check failures and exact-match accuracy. — [arXiv 2510.15727](https://arxiv.org/pdf/2510.15727). KIEval argues for group-level scoring, where related fields must be correct together. — [KIEval summary (secondary)](https://www.themoonlight.io/en/review/kieval-evaluation-metric-for-document-key-information-extraction)
- Other tooling uses Levenshtein similarity plus an LLM factuality scorer instead of exact match. — [Braintrust receipt extraction cookbook](https://braintrust.dev/docs/cookbook/recipes/ReceiptExtraction)
- Public templates and guides to model synthetic documents on: the GOTS TC issuance procedure and template v4.0, and the Hohenstein guide on reading OEKO-TEX certificates. — [GOTS TC procedure v4.0](https://global-standard.org/images/resource-library/documents/certificate-policies-and-templates/Procedure%20%20Template%20For%20Issuance%20Of%20Transaction%20Certificates%20-%20GOTS%20Version%204.0.signed.pdf); [Hohenstein guide](https://hohenstein.com/fileadmin/user_upload/Downloads/Tools_and_Guides/OEKO-TEX_Guide_How_to_Read_OEKO-TEX_Certificates_and_Check_Their_Validity.pdf)
- Do not reproduce brand logos. The OEKO-TEX brand and label are registered trademarks, and unauthorised use is forbidden. — [OEKO-TEX labelling guide: trademark property](https://www.oeko-tex.com/en/labelling-guide/trademark-property/)

### Inferences (protocol)
- **Test set (about 30 documents):** 20 synthetic SC, TC and OEKO-TEX-style certificates, generated from a JSON ground truth so the labels are exact by construction. Vary the layout, include scan noise via rasterisation, and include 3–5 Bangla-language or mixed documents. Add 10 seeded-conflict cases: expired, scope mismatch, reused number with a different holder, banned-entity match, bad QR domain, and quantity over the invoice. Watermark every page "SYNTHETIC – NOT A REAL CERTIFICATE", use fictitious companies or real OS Hub facility names with fake certificate numbers, and use no logos. Freeze the set and publish it in the repo with its hash in the ledger.
- **Fields (about 8):** standard, certificate number, holder name, holder address/country, certification body, valid_from, valid_to, product scope. Report per-field EM, overall micro-F1, conflict-detection precision and recall on the seeded cases, median latency per document, and cost per document.
- **Fair comparison:** use the same documents and the same OCR text input for all three extractors. Fix the prompt and a JSON schema. Use temperature 0 (the TigerLLM card's `do_sample=False` is the same idea). Make one run per model, or three runs with the variance shown. With N≈30 documents × 8 fields = 240 field decisions, show a 95% confidence interval rather than a bare number. Disclose that the documents are synthetic.
- **The "one credible number"** could be: "Field-level exact-match F1 = X% (95% CI a–b) on a frozen 30-document synthetic suite; the rules+LLM hybrid caught Y of Z seeded conflicts." Hybrid here means Qwen3 4B with rules validation.

### Gaps
- No public, legally reusable corpus of real textile certificates with labels was found. Real certificates found online are copyrighted documents containing third-party data.
- No published benchmark of LLM extraction specifically on textile certificates was found.

## Q5. Impact KPIs credible for judges, with industry baselines

### Takeaway
Hard published baselines for "minutes per certificate check" or "questionnaire completion time" were not found. Credible cost and burden context exists: 45% of facilities in a WRAP (Worldwide Responsible Accredited Production) survey pay USD 5,000–20,000 a year on audit expenses, and ITC (International Trade Centre) and Apparel Impact Institute (Aii) material documents audit fatigue. The defensible approach is to measure your own before/after timing on the frozen test suite, and anchor the cost narrative on WRAP.

### Cited Findings
- WRAP survey: the number of audits per facility has risen, factories absorb the staffing cost, and "Forty-five percent of the facilities are paying between 5,000 and 20,000 USD per year for audit expenses". — [WRAP: How Many Social Audits Are Enough (Oct 2023)](https://wrapcompliance.org/wp-content/uploads/2023/10/How-Many-Social-Audits-Are-Enough-WRAP-Oct-2023.pdf)
- ITC: repetitive audits cause inefficiency and stress, and SMEs struggle more than large companies with due-diligence demands. — [ITC report](https://intracen.org/es/media/18763)
- Aii: separate brand auditors arriving on different days is "a great waste of time and resources and creates confusion". — [Apparel Impact Institute](https://apparelimpact.org/resources/in-the-news-why-tackling-audit-fatigue-can-lead-to-more-sustainable-factories/)
- Shared-data platforms are the industry's own remedy: Sedex (which does not verify uploaded audits), the Fair Factories Clearinghouse, and SLCP (Social & Labor Convergence Program). — [ADEC ESG](https://adecesg.com/resources/blog/supply-chains-how-to-combat-audit-fatigue); [ISHN](https://www.ishn.com/articles/94506-sustainability-audit-fatigue-leads-to-cooperation-between-competitors)
- The GOTS database is not definitive, so a manual check requires the SC, the TC and CB confirmation per shipment. This multi-step process is what Bunon compresses. — [GOTS Q&A](https://global-standard.org/q-and-a)
- The current app takes about 3 s per certificate extraction with Qwen3 4B (from the task context; not an external source).

### Inferences (KPIs to report)
1. **Time per certificate check:** time a person doing a manual check (open the PDF, find the number, open the Label Check or GOTS search, compare name, scope and dates, write a note) on 10 documents. Compare with Bunon's extraction plus a deep-link verification click, and report medians.
2. **Conflicts caught on the seeded suite:** recall and precision.
3. **Field-extraction EM/F1:** for rules, local model and cloud model.
4. **Questionnaire pre-fill rate:** percentage of questionnaire fields auto-filled from verified documents, plus the edit rate.
5. **Coverage:** percentage of uploaded facilities matched to a real OS ID.
6. **Auditability:** percentage of decisions with a ledger entry and a source citation.

Frame cost savings as "time saved × staff cost", with WRAP's USD 5,000–20,000 a year as context only, not as a claimed saving.

### Gaps
- No credible published baseline was found for minutes per certificate verification, supplier questionnaire completion time in apparel, or error rates of manual certificate checks. Vendor claims exist but were not used. These must be measured in-house and reported transparently, including N and method.
