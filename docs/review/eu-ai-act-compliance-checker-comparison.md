# EU AI Act Compliance Checker: Readiness App vs. Future of Life Institute Flowchart

## Overview

This document compares the AI Posture Platform's EU AI Act compliance logic with the **AI Act Compliance Checker Flowchart v1.0** (Future of Life Institute, July 2025), available at [artificialintelligenceact.eu](https://artificialintelligenceact.eu/wp-content/uploads/2025/07/AI-Act-Compliance-Checker-Flowchart-v1.0_compressed.pdf).

---

## Flowchart Structure (Future of Life Institute)

The flowchart uses a **decision-tree questionnaire** with these main sections:

1. **#E Entity** – What type of entity are you? (Provider, Deployer, Distributor, Importer, Product Manufacturer, Authorised Representative)
2. **#HR High Risk Status** – Does your AI system fall within high-risk categories?
   - #HR1: Annex I Section B (civil aviation, vehicles, marine, rail, etc.)
   - #HR2: Annex I Section A (machinery, toys, medical devices, etc.)
   - #HR3: Third-party conformity assessment under existing EU laws?
   - #HR4: Annex III (biometrics, employment, education, critical infrastructure, law enforcement, etc.)
   - #HR5: Significant risk of harm to health, safety, fundamental rights?
   - #HR6: AI as safety component in product?
3. **#S Scope** (#S1) – Do you meet any EU scope criteria? (placing on market, GPAI, established in EU, output used in EU)
4. **#R Rules for Particular Types** – GPAI, exclusions, prohibited practices, transparency
   - #R1: GPAI high-impact capabilities?
   - #R2: Exclusions (military, R&D, open source, personal use)?
   - #R3: Prohibited practices (Art. 5)?
   - #R4: Limited-risk transparency (Art. 50)?
   - #R5: Public body → Fundamental Rights Impact Assessment?

**Outcomes:** Out of scope, Prohibited, High risk, Transparency obligations, GPAI, Provider/Deployer/Distributor/Importer obligations, etc.

---

## Readiness App Implementation

### 1. Data Flow & Questionnaire Coverage

| Flowchart Section              | Readiness App   | Notes                                                                                                                |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Entity type**                | ❌ Not captured | App assumes Provider/Deployer; no entity-type distinction                                                            |
| **Scope (#S1)**                | ✅ Partial      | Discovery: `deployment` (EU_market, US_only, Global, Internal_only), `euResidentsData` (Yes/No/Unknown)              |
| **High-risk (#HR)**            | ✅ Simplified   | `euRiskLevel` (MINIMAL/LIMITED/HIGH/UNACCEPTABLE) or inferred from description/assetType                             |
| **Annex III use cases**        | ✅ Partial      | Discovery: `businessFunction`, `decisionsAffectingPeople`; eu-ai-act.ts: keyword match (recruitment, credit, border) |
| **Prohibited practices (#R3)** | ✅ Partial      | eu-ai-act.ts: subliminal, manipulation, exploit vulnerability, social scoring, real-time biometric                   |
| **Transparency (#R4)**         | ✅ Partial      | Discovery: `interactsWithEndUsers` → Limited risk                                                                    |
| **GPAI (#R1)**                 | ❌ Not captured | No high-impact capabilities, 10²⁵ FLOPs check                                                                        |
| **Exclusions (#R2)**           | ❌ Not captured | No military, R&D, open source, personal-use branches                                                                 |
| **Annex I Sections A/B**       | ❌ Not captured | No product-safety / machinery / medical device categories                                                            |

### 2. Scope Logic

**Flowchart (#S1):**  
In scope if _any_ of: placing on market/putting into service in EU; placing GPAI on market; established in EU; importer (EU-established); output used in EU.

**Readiness App (lib/discovery/engine.ts):**

```typescript
euJurisdiction = deployment === "EU_market" || euResidentsData === "Yes";
euPossible = euResidentsData === "Unknown" || deployment === "Global";
```

- **Alignment:** Reasonable proxy. "EU_market" ≈ placing on market in EU; "euResidentsData=Yes" ≈ output/data used in EU.
- **Gap:** No explicit "established in EU" or importer role.

### 3. Risk Classification

**Flowchart:**  
#HR4 Annex III categories (biometrics, employment, education, critical infrastructure, law enforcement, migration, justice, etc.) → High risk.  
#HR5: "Significant risk of harm?"  
#R3: Prohibited practices → Prohibited.

**Readiness App (lib/compliance/eu-ai-act.ts):**

- Uses `euRiskLevel` when set; otherwise infers from `description` and `assetType`.
- Prohibited: subliminal, manipulation, exploit vulnerability, social scoring, real-time biometric.
- Annex III proxy: APPLICATION + (recruitment | credit | border) in description.
- Default: MINIMAL.

**Gaps:**

- Prohibited (#R3): Missing biometric categorisation, predictive policing, expanding facial recognition databases, emotion recognition (workplace/education).
- No Annex III categories: biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, justice.
- No #HR5-style “significant risk of harm” question.
- No Annex I Sections A/B (product safety, machinery, medical devices).
- No Article 6(2a) exceptions: narrow procedural task, improve human result, detect patterns without replacing human assessment, preparatory task.
- No Notify NCA (Art. 49) path when provider concludes system does NOT pose significant risk.

### 4. Entity-Specific Obligations

**Flowchart:**  
Different obligations for Provider, Deployer, Distributor, Importer, Product Manufacturer, Authorised Representative.

**Readiness App:**  
Does not distinguish entity types; treats all as Provider-like.

### 5. Article Mapping

**Readiness App (lib/cards/eu-ai-act-mapper.ts):**

- Articles 10–15 (data governance, technical doc, transparency, human oversight, accuracy)
- Annex IV (training data, bias, limitations)
- Used for model-card / artifact-card coverage, not for full compliance assessment.

---

## Summary: Alignment & Gaps

| Area                          | Alignment  | Gap                                                                     |
| ----------------------------- | ---------- | ----------------------------------------------------------------------- |
| Scope (EU market / EU data)   | ✅ Good    | No "established in EU" / importer                                       |
| Prohibited practices (Art. 5) | ✅ Good    | Missing emotion recognition, predictive policing, expanding facial DBs  |
| Annex III high-risk           | ⚠️ Partial | Very narrow (recruitment, credit, border); missing many Annex III areas |
| Transparency (Art. 50)        | ⚠️ Partial | `interactsWithEndUsers` only; no deep-fake, emotion, synthetic content  |
| Entity type                   | ❌ Missing | No Provider/Deployer/Distributor/Importer/Product Manufacturer          |
| GPAI / systemic risk          | ❌ Missing | No high-impact or systemic-risk path                                    |
| Exclusions                    | ❌ Missing | No military, R&D, open source, personal use                             |
| Annex I (product safety)      | ❌ Missing | No machinery, toys, medical devices, etc.                               |
| Fundamental Rights IA         | ❌ Missing | No public-body / deployer FRIA (Art. 27)                                |
| Notify NCA (Art. 49)          | ❌ Missing | No path for “not significant risk” registration                         |

---

## Recommendations

### High Priority

1. **Expand Annex III coverage** – Add keywords/categories for:
   - Biometrics
   - Education / vocational training
   - Critical infrastructure
   - Law enforcement
   - Migration / border control
   - Justice / democratic processes
   - Essential services

2. **Add entity type** – Capture Provider/Deployer/Distributor/Importer (at least) in onboarding or asset creation.

3. **Extend prohibited practices** – Align with Art. 5:
   - Biometric categorisation
   - Predictive policing
   - Expanding facial recognition databases
   - Emotion recognition (workplace/education)

### Medium Priority

4. **Scope refinement** – Add “Established in EU” and optionally importer role.

5. **Transparency (Art. 50)** – Differentiate:
   - Deep-fake / synthetic content
   - Emotion recognition / biometric categorisation
   - Natural-person interaction
   - Content resemblance

6. **Exclusions** – Add branches for military, R&D, open source, personal use when applicable.

### Lower Priority

7. **GPAI** – Optional high-impact / systemic-risk path for GPAI providers.

8. **Annex I** – Optional product-safety path for manufacturers integrating AI into regulated products.

9. **FRIA** – Link to Fundamental Rights Impact Assessment (Art. 27) for public-body deployers.

---

## Appendix: Flowchart Questionnaire Items (from PDF)

**#R3 Prohibited (Art. 5):** Subliminal techniques, manipulation, deception; exploiting vulnerabilities; biometric categorisation; social scoring; predictive policing; expanding facial recognition databases; emotion recognition in workplace/education (except medical/safety); real-time remote biometrics.

**#R4 Transparency (Art. 50):** Deep-fake; text for public interest; emotion/biometric categorisation; interacting directly with people (natural persons); synthetic content; content resemblance (for high-risk).

**#R1 GPAI high-impact:** Model has >10²⁵ FLOPs training compute or Commission-designated high capabilities (Annex XIII).

---

## Updates Applied (Readiness App Alignments)

The following alignments with the flowchart have been implemented:

1. **Expanded Annex III** – `lib/compliance/eu-ai-act.ts`: Added keywords for biometrics, education, critical infrastructure, law enforcement, migration, justice, essential services.
2. **Extended prohibited practices** – Biometric categorisation, predictive policing, expanding facial recognition databases, emotion recognition (workplace/education).
3. **Entity type (#E1)** – New `EuAIActEntityType` enum and `euEntityType` on `AIAsset`; captured in onboarding step 4, Create Asset form, and Discover wizard.
4. **Scope refinement (#S1)** – Discovery wizard: "Organisation established or located in EU"; used in `runDiscovery` scope logic.
5. **Exclusions (#R2)** – Discovery wizard: military, R&D only, open source, personal use; applied to skip EU AI Act when excluded.
6. **Transparency (#R4)** – Discovery wizard: deep-fake, synthetic content, emotion/biometric, natural-person interaction checkboxes; informs limited-risk regulation discovery.

---

## File References

- **Flowchart:** [AI-Act-Compliance-Checker-Flowchart-v1.0](https://artificialintelligenceact.eu/wp-content/uploads/2025/07/AI-Act-Compliance-Checker-Flowchart-v1.0_compressed.pdf)
- **App logic:** `lib/compliance/eu-ai-act.ts`, `lib/discovery/engine.ts`, `lib/cards/eu-ai-act-mapper.ts`
- **Onboarding:** `app/(onboarding)/onboarding/step4-first-asset.tsx`
- **Discovery:** `app/(public)/discover/wizard/DiscoveryWizardClient.tsx`
