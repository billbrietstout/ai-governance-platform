# Proposal: Applying AI Vendor Types & VRA Security Questions to Supply Chain & Vendor Management

## Background

This proposal is based on the document *AI Vendor types and VRA security questions* (PDF at `/Users/billstout/Downloads/`). It maps the document's five vendor categories and their key risk assessment question areas to the AI Posture Platform's supply chain and vendor management.

---

## 1. Document: AI Vendor Types (5 Categories)

The document defines five AI vendor categories with typical offerings and examples:

| # | AI Vendor Category | Typical Offerings / Examples |
|---|--------------------|-----------------------------|
| 1 | **Core AI Platform & Infrastructure** | Cloud AI services, MLOps pipelines, model hosting PaaS (e.g., AWS AI, Azure AI, GCP AI) |
| 2 | **Pre-trained Model / Algorithm Providers** | Foundational or domain-specific models, API-accessible LLMs, vision or speech models (e.g., OpenAI, Mistral, Meta) |
| 3 | **Data Labeling & Human-in-the-Loop Services** | Managed labeling workforces, crowdsourcing platforms, RLHF providers (e.g., Scale AI, LXT, Toloka) |
| 4 | **AI Consulting & Professional Services** | Strategy, custom model development, system integration (e.g., Big-4 consultancies, boutique AI shops) |
| 5 | **Software, VARs, & Distributors** | Bundled AI software, marketplace sellers, OEM integrators |

### 1.1 Mapping to Current Platform `VendorType`

| Document Category | Current Platform Enum | Action |
|-------------------|------------------------|--------|
| Core AI Platform & Infrastructure | `INFRASTRUCTURE` | Keep |
| Pre-trained Model / Algorithm Providers | `MODEL_PROVIDER` | Keep |
| Data Labeling & Human-in-the-Loop Services | `DATA_PROVIDER` | Keep (or add `DATA_LABELING` if distinct) |
| AI Consulting & Professional Services | `OTHER` | Add `CONSULTING` for clarity |
| Software, VARs, & Distributors | `OTHER` or `TOOLING` | Add `RESELLER` or `DISTRIBUTOR` |

**Recommended enum extension:**

```prisma
enum VendorType {
  MODEL_PROVIDER    // Pre-trained Model / Algorithm Providers
  DATA_PROVIDER    // Data Labeling & Human-in-the-Loop
  INFRASTRUCTURE   // Core AI Platform & Infrastructure
  TOOLING          // Dev tools, SDKs
  CONSULTING       // AI Consulting & Professional Services (NEW)
  RESELLER         // Software, VARs, & Distributors (NEW)
  OTHER
}
```

---

## 2. Document: VRA Security Questions by Vendor Type

Each vendor category has its own **Key Risk Assessment Question Areas** with specific attestation/ask items. Below is the extracted content from the PDF.

### 2.1 Core AI Platform & Infrastructure

| Risk Area | Attestation / Ask |
|-----------|-------------------|
| **Data handling & isolation** | SOC2/ISO 27001+ — Provide architecture diagrams depicting how one customer is prevented from accessing another customer's data, and where data resides. |
| **Encryption (at rest / in transit)** | SOC2/ISO 27001 |
| **Security certifications** | SOC2, ISO 27001, FedRAMP |
| **Incident response – SLAs & monitoring** | SOC2/ISO 27001+ — Describe AI events generated and how models are monitored. |
| **Shared responsibility – boundaries** | Point to documents that clearly describe who is responsible for what. Describe which AI events and logs \<customer\> needs to monitor/collect. |
| **Adversarial or bias model testing** | Describe adversarial or bias model testing expected by \<customer\>. |

### 2.2 Pre-trained Model / Algorithm Providers

| Risk Area | Attestation / Ask |
|-----------|-------------------|
| **Model integrity & benchmark evidence** | SOC2/ISO 27001+ — Provide 3rd party certification of model benchmarks. Provide robustness metrics (adversarial attacks, jailbreaks). |
| **Training data – provenance & bias mitigation** | Proof of data opt-out (GDPR, CCPA). List of 3rd party datasets (Common Crawl, books3, the-stack, etc.). |
| **Responsible AI – governance / explainability** | Provide System/Model cards. |
| **Usage licensing & IP indemnification** | Provide license and acceptable use policy terms. |
| **Regulatory alignment for sensitive data** | Provide mapping of model to EU AI Act risk case categories. |
| **Training data usage** | Proof that user data/prompts are not used for training. |

### 2.3 Data Labeling & Human-in-the-Loop Services

| Risk Area | Attestation / Ask |
|-----------|-------------------|
| **Workforce vetting & background checks** | SOC2/ISO 27001+ — Specify which roles or regions are exempt from screening. Describe cadence for re-screening gig workers or contractors. |
| **Confidential data – controls, VDI / VPC use** | Provide evidence of DLP controls. Describe GeoIP, embargo IP restrictions. Provide penetration results for VDI if contractor provided. |
| **Annotation QA processes & accuracy metrics** | ISO 9001+ — Provide QA methodology documentation. Provide prior quarter metrics dashboard. |
| **Sub-processor list and cross-border data flow** | Provide sub-processor list and describe change control. Provide data flow diagram including geographical data locations. Provide audit results of 3rd sub-processors. Provide opt-out options for sub-processors. |
| **Retention / secure deletion – policy** | SOC2/ISO 27001+ — Can \<customer\> define retention policy? Provide certificates of data deletion/destruction. |

### 2.4 AI Consulting & Professional Services

| Risk Area | Attestation / Ask |
|-----------|-------------------|
| **Scope definition, deliverable SLAs & success KPIs** | Provide examples of AI KPI dashboards and prior project scorecards. |
| **Access controls when working in client environments** | Provide restricted data and system access requirements (e.g., VPN, VDI, Jupyter Hub, IDE). |
| **Data ownership of code / models produced** | Provide contracts addressing I.P. or joint ownership. Provide SBOM breakdowns. |
| **Security posture & certifications of consulting firm** | SOC2, ISO 27001+ — 3rd party Attestation results. |
| **Post-engagement – data destruction / retention** | Provide certificates of data deletion/destruction. Process for sanitizing IDE (Jira, Confluence, Git) and wiping local developer workstations/VDI caches. |

### 2.5 Software, VARs, & Distributors

| Risk Area | Attestation / Ask |
|-----------|-------------------|
| **Clarification of patch / update responsibility** | Provide model/dataset/tool patch/update schedule. Provide EOL matrix by product. |
| **Alignment of reseller security controls with OEM** | Provide controls hardening benchmark. Provide contract clauses ensuring vendor cannot weaken security settings over time. |
| **Support & escalation path delineation** | Provide contact names and numbers. Provide incident response process. |
| **Supply chain – vetting for downstream providers** | Provide current sub-provider inventory with geographic locations and data roles. Provide audit results of 3rd sub-processors. Provide opt-out options for sub-processors. |
| **Licensing terms and warranty coverage** | Legal to provide input. |

### 2.6 Question Applicability by Vendor Type

| Risk Category | INFRA | MODEL | DATA_LABELING | CONSULTING | RESELLER |
|---------------|-------|-------|---------------|------------|----------|
| Data handling & isolation | ✓ | ✓ | ✓ | ✓ | — |
| Encryption | ✓ | ✓ | ✓ | ✓ | ✓ |
| Security certifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Incident response & monitoring | ✓ | ✓ | ✓ | ✓ | ✓ |
| Shared responsibility | ✓ | ✓ | — | ✓ | — |
| Adversarial/bias testing | ✓ | ✓ | — | — | — |
| Model integrity & benchmarks | — | ✓ | — | — | — |
| Training data provenance | — | ✓ | ✓ | — | — |
| Model cards / explainability | — | ✓ | — | — | — |
| Licensing & IP indemnification | — | ✓ | — | ✓ | ✓ |
| EU AI Act mapping | — | ✓ | — | — | — |
| Workforce vetting | — | — | ✓ | — | — |
| Annotation QA | — | — | ✓ | — | — |
| Sub-processor list / data flow | ✓ | ✓ | ✓ | — | ✓ |
| Retention / deletion policy | ✓ | ✓ | ✓ | ✓ | — |
| Deliverable SLAs & KPIs | — | — | — | ✓ | — |
| Access controls in client env | — | — | — | ✓ | — |
| Data ownership / SBOM | — | — | — | ✓ | — |
| Post-engagement destruction | — | — | — | ✓ | — |
| Patch / update responsibility | — | — | — | — | ✓ |
| Reseller controls alignment | — | — | — | — | ✓ |
| Support & escalation | — | — | — | — | ✓ |

---

## 3. Application to Platform Supply Chain & Vendor Management

### 3.1 Data Model

#### Option A: Flexible (recommended)

Store VRA answers in a flexible structure:

```prisma
model VendorVraResponse {
  id          String   @id @default(cuid())
  vendorId    String
  orgId       String
  category    String   // e.g. "DATA_HANDLING", "MODEL_INTEGRITY"
  questionId  String   // stable question key
  answer      String   // YES | NO | N/A | PARTIAL | UNKNOWN
  evidenceUrl String?
  notes       String?
  assessedAt  DateTime @default(now())
  assessedBy  String?

  vendor VendorAssurance @relation(...)
  org    Organization   @relation(...)
}
```

#### Option B: Structured by Category

Add a `VendorVra` model per vendor with category-level scores:

```prisma
model VendorVra {
  id                 String   @id @default(cuid())
  vendorId           String
  orgId              String
  dataHandling       Json?
  encryption         Json?
  incidentResponse   Json?
  sharedResponsibility Json?
  modelIntegrity     Json?
  trainingData       Json?
  modelCards         Json?
  subProcessors      Json?
  retentionDeletion  Json?
  // ... other categories
  lastAssessedAt     DateTime?
}
```

Recommendation: Option A for extensibility; Option B if you prefer pre-defined categories aligned to the document.

---

### 3.2 Question Library

Create a canonical question set in code that mirrors the document:

| File | Purpose |
|------|---------|
| `lib/supply-chain/vra-questions.ts` | Question definitions, IDs, categories, applicable vendor types |

Each question from sections 2.1–2.5 becomes an entry with:
- `id` (e.g. `INFRA_DATA_HANDLING`)
- `vendorTypes` (which vendor types must answer)
- `riskArea` (document risk area name)
- `text` (attestation ask)
- `attestation` (SOC2/ISO 27001+, etc.)

---

### 3.3 Vendor Detail Page: Contract Checklist → VRA Section

Replace the placeholder "Contract alignment checklist coming soon" with:

1. **VRA Overview** — Per-risk-area completion (% answered), overall VRA score (weighted by vendor type applicability).
2. **Risk Area Accordions** — Each document risk area for that vendor type expands to show question text, answer (Yes/No/N/A/Partial/Unknown), evidence link, notes.
3. **Actions** — "Start VRA" / "Update VRA", "Export to questionnaire" (for sending to vendor).

---

### 3.4 Assurance Scoring Integration

Extend `lib/supply-chain/assurance.ts`:

1. Add **VRA score** (e.g. 10–15% of total) to the assurance breakdown.
2. Compute from: % of applicable questions answered, weighted by answer (YES = 1, PARTIAL = 0.5, NO/N/A/UNKNOWN = 0).
3. Optionally raise `contractAligned` when VRA coverage exceeds a threshold (e.g. 80%).

---

### 3.5 Supply Chain Dashboard

- **Vendor Registry:** add VRA status (Not started / In progress / Complete) and VRA score column.
- **Reports:** include VRA completion and scores in vendor assurance reports.
- **Alerts:** flag vendors with no recent VRA or low scores.

---

## 4. Implementation Phases

| Phase | Scope |
|-------|-------|
| 1 | Add `CONSULTING` and `RESELLER` to `VendorType` enum; add Prisma model for VRA responses |
| 2 | Implement question library in `vra-questions.ts` using document content (sections 2.1–2.5) |
| 3 | tRPC procedures: get/save VRA responses |
| 4 | Replace Contract Checklist placeholder with VRA UI (risk-area accordions) |
| 5 | Integrate VRA into assurance scoring |
| 6 | Update Vendor Registry, reports, and alerts |

---

## 5. Summary

| Current State | Proposed State |
|---------------|-----------------|
| VendorType: 5 types | Extend with `CONSULTING`, `RESELLER` (document categories 4 & 5) |
| `contractAligned` boolean | Supplement with structured VRA responses keyed to document risk areas |
| Contract Checklist placeholder | Replace with VRA questionnaire UI driven by document questions |
| Assurance: 6 factors | Add VRA as 7th factor with ~10–15% weight |

The proposal now reflects the actual PDF content: five vendor categories and their key risk assessment question areas, with attestation/ask items per category.
