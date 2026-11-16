# EU Digital Product Passport (DPP) under the ESPR (Regulation (EU) 2024/1781): legal and technical framework and implementation status as of 2026-11-09

Notes compiled 2026-11-09. Unless stated otherwise, every URL was accessed on 2026-11-09. Official Journal texts (ESPR, Implementing Regulation (EU) 2026/1778, Implementing Decision (EU) 2026/1736, Battery Regulation, COM proposals) were retrieved in full from the EU Publications Office Cellar (`publications.europa.eu/resource/celex/<CELEX>`) because eur-lex.europa.eu returned a bot challenge; they are cited below by their canonical ELI or EUR-Lex URLs. Labels used: **[ADOPTED]** means law in force, **[PROPOSED]** means a Commission proposal that is not law, **[PLANNED]** means an indicative Commission timeline, **[SECONDARY]** means a vendor or law-firm source that was not checked against a primary text.

## 1. Which ESPR articles define the DPP, and what do they require?

### Takeaway
The DPP is defined in ESPR Art. 2(28) and regulated in Chapter III: Art. 9 (when a DPP is required and what delegated acts must specify), Art. 10 (essential requirements), Art. 11 (technical design and operation), Art. 12 (unique identifiers), Art. 13 (registry), Art. 14 (web portal), Art. 15 (customs controls) and Annex III (data menu and ISO/IEC 15459 identifiers). The ESPR is a framework: no DPP obligation applies to any product until a product-specific delegated act under Art. 4 says so, and none had been adopted by 2026-11-09.

### Cited Findings
**Definitions (Art. 2)** — [ESPR, ELI](http://data.europa.eu/eli/reg/2024/1781/oj)
- (28) DPP: "a set of data specific to a product" that includes the information specified in the applicable Art. 4 delegated act and is "accessible via electronic means through a data carrier".
- (29) Data carrier: "a linear barcode symbol, a two-dimensional symbol or other automatic identification data capture medium that can be read by a device".
- (30) Unique product identifier: "a unique string of characters for the identification of a product that also enables a web link to the digital product passport".
- (31) Unique operator identifier: identifies "an actor involved in a product's value chain".
- (33) Unique facility identifier: identifies "locations or buildings involved in a product's value chain".
- (32) DPP service provider: "a natural or legal person that is an independent third-party authorised by the economic operator which places the product on the market", processing DPP data to make it available to actors with access rights.

**Art. 9: when a DPP is required and what delegated acts must specify** — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Art. 9(1): products covered by the DPP information requirements "can only be placed on the market or put into service if a digital product passport is available". The data "shall be accurate, complete and up to date".
- Art. 9(2): each Art. 4 delegated act specifies:
  - (a) the data, drawn from Annex III;
  - (b) the data carrier(s);
  - (c) the carrier's layout and position;
  - (d) whether the DPP is at **model, batch or item level**, and how those levels are defined;
  - (e) pre-contract access, including for distance selling;
  - (f) who may access which data;
  - (g) who creates and updates the DPP, and which data each may introduce;
  - (h) arrangements for updates;
  - (i) the availability period, which "shall correspond to at least the expected lifetime of a specific product".
- Art. 9(4): the Commission may exempt a product group if technical specifications are unavailable, or if other EU law already provides an equivalent digital information system.

**Art. 10: essential requirements** — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Art. 10(1):
  - (a) The DPP is "connected through a data carrier to a persistent unique product identifier".
  - (b) The data carrier is physically present on the product, its packaging or its accompanying documentation.
  - (c) Carrier and identifier comply with the Annex III standards "or equivalent European or international standards until the references of harmonised standards are published" in the OJ.
  - (d) Data are based on open standards, interoperable, machine-readable, structured, searchable and transferable "without vender lock-in".
  - (e) Customer personal data are not stored without explicit GDPR Art. 6 consent.
  - (f) Data refer to the model, batch or item.
  - (g) Access is regulated by Arts 10–11 and the product-group access rights.
- Art. 10(3): the economic operator placing the product on the market gives dealers and online marketplaces a digital copy of the data carrier or identifier, free of charge, within 5 working days of a request.
- Art. 10(4): "The economic operator, when placing the product on the market, shall make available a back-up copy of the digital product passport through a digital product passport service provider."

**Art. 11: technical design and operation** — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- (a) Full technical, semantic and organisational interoperability with other DPPs.
- (b) Free, easy access according to access rights. The access list names customers, manufacturers, importers, distributors, dealers, repairers, independent operators, refurbishers, remanufacturers, recyclers, market surveillance authorities, customs authorities, civil society organisations, trade unions and others.
- (c) The DPP is "stored by the economic operator responsible for its creation or by digital product passport service providers".
- (d) A new DPP is linked to the original DPP(s).
- (e) The DPP stays available for the period set in the delegated act, "including after an insolvency, a liquidation or a cessation of activity in the Union".
- (f) Write and update rights are restricted by access rights.
- (g) "data authentication, reliability and integrity shall be ensured".
- (h) "a high level of security and privacy is ensured and fraud is avoided".
- Service providers "shall not sell, reuse or process such data … beyond what is necessary", unless agreed with the economic operator.
- Empowerments: a delegated act on DPP service provider requirements and an optional certification scheme, and implementing acts on "procedures to issue and verify the digital credentials of economic operators and other relevant actors that have access rights".

**Art. 12: unique identifiers** — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Operator and facility identifiers comply with the Annex III standards (ISO/IEC 15459) until harmonised standards are published.
- If a supplier or facility has no identifier, "the economic operator that creates or updates the digital product passport shall request" one on its behalf, after first confirming none exists (Art. 12(2)–(3)).
- Art. 12(4)–(6) empowers delegated acts on issuing agencies, and on operators that "create their own unique identifiers and data carriers without relying on an issuing agency". These rules must be "reliable, verifiable and unique globally" and as technology-neutral as possible.

**Art. 13 (registry), Art. 14 (web portal), Art. 15 (customs)** — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Covered in detail in Q3 below.
- Art. 14: the Commission "shall set up and manage a publicly accessible web portal" for searching and comparing DPP data within access rights. It has no statutory deadline.

**Annex III (data menu)** — [ESPR Annex III](http://data.europa.eu/eli/reg/2024/1781/oj)
- (a) Information required by Art. 7(2)(b) and 7(5) or by other EU law.
- (b) The unique product identifier at the level set in the delegated act.
- (c) The "Global Trade Identification Number as provided for in … ISO/IEC 15459-6 or equivalent".
- (d) Commodity codes, for example TARIC.
- (e) Compliance documentation: declaration of conformity (DoC), technical documentation, certificates.
- (f) Manuals and safety information.
- (g) Manufacturer information, including its unique operator identifier.
- (h) Other unique operator identifiers.
- (i) Unique facility identifiers.
- (j) Importer information, including its **EORI number**.
- (k) The EU responsible economic operator under Reg. 2019/1020 Art. 4 or GPSR Art. 15.
- (l) "the reference of the digital product passport service provider hosting the back-up copy".
- Identifier standards: the data carrier, unique product identifier, unique operator identifiers and unique facility identifiers must comply with ISO/IEC 15459-1:2014, -2:2015, -3:2014, -4:2014, -5:2014 and -6:2014.

**Transition rule** — [ESPR Art. 4(4)](http://data.europa.eu/eli/reg/2024/1781/oj)
- A delegated act's date of application "shall not be earlier than 18 months from its entry into force", except in duly justified cases.

**Recitals** — [ESPR recitals 38, 41](http://data.europa.eu/eli/reg/2024/1781/oj)
- The DPP "should be based on a decentralised data system and be set up and managed by economic operators".
- The back-up copy goes to "a digital product passport service provider that is an independent third party".

### Inferences
- The legal architecture is decentralised by design. The operator (or its service provider) hosts the DPP data, and the EU only runs an index (the registry) plus a planned search portal. Nothing in ESPR requires a central EU database of DPP content.
- Retention is set per product group (at least the "expected lifetime"), not horizontally. The only horizontal retention figure is the registry's own 10-year default (see Q3).

### Gaps
- No Art. 4 delegated act yet fixes DPP data fields, data carrier, granularity, access rights or retention for any ESPR product group, including textiles. Concrete values for garments are therefore unknown as of 2026-11-09.

## 2. Who is legally responsible for the DPP, and what is the role of a non-EU supplier (e.g. a Bangladeshi garment factory)?

### Takeaway
Responsibility sits with the "economic operator placing the product on the market". In practice that is the manufacturer (the brand marketing under its own name or trademark, wherever it is located) or, for goods from third countries, the EU-established importer. Both must ensure a DPP and a back-up copy exist, and the operator placing the product on the market registers it. A non-EU contract factory is not an economic operator for ESPR purposes unless it markets under its own name. It appears in the DPP as a value-chain actor (unique operator and facility identifiers) and supplies data upstream.

### Cited Findings
- Economic operator = "the manufacturer, the authorised representative, the importer, the distributor, the dealer and the fulfilment service provider" (Art. 2(46)) — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Manufacturer = any person that "manufactures a product or that has a product designed or manufactured, and markets that product under their name or trademark" (Art. 2(42)) — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Importer = "any natural or legal person established in the Union that places a product from a third country on the Union market" (Art. 2(44)) — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Manufacturers must ensure "a digital product passport is available … including a back-up copy of the most up-to-date version … stored by a digital product passport service provider" (Art. 27(1)(c)). Importers have the identical duty before placing on the market (Art. 29(2)(c)). Both must show their contact details "on the public part of the digital product passport" (Arts 27(6), 29(3)) — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Distributors must verify the product "is linked to a digital product passport". Dealers must make the DPP "easily accessible for customers", including in distance selling — [ESPR Arts 30–31](http://data.europa.eu/eli/reg/2024/1781/oj)
- Registry upload: "The economic operator placing the product on the market or putting it into service shall upload, in the registry, the data" (Art. 13(4)) — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Registration is done "by a verified economic operator placing the product on the market or putting it into service at the level specified in the applicable delegated acts (model, batch or item level)" (Implementing Reg. 2026/1778 Art. 8(1)) — [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)
- A verified operator may authorise a third party to register on its behalf. The third party must itself pass verification, and the operator "shall remain fully responsible" (Art. 19(4)). Registered DPPs may be transferred to another verified operator that takes over the obligations (Art. 6a) — [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)
- Non-EU operators can be verified. Operators "not required to be established in the Union" prove identity with a qualified electronic seal or qualified electronic signature under eIDAS (Reg. 910/2014), or an "electronic attestation of attributes issued under Union law". Verified status lasts until the eID means expire, or 3 years at most, and then must be renewed (Arts 4(1)(b), 4(2)(b), 4(4)) — [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)
- Value-chain actors (repairers, refurbishers, recyclers and similar) can obtain verified status through the same eIDAS routes (Art. 5) — [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)
- Upstream suppliers and facilities. The DPP can include "unique operator identifiers other than that of the manufacturer" and "unique facility identifiers" (Annex III(h),(i)). Where these do not exist, the operator creating the DPP must request them on behalf of the supplier or facility owner (Art. 12(2)–(3)) — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Battery precedent: "the economic operator placing the battery on the EU market remains responsible for compliance and the data", even when another party is authorised (FAQ, manuscript completed Sept 2026) — [Commission Battery Passport FAQ](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/eu-digital-product-passport-faq-batteries_en)

### Inferences
- **Bangladeshi factory making garments for an EU brand's label:** the brand is the "manufacturer" (it "has a product … manufactured, and markets that product under [its] name"). The EU importer of record also carries the Art. 29 duty. The factory has no direct ESPR duty, but it will be a data source. Its unique operator and facility identifiers are likely to be required or permitted fields, and the brand may request identifiers on its behalf under Art. 12.
- **Bangladeshi factory exporting under its own brand:** the factory is the manufacturer under Art. 27. Under 2026/1778 Art. 4(2)(b) it could become a "verified economic operator" with a qualified electronic seal from an EU qualified trust service provider, although the EU importer still has the Art. 29(2)(c) duty.
- Service-provider or SaaS role: a platform can host the DPP or the back-up (Art. 11(c), Art. 10(4)) and can perform registry actions on the operator's behalf (2026/1778 Arts 8(2), 19(4)). Legal responsibility stays with the operator. The back-up host must be an "independent third-party" (Art. 2(32)). This implies the operator cannot host its own back-up, and that a provider hosting both the primary DPP and the back-up may need careful structuring. The service-provider delegated act has not been adopted (see Q4), so this is not settled.

### Gaps
- No textile delegated act yet says which actors create and update which DPP fields (Art. 9(2)(g)) or whether supplier-level (Tier 1/2) data are mandatory for garments.
- No adopted rule yet sets the requirements for becoming a DPP service provider or settles the "independence" test (see Q4).

## 3. The EU DPP registry (Art. 13) and the customs link (Art. 15, EU Single Window): what must customs check, has the registry been set up, and does customs verify anything beyond registration?

### Takeaway
The registry deadline of 19 July 2026 was met in substance. Implementing Regulation (EU) 2026/1778 was adopted on 16 July 2026, published in the OJ on 17 July 2026 and entered into force on 6 August 2026, and the Commission announced the live registry and a test environment on 20 July 2026. By law, customs must verify, as a minimum, that the unique registration identifier and the commodity code match the registry. The fully automated check runs through EU CSW-CERTEX and the EU Single Window Environment for Customs, which only becomes mandatory once that interconnection is operational (statutory long-stop: within 4 years of 2026/1778's entry into force, i.e. about August 2030). As of November 2026, no ESPR product group is yet subject to the customs check, because no Art. 4 delegated act exists. Customs may additionally use DPP data for risk management, but release is expressly "not … proof of compliance".

### Cited Findings
**ESPR Art. 13 (registry)** — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- "By 19 July 2026, the Commission shall set up a digital registry … which stores in a secure manner at least the unique identifiers". For products to be released for free circulation it also stores the commodity code, and it stores battery identifiers under Battery Reg. Art. 77(3).
- Delegated acts may add registry data based on: the need to verify "the authenticity of the digital product passport", the efficiency of market surveillance and customs controls, and avoiding disproportionate burden (Art. 13(2)).
- The Commission is controller under Reg. 2018/1725 (Art. 13(3)).
- On upload, the registry returns a **unique registration identifier**. That "shall not be deemed to be proof of compliance with this Regulation or other Union law" (Art. 13(5)).
- The Commission, national authorities and customs have access (Art. 13(6)).

**ESPR Art. 15 (customs controls)** — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Any person intending to place a product covered by an Art. 4 delegated act under "release for free circulation" shall provide the unique registration identifier to customs. This applies "from the moment the registry is operational" (Art. 15(1)).
- Customs "may release a product for free circulation only after having verified as a minimum that the unique registration identifier … and the commodity code … correspond to the data stored in the registry". The verification is "electronic and automatic" through the interconnection and applies once that interconnection is operational. "The release for free circulation shall not be deemed to be proof of compliance" (Art. 15(2)).
- The Commission shall interconnect the registry with the EU Customs Single Window Certificates Exchange System (EU CSW-CERTEX) via the EU Single Window Environment for Customs (Reg. (EU) 2022/2399). It shall be "operational within four years of the date of entry into force of the implementing act referred to in Article 13(5)" (Art. 15(3)).
- The Commission and customs "may retrieve and use the data included in the digital product passport and the registry" for risk management, customs controls and release under the Union Customs Code (Reg. 952/2013) (Art. 15(4)).

**Implementing Regulation (EU) 2026/1778** [ADOPTED] — [Reg. (EU) 2026/1778, ELI](http://data.europa.eu/eli/reg_impl/2026/1778/oj)
- Dates: adopted 16 July 2026; published in OJ L 17.7.2026; in force on the 20th day after publication (Art. 24), i.e. 6 August 2026.
- Scope (Art. 1(1)): ESPR products; batteries (Battery Reg. Art. 77); construction products (Reg. 2024/3110 Art. 76); toys (Reg. 2025/2509 Art. 19); detergents and surfactants (Reg. 2026/405 Art. 21); and any other EU law requiring DPP registration.
- Components (Art. 3): a secure website; an API; a "verification platform to confirm and verify the existence and completeness" of DPPs; a scheme for generating unique registration identifiers; storage of identifiers and commodity codes; a list of verified DPP service providers; a semantic repository; a log system; and identity and authorisation schemes.
- **Checks at registration (Art. 8(7)).** The Commission "shall read the digital product passport content and automatically confirm":
  - (a) semantic conformity with the delegated act data model;
  - (b) coherence of the mandatory registry data with the DPP;
  - (c) the granularity level;
  - (d) the validity of the commodity code against the product group's permitted ranges;
  - (e) the link to the service-provider back-up.
- **Stored registration data (Art. 8(8)–(9)).** The registry stores a "unique and persistent registration identifier", plus the unique identifiers, commodity code, service-provider reference, and "registrant information, including date and time of the registration and the integrity of the digital product passport".
- **Granularity (Art. 8(3)–(5)).** Where several laws apply, registration is at the most granular level required. Item-level DPPs link to batch and model identifiers, and batch-level DPPs link to the model identifier.
- **Proof of registration (Art. 9).** It is a downloadable secure electronic document containing the unique product identifier, commodity code, the operator's name and identity, the date and time (Commission electronic time stamp) and "a hash of the version of the digital product passport". It is sealed with a qualified electronic seal (eIDAS Art. 38) and remains available for 90 days after generation.
- **Retention (Art. 10(3)).** Where EU law sets no DPP availability period, registration data are deleted automatically "10 years after registration". Otherwise retention is aligned with the DPP availability period. Data are versioned and each update is time-stamped (Art. 10(2)).
- **Data models and semantic repository (Arts 11–12).** All DPP data "shall be structured in accordance with the common data models and semantic definitions published in the semantic repository". The repository is free of charge, has public APIs, is aligned with the Interoperable Europe Act (Reg. 2024/903) and uses DCAT-AP metadata.
- **Logs (Art. 14).** Access and authentication logs are kept 6 months; administrative and data-exchange logs 5 years; data-modification logs for the life of the registration. Logs must be immutable and confidential.
- **Member States (Art. 7).** By 18 February 2027 each Member State appoints a "designated national administrator" to manage registry access for its authorities.
- **Support and review.** A helpdesk runs 08:00–20:00 Brussels time, with a 24/7 automated support tool due by February 2029 (Art. 13). The Commission evaluates the regulation by the end of 2032 (Art. 23).

**Commission launch statements**
- 20 July 2026: the Commission launched the DPP Registry, "the secure infrastructure needed to register unique product identifiers and associated metadata", with a testing environment, a UI or API for registration, and a free semantic repository. "Product data is stored in a decentralised manner". Operators can request proof of registration for B2B use — [Commission news, 20 Jul 2026](https://single-market-economy.ec.europa.eu/news/digital-product-passport-registry-now-live-2026-07-20_en)
- Registry page: the registry stores "unique identifiers, registration data, and high-level metadata", not full DPP content. The operator registers "before the product is placed on the EU market". "Customs authorities can check electronically that imported products have a valid registered DPP and a provided commodity code before release for free circulation". Live system: registry.product-passport.ec.europa.eu; test system: registry.acc.product-passport.ec.europa.eu — [Commission DPP Registry page](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/dpp-registry_en)
- Battery FAQ: the registration identifier "does not need to go in electronic customs declarations" for batteries — [Battery Passport FAQ (Sept 2026)](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/eu-digital-product-passport-faq-batteries_en)

**Web portal (Art. 14)**
- The searchable public portal has no deadline and is described as planned "in the coming years". The DPP information page launched on 17 July 2026 is not the Art. 14 portal — [dppatlas.eu, Oct 2026 update [SECONDARY]](https://dppatlas.eu/insights/dpp-update-october-2026)

### Inferences
- **Deadline.** 19 July 2026 fell on a Sunday (date arithmetic). The implementing act was published on 17 July and the launch was announced on Monday 20 July, so the deadline was met in substance with no formal delay.
- **CERTEX long-stop.** 2026/1778 entered into force on 6 August 2026, so the Art. 15(3) interconnection must be operational by about 6 August 2030. Until then, the Art. 15(2) electronic and automated check does not legally apply. The Art. 15(1) duty to give customs the registration identifier exists from registry operation but only bites for products under an Art. 4 delegated act, of which there are none yet.
- **What customs verifies.** At the border, customs verifies registration identity: the registration identifier and commodity code against the registry. Customs does not check the DPP's content. The registry itself, however, performs automated semantic conformity, granularity, commodity-code range and back-up link checks at registration (2026/1778 Art. 8(7)), and stores a hash of the DPP version. Customs can also pull DPP data for risk analysis (Art. 15(4)). Neither registration nor release establishes compliance.
- **For a garment exporter:** once a textile delegated act applies (no earlier than about 2029; see Q4), EU customs will expect a valid registration identifier and a commodity code (HS/CN/TARIC) consistent with the registry. A mismatch can block release.

### Gaps
- The Commission has published no date for the CERTEX/EU Single Window interconnection beyond the 4-year statutory long-stop.
- The registry's technical guidelines (API specifications, exact metadata fields per product group) were not reviewed. They are on the Commission's DPP site and user guide.
- It is unclear whether DPP service providers can be listed as "verified" before the service-provider delegated act exists. 2026/1778 Art. 3(f) provides for the list, but the qualifying criteria are not yet adopted.

## 4. Implementing and delegated acts (DPP service providers, registry, web portal, product groups): what has been adopted or proposed by November 2026?

### Takeaway
Adopted so far:
- the registry Implementing Regulation (EU) 2026/1778;
- Implementing Decision (EU) 2026/1736, citing six harmonised DPP standards;
- non-DPP ESPR acts on unsold-goods destruction (Reg. 2026/2 and Delegated Reg. 2026/296).

Not adopted as of 2026-11-09:
- any product-group (Art. 4) delegated act with DPP requirements (iron and steel targeted Q4 2026, textiles 2027);
- the DPP service-provider delegated act (Commission timeline Q2/Q3 2027);
- the Art. 11 digital-credentials implementing act;
- the Art. 12(4) identifier issuing-agency delegated act;
- the battery access-rights implementing act (legal deadline 18 August 2026 missed);
- the web portal.

### Cited Findings
- **Publications Office search.** A SPARQL query of the Publications Office metadata on 2026-11-09, for EN titles from 2025-06-01 containing "product passport", "2024/1781" or "battery passport", returned only: Implementing Reg. (EU) 2026/2 (9 Feb 2026, unsold-product disclosure), Delegated Reg. (EU) 2026/296 (9 Feb 2026, destruction-ban derogations), Implementing Decision (EU) 2026/1736 (14 Jul 2026), Implementing Reg. (EU) 2026/1778 (16 Jul 2026) and proposal COM(2026) 590. No DPP service-provider act, no ESPR product delegated act, and no decision citing EN 18239/EN 18246 appeared — [EU Publications Office SPARQL endpoint](https://publications.europa.eu/webapi/rdf/sparql); acts at [2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj), [2026/1736](http://data.europa.eu/eli/dec_impl/2026/1736/oj)
- [ADOPTED] Implementing Decision (EU) 2026/1736 of 14 July 2026 (OJ L 15.7.2026, in force on publication) publishes the references of EN 18216:2026, EN 18219:2026, EN 18220:2026, EN 18221:2026, EN 18222:2026 and EN 18223:2026, giving a presumption of conformity with ESPR Arts 10 and 11 under Art. 41(2) — [Decision (EU) 2026/1736](http://data.europa.eu/eli/dec_impl/2026/1736/oj)
- [PLANNED] Commission DPP page timeline:
  - Implementing Act for the Registry and Implementing Decision on six standards (July 2026);
  - Implementing Decision on the remaining two standards (November 2026);
  - Iron and steel delegated act, adoption Q4 2026;
  - Battery access-rights implementing act, Q4 2026;
  - Construction products delegated act (CPR), Q2 2027;
  - Delegated act for DPP service providers, Q2 2027 in one timeline item and Q3 2027 in another;
  - Textiles, aluminium and tyres delegated acts, Q3–Q4 2027;
  - Furniture, 2028;
  - Mattresses and recycled content, 2029.

  — [Commission DPP page](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport_en)
- [PLANNED] ESPR Working Plan 2025–2030 (COM(2025) 187, 16 Apr 2025), indicative adoption: Textiles/Apparel 2027 (ranked 1st); Furniture 2028; Tyres 2027; Mattresses 2029; Iron & Steel 2026; Aluminium 2027. "Every product for which ecodesign measures will be adopted will have a digital product passport, except if there is an alternative digital system providing equivalent information, for example the EPREL" — [COM(2025) 187](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025DC0187)
- [SECONDARY] As of 2026-10-12:
  - No ESPR delegated act with DPP requirements had been published by 9 Oct 2026.
  - The iron and steel call for evidence and consultation closed 12 Aug 2026.
  - Textile timing sources conflict: the working plan says 2027; the Commission DPP page Q3–Q4 2027; the textile page Q4 2027; Have Your Say 16116 says Q1 2027 (stale).
  - The DPP service-provider initiative (Have Your Say 14382) shows Q4 2026, conflicting with the Commission page's Q2–Q3 2027.

  — [dppatlas.eu Oct 2026 update](https://dppatlas.eu/insights/dpp-update-october-2026); [Have Your Say 14382](https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/14382-Digital-Product-Passport-DPP-service-providers_en); [Have Your Say 16116](https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/16116-Ecodesign-requirements-for-sustainable-and-circular-apparel-textiles_en)
- Battery access rights: Battery Reg. Art. 77(9) required the implementing act "By 18 August 2026" — [Reg. (EU) 2023/1542](http://data.europa.eu/eli/reg/2023/1542/oj). The Commission FAQ (Sept 2026) says it is "still being developed", with a draft for "Have your say" expected October or November 2026 — [Battery Passport FAQ](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/eu-digital-product-passport-faq-batteries_en)
- ESPR empowerments not yet used: Art. 11 (service-provider delegated act; digital-credential implementing acts) and Art. 12(4) (issuing agencies and self-issued identifiers) — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)

### Inferences
- **Earliest garment DPP obligation.** With the Art. 4(4) minimum of 18 months, a textile delegated act adopted in late 2027 would make garment DPPs mandatory no earlier than about 2029. Later is plausible given objection periods and entry into force.
- **The first live DPPs in the EU registry** will be battery passports from 18 February 2027. The battery access-rights act is late, so access tiers for "legitimate interest" persons are not yet legally fixed.
- **Service providers have no adopted rulebook yet.** Providers now operate only under Art. 2(32), Art. 10(4), Art. 11 and 2026/1778. A certification scheme is possible under Art. 11 but has not been proposed.

### Gaps
- The official status of the Have Your Say initiatives (14382, 16116, 16473, 17672) was not fetched directly. The timing conflicts above come from a secondary tracker.
- Cellar metadata can lag OJ publication by a few days. Acts published in the first days of November 2026 might not yet have appeared.

## 5. Standards: CEN-CENELEC JTC 24 harmonised standards, ISO/IEC 15459, GS1 Digital Link, UNTP and W3C Verifiable Credentials

### Takeaway
- Eight horizontal ENs were developed by CEN-CLC/JTC 24 (secretariat DIN) under standardisation request C(2024) 5423 / M/604, as amended by C(2025) 8024.
- Six were cited in the OJ on 15 July 2026: EN 18216, 18219, 18220, 18221, 18222 and 18223.
- EN 18239 (access rights and security) and EN 18246 (authentication and integrity) were not cited in the OJ as of 2026-11-09. A citation decision is planned for November 2026, and their publication status is reported inconsistently.
- ESPR itself names only ISO/IEC 15459-1 to -6 and the GTIN.
- GS1 Digital Link, UNTP and W3C Verifiable Credentials are not referenced in ESPR, 2026/1778 or 2026/1736. UNTP claims architectural alignment but not conformance.

### Cited Findings
**Standardisation request and citation** — [Decision (EU) 2026/1736 recitals and Annex](http://data.europa.eu/eli/dec_impl/2026/1736/oj)
- Request: C(2024) 5423 of 31 July 2024 to CEN, Cenelec and ETSI for standards supporting ESPR Arts 10 and 11, amended by C(2025) 8024 of 28 November 2025 "as regards the legal basis and the deadlines".
- Cited standards (OJ L 15.7.2026):
  1. EN 18216:2026 Data exchange protocols
  2. EN 18219:2026 Unique identifiers
  3. EN 18220:2026 Data carriers
  4. EN 18221:2026 Data storage, archiving, and persistence
  5. EN 18222:2026 APIs for product passport lifecycle management and searchability
  6. EN 18223:2026 System interoperability

**CEN-CENELEC (15 Jul 2026)** — [CEN-CENELEC news](https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-07-15-dpp/)
- The first series of 8 standards comes from CEN-CLC/JTC 24 (secretariat DIN) under M/604. Six are OJ-cited.
- The other two are EN 18239 "Access rights management, information system security, and business confidentiality" and EN 18246 "Data authentication, reliability and integrity".
- International mirror committee: ISO/IEC JTC 5 "Digital Product Passport".
- CEN describes the system as hybrid: an EU registry plus third-party storage and back-up.

**EN 18239 / EN 18246 status (conflicting)**
- Both published by CEN on 16 Sep 2026 per the CEN catalogue (consulted 21 Sep 2026); neither cited in the OJ — [DPPify [SECONDARY]](https://www.dppify.com/blog/dpp-standards-en-18239-18246-published)
- EN 18239:2026 listed by BSI as published 30 Sep 2026; prEN 18246 "still a draft"; neither in the OJ as of 12 Oct 2026 — [dppatlas.eu [SECONDARY]](https://dppatlas.eu/insights/dpp-update-october-2026)
- Commission timeline: an Implementing Decision on the remaining two is planned for November 2026 [PLANNED] — [Commission DPP page](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport_en)
- The six were first published by CEN on 27 May 2026 [SECONDARY] — [DPPify](https://www.dppify.com/blog/dpp-standards-en-18239-18246-published)
- EN 18239 reportedly structures access rights by actor type, separates public from commercially confidential data, and covers transfer of responsibility between operators. EN 18246 is reportedly "built around electronically signed data and an audit trail" [SECONDARY, standard text not reviewed] — [DPPify](https://www.dppify.com/blog/dpp-standards-en-18239-18246-published)

**ISO/IEC 15459 and GTIN in law**
- ESPR Annex III point (c): "Global Trade Identification Number as provided for in … ISO/IEC 15459-6 or equivalent". Annex III second paragraph requires ISO/IEC 15459-1..-6 for the data carrier, unique product identifier, unique operator identifiers and unique facility identifiers — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- Battery Reg. Art. 77(3): the QR code and unique identifier comply with ISO/IEC 15459-1..-6 "or their equivalent" — [Reg. (EU) 2023/1542](http://data.europa.eu/eli/reg/2023/1542/oj)

**Semantics in law**
- 2026/1778 Arts 11–12 make the Commission's semantic repository the authoritative source of DPP data models, vocabularies and ontology. It covers "typed and resolvable links between different digital product passports" and links to "underlying evidence communicated through the product value chain", uses DCAT-AP metadata and is accessible through public APIs — [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)

**UNTP (UN/CEFACT)** — [UNTP References page (WIP docs)](https://untp.unece.org/docs/about/References)
- UNTP "requires all credentials be issued as W3C VCs (v2.0 JSON-LD compacted form)", with W3C DIDs as issuer identifiers.
- It states UNTP DPPs are "architecturally interoperable with ESPR product passport requirements".
- An architectural review across 14 topics found alignment with CEN/CENELEC JTC 24: both use W3C VCs, linked-data semantics and content-negotiated identity resolution. But "UNTP is not a profile of JTC24, and conformance to one does not imply conformance to the other".
- It uses ISO/IEC 15459 for identifier encoding.
- UN/CEFACT DPP BRS Part 1 was published as a Public Draft on 29 July 2026. UNTP v1.0 is "expected".

**CIRPASS-2 (non-binding)**
- Its reference architecture recommends Verifiable Credentials for organisational identities, roles and DPP records, and JSON-LD as the default exchange format. It is "not a binding EU specification" — [Think WIoT summary of CIRPASS-2 D4.1 [SECONDARY]](https://wiot-group.com/think/en/news/cirpass-2-eu-dpp-reference-architecture/); primary: [cirpass2.eu project results](https://cirpass2.eu/project-results/)

**Keyword checks of the primary texts (2026-11-09)**
- The ESPR full text contains no occurrence of "verifiable credential", "blockchain", "distributed ledger", "cryptograph", "Merkle" or "zero-knowledge".
- 2026/1778 relies on eIDAS trust services (qualified seals and signatures, electronic attestations of attributes), not W3C VCs by name — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj); [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)

### Inferences
- **Legal status of the six cited ENs.** From 15 July 2026, a DPP system conforming to them is presumed to meet ESPR Arts 10–11 on the aspects they cover. Before that, Annex III's ISO/IEC 15459 "or equivalent" rule governed identifiers and carriers.
- **Access control, security and integrity lack presumption.** The aspects covered by EN 18239/18246 have no presumption of conformity until those standards are cited. That leaves the Art. 11(f)–(h) requirements on access, integrity and security without an OJ-cited standard as of November 2026.
- **GS1 GTIN and GS1 Digital Link.** GS1 is an ISO/IEC 15459 issuing agency, so GTIN-based identifiers (and, plausibly, GS1 Digital Link URIs) fit the legal "15459 or equivalent" route. However, GS1 Digital Link is not named in any primary EU text reviewed.
- **eIDAS identity in the registry.** The "electronic attestation of attributes" route in 2026/1778 points to the eIDAS 2 / EUDI wallet ecosystem for operator identity. Whether operators will be expected to sign DPP content with eIDAS seals depends on EN 18246 and future acts.

### Gaps
- The texts of EN 18219, EN 18220 and EN 18246 were not reviewed (paywalled). Whether they normatively reference GS1 Digital Link, ISO/IEC 18975, IEC 61406, W3C VCs, DIDs or specific signature formats is unverified.
- The authoritative CEN catalogue entry for EN 18246 (published or still prEN) was not accessed directly. Sources conflict.
- No GS1 primary publication on its role in EN 18219/18220 was retrieved.

## 6. Does ESPR require cryptographic proofs, blockchains, Merkle trees or zero-knowledge proofs? How is data integrity and authenticity to be assured?

### Takeaway
ESPR is technology-neutral and requires only that "data authentication, reliability and integrity shall be ensured" (Art. 11(g)) with a high level of security and fraud avoidance (Art. 11(h)). It does not mention blockchains, Merkle trees, zero-knowledge proofs or cryptography. The concrete cryptographic mechanisms in force sit in the registry act 2026/1778:
- a cryptographic hash of each registered DPP version;
- Commission electronic time stamps;
- proof of registration sealed with a qualified electronic seal;
- eIDAS-based identity verification;
- immutable logs.

Field-level integrity techniques are left to standards (EN 18246, not yet OJ-cited) and to operator choice.

### Cited Findings
- **ESPR requirements.**
  - Art. 11(g): "data authentication, reliability and integrity shall be ensured".
  - Art. 11(h): designed and operated so that "a high level of security and privacy is ensured and fraud is avoided".
  - Art. 13(2)(a): registry data may be extended to allow "verification of the authenticity of the digital product passport".
  - Art. 11 last subparagraph: implementing acts may set "procedures to issue and verify the digital credentials of economic operators and other relevant actors".
  - Art. 12(5)(c): identifiers must be "reliable, verifiable and unique globally".

  — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- **No named technologies in ESPR.** The full-text keyword search returned no hits for blockchain, distributed ledger, cryptograph*, Merkle, zero-knowledge or verifiable credential. Recital 41 calls only for "a decentralised data system" — [ESPR](http://data.europa.eu/eli/reg/2024/1781/oj)
- **Registry act 2026/1778.**
  - Art. 2(16) defines a "hash of the version of the digital product passport" as "the output generated from the relevant electronic data using a cryptographic algorithm from the relevant version of the digital product passport".
  - Art. 8(9)(d): the registry stores "the integrity of the digital product passport as part of the evidence of the registration event".
  - Art. 9(2)(e), 9(3): the proof of registration includes the hash, a Commission electronic time stamp and a qualified electronic seal (eIDAS Art. 38).
  - Art. 10(2): versioning with time stamps.
  - Art. 14(5): logs must be immutable.
  - Arts 4–5: identity via a qualified e-seal or e-signature, eID at assurance level "high", or an electronic attestation of attributes.

  — [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)
- **EN 18246** "Data authentication, reliability and integrity" is the dedicated standard. It is reported as based on "electronically signed data and an audit trail" [SECONDARY]. It is not OJ-cited — [CEN-CENELEC](https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-07-15-dpp/); [DPPify](https://www.dppify.com/blog/dpp-standards-en-18239-18246-published)
- **CIRPASS-2 D4.1 (June 2026, exploratory).** Original passports and all updates are immutable; changes create new time-stamped entries; updates get "signed receipts"; "independent cryptographic evidence of authenticity is preserved"; Verifiable Credentials are used for identities, roles and DPP records — [Think WIoT [SECONDARY]](https://wiot-group.com/think/en/news/cirpass-2-eu-dpp-reference-architecture/)
- **Battery Regulation.** Art. 78 sets interoperability, free access by rights, storage by the responsible operator or an authorised party, and (in the remaining points) security requirements, without naming cryptographic techniques — [Reg. (EU) 2023/1542](http://data.europa.eu/eli/reg/2023/1542/oj)

### Inferences
- **What the EU regime does with hashes.** It anchors a hash of each registered DPP version in a Commission-run, eIDAS-sealed registry. That gives tamper evidence for the registered snapshot without a blockchain.
- **Optional add-ons.** Merkle-tree batching, blockchain anchoring and zero-knowledge proofs (for example, proving a claim about confidential supplier data) are legally permissible as design choices under technology neutrality. None is required or referenced, and none would by itself satisfy the registry obligations.
- **Confidential data.** Selective disclosure or ZK proofs could serve Art. 11(b)/(f) access tiers and the business-confidentiality aims of EN 18239. This is an inference, not a regulatory expectation.

### Gaps
- The precise signature and evidence formats required by EN 18246 (for example JAdES/CAdES, VC proofs, or hashing algorithm choices) were not verified.
- The registry's technical guidelines (which hash algorithm, and what exactly is hashed: the JSON-LD document or a canonicalised form) were not reviewed.

## 7. Precedent: the Battery Passport (Regulation (EU) 2023/1542) and the CIRPASS / CIRPASS-2 pilots

### Takeaway
The battery passport is the first mandatory EU DPP. It applies from 18 February 2027 to LMT batteries, industrial batteries above 2 kWh and EV batteries, and the date has not changed. It is accessed by a QR code linked to an ISO/IEC 15459 unique identifier and is registered in the same EU DPP registry. Its access-rights implementing act is overdue. CIRPASS (2022–24) produced the initial DPP system architecture. CIRPASS-2 (Digital Europe Programme, May 2024 – April 2027, 13 lighthouse pilots including textiles) issued an updated, non-binding reference architecture with 25 recommendations in June 2026. No consolidated pilot results were found.

### Cited Findings
**Battery Regulation** — [Reg. (EU) 2023/1542](http://data.europa.eu/eli/reg/2023/1542/oj)
- Art. 77(1): "From 18 February 2027 each LMT battery, each industrial battery with a capacity greater than 2 kWh and each electric vehicle battery placed on the market or put into service shall have an electronic record ('battery passport')".
- Art. 77(2): the passport holds model and individual battery information (Annex XIII), in three access tiers: public; notified bodies, market surveillance authorities and the Commission; and persons with a "legitimate interest".
- Art. 77(3): "accessible through the QR code … which links to a unique identifier that the economic operator placing the battery on the market shall attribute to it". QR code and identifier comply with ISO/IEC 15459-1..-6.
- Art. 77(4): the operator placing on the market ensures accuracy and may authorise another operator in writing.
- Art. 77(7): repurposed or remanufactured batteries get a new passport linked to the original.
- Art. 77(8): the passport "shall cease to exist after the battery has been recycled".
- Art. 77(9): the access-rights implementing act is due by 18 August 2026.
- Art. 78: interoperability with ecodesign DPPs; storage by the responsible operator or authorised operators.

**Status of the 2027 date**
- The date is unchanged per the consolidated Battery Regulation of 13 Aug 2026 [SECONDARY] — [dppatlas.eu](https://dppatlas.eu/insights/dpp-update-october-2026)
- The Commission FAQ (Sept 2026) says data requirements apply "from February 2027". Carbon footprint, recycled content and due diligence information are not required from February 2027; due-diligence reporting applies from August 2027 — [Battery Passport FAQ](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/eu-digital-product-passport-faq-batteries_en)

**Registry and guidance**
- Battery passports are in scope of the EU DPP registry (ESPR Art. 13(1); 2026/1778 Art. 1(1)(b)) — [Reg. (EU) 2026/1778](http://data.europa.eu/eli/reg_impl/2026/1778/oj)
- Commission guidance "Digital Batteries Passport – data point by category" v2.0 (dated 15 Aug 2026, announced 21 Aug 2026) lists 71 data points. It is guidance, not law [SECONDARY on details] — [Commission news 21 Aug 2026](https://single-market-economy.ec.europa.eu/news/guidance-support-preparations-digital-batteries-passport-2026-08-21_en); [dppatlas.eu](https://dppatlas.eu/insights/dpp-update-october-2026)

**CIRPASS (first project)**
- Published deliverable D3.2 "DPP System Architecture" in 2024 — [CIRPASS D3.2 PDF](https://cirpassproject.eu/wp-content/uploads/2024/06/D3.2v1.9.pdf) (cited via [Wikipedia](https://en.wikipedia.org/wiki/EU_Digital_Product_Passport); PDF not opened)

**CIRPASS-2**
- Digital Europe Programme Innovation Action coordinated by CEA-List, running May 2024 – April 2027, with 13 lighthouse pilots in textiles, electrical and electronic equipment, tyres and construction materials — [Think WIoT [SECONDARY]](https://wiot-group.com/think/en/news/cirpass-2-eu-dpp-reference-architecture/); [Fraunhofer IZM project page](https://www.izm.fraunhofer.de/en/institut/projects/cirpass-2.html)
- Updated D4.1 reference architecture published 10 June 2026, with 25 recommendations across interoperability, identity and access management, DPP integrity, DPP access, data management and information display. Highlights:
  - JSON-LD as the default format;
  - core lifecycle APIs per prEN 18222;
  - persistent links to component sub-DPPs;
  - Verifiable Credentials;
  - role-based access;
  - immutable, time-stamped versions with signed receipts;
  - back-up providers that mirror the full dataset with the same access controls;
  - an operator-run resolver from unique product identifier to DPP location, plus a recommended independent EU fallback resolver;
  - item-level identifiers for products needing lifecycle updates.

  The architecture is "not a binding EU specification" — [Think WIoT [SECONDARY]](https://wiot-group.com/think/en/news/cirpass-2-eu-dpp-reference-architecture/); primary: [cirpass2.eu project results](https://cirpass2.eu/project-results/)
- UNTP reports a CIRPASS-2 alignment review across 14 topics, with "operational pilots" planned for Q3 2026 — [UNTP References](https://untp.unece.org/docs/about/References)

### Inferences
- **Template for ESPR textiles.** The battery regime is the closest operational template: QR plus ISO/IEC 15459 identifier, operator responsibility with written delegation, linked successor passports, and tiered access via an implementing act. Its slipped access-rights act suggests the access-tier details for other product groups may also lag.
- **CIRPASS-2 textile pilots** are the most relevant evidence base for garment DPPs, but no published pilot outcomes were found.

### Gaps
- CIRPASS-2 pilot results (textile pilot findings, performance, costs) were not found. The project ends April 2027.
- The full text of CIRPASS-2 D4.1 was not read. Only a secondary summary was used.

## 8. 2025–2026 simplification / omnibus proposals affecting ESPR or the DPP timeline

### Takeaway
No adopted or proposed act postpones the DPP, the registry or the ESPR framework. The relevant proposals, none adopted as of 2026-11-09, mostly make the DPP a vehicle for other obligations:
- COM(2025) 504 "Omnibus IV" (digitalisation and common specifications): digital DoC and instructions placed in the DPP; minor ESPR edits.
- COM(2026) 565: EPREL ↔ DPP registry integration and once-only registration.
- COM(2026) 590 Public Procurement Act: DPP used as proof of conformity and for country of origin; deletes ESPR Art. 65 and Art. 74(3)(b).

### Cited Findings
**COM(2025) 504** [PROPOSED], 21 May 2025, procedure 2025/0134(COD) — [COM(2025) 504](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025PC0504)
- Title: Regulation "amending Regulations (EU) No 765/2008, (EU) 2016/424, (EU) 2016/425, (EU) 2016/426, (EU) 2023/1230, (EU) 2023/1542 and (EU) 2024/1781 as regards digitalisation and common specifications".
- Art. 7 ESPR amendments:
  - adds Art. 2(46a) "digital contact";
  - requires authority information requests to be answered "in electronic form" within 15 days (30 days under Art. 24(2));
  - amends Annex V point 2.
- Recital 12 and new provisions in sectoral acts (machinery, PPE, etc.): where other EU law requires a DPP, the DoC information and instructions "shall be provided only in that digital product passport".
- The ESPR amendments apply 24 months after entry into force.

**Legislative status of COM(2025) 504**
- No adopted regulation found in Publications Office metadata as of 2026-11-09 — [EU Publications Office SPARQL](https://publications.europa.eu/webapi/rdf/sparql)
- A secondary tracker lists an indicative EP plenary vote on 23 Nov 2026 [SECONDARY] — [dppatlas.eu](https://dppatlas.eu/insights/dpp-update-october-2026)
- Search-result summaries mention a provisional political agreement on 9 June 2026. This could not be verified against a Council or EP primary source (unverified).

**COM(2026) 565** [PROPOSED], 24 June 2026 — [COM(2026) 565](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52026PC0565)
- Energy and tyre labelling simplification.
- Explanatory memorandum: products for which EPREL offers information equivalent to an ESPR delegated act "do not have to be registered again in the registry managing the digital product passport". EPREL model-level data are to be "interlinked with DPP registry item-level information".
- New Art. 12(13) of Reg. 2017/1369: "the Commission shall ensure the integration between EPREL and the central part of the registry to be established under Article 13 of Regulation (EU) 2024/1781".

**COM(2026) 590** [PROPOSED], 9 Sep 2026, Public Procurement Act — [COM(2026) 590](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52026PC0590)
- Art. 147(1) deletes ESPR Art. 65 and Art. 74(3)(b).
- Public buyers "may require that economic operators provide a declaration of conformity … through the digital product passport pursuant to Regulation (EU) 2024/1781".
- Tenderers indicate country of origin, "incorporating it, where applicable, into the digital product passport of the goods".
- Application deferred by two years.

**Other context**
- ESPR corrigendum 32024R1781R(02), dated 28 Apr 2025 — [Publications Office SPARQL](https://publications.europa.eu/webapi/rdf/sparql)
- Sustainability-reporting and due-diligence omnibus packages did not change ESPR DPP obligations [SECONDARY] — [passportcraft.com](https://passportcraft.com/insights/eu-omnibus-dpp-obligations-unchanged); [The Traceability Hub](https://thetraceabilityhub.com/expert-qa/with-the-omnibus-package-has-europe-delayed-everything-does-that-include-the-digital-product-passport/)
- The Commission adopted a standards-acceleration proposal on 6 Oct 2026 (IP/26/2070) [SECONDARY; relevance to the DPP not verified] — [dppatlas.eu](https://dppatlas.eu/insights/dpp-update-october-2026); [press release](https://ec.europa.eu/commission/presscorner/detail/en/ip_26_2070)

### Inferences
- **Direction of travel.** Policy is expanding the DPP's role (DoC and instructions, procurement evidence, origin data, EPREL linkage) rather than delaying it. Bunon should treat the DPP as a growing compliance carrier.
- **Effect on garments.** If COM(2025) 504 is adopted, any product under a DPP-requiring act would carry its DoC and instructions in the DPP. Textiles generally have no CE-marking DoC, so the direct effect on garments is limited. The procurement-origin field could matter for public-sector textile buyers (uniforms, workwear).

### Gaps
- The trilogue and plenary status of COM(2025) 504 was not confirmed from Council or Parliament sources (the Legislative Observatory and Council press pages were not fetched).
- I found no Commission proposal specifically amending ESPR Chapter III (DPP articles) or the Art. 13/15 deadlines. If such a proposal exists after early November 2026, it would not appear in these notes.
