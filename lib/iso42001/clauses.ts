/**
 * ISO 42001 clause structure with labels and evidence links.
 */
export type ClauseGroup = {
  title: string;
  clauses: { id: string; label: string; evidenceLink: string }[];
};

export const ISO_42001_CLAUSES: ClauseGroup[] = [
  {
    title: "Clause 4: Context of the organization",
    clauses: [
      { id: "4.1", label: "Understanding the organization", evidenceLink: "/layer1-business" },
      { id: "4.2", label: "Interested parties", evidenceLink: "/layer1-business" },
      { id: "4.3", label: "Scope of the AIMS", evidenceLink: "/settings" },
      { id: "4.4", label: "AI management system", evidenceLink: "/maturity" }
    ]
  },
  {
    title: "Clause 5: Leadership",
    clauses: [
      {
        id: "5.1",
        label: "Leadership and commitment",
        evidenceLink: "/layer3-application/accountability"
      },
      { id: "5.2", label: "AI policy", evidenceLink: "/compliance/snapshots" },
      {
        id: "5.3",
        label: "Roles and responsibilities",
        evidenceLink: "/layer3-application/accountability"
      }
    ]
  },
  {
    title: "Clause 6: Planning",
    clauses: [
      { id: "6.1", label: "Actions to address risks", evidenceLink: "/layer3-application/gaps" },
      { id: "6.2", label: "AI objectives", evidenceLink: "/maturity" }
    ]
  },
  {
    title: "Clause 7: Support",
    clauses: [
      { id: "7.1", label: "Resources", evidenceLink: "/settings" },
      { id: "7.2", label: "Competence (AI literacy)", evidenceLink: "/settings/users" },
      { id: "7.3", label: "Awareness", evidenceLink: "/compliance/regulation-feed" },
      { id: "7.4", label: "Communication", evidenceLink: "/audit" },
      { id: "7.5", label: "Documented information", evidenceLink: "/audit-package" }
    ]
  },
  {
    title: "Clause 8: Operation",
    clauses: [
      { id: "8.1", label: "Operational planning", evidenceLink: "/layer3-application/lifecycle" },
      { id: "8.2", label: "AI risk assessment", evidenceLink: "/layer3-application/gaps" },
      { id: "8.3", label: "AI risk treatment", evidenceLink: "/layer3-application/gaps" },
      { id: "8.4", label: "AI system impact assessment", evidenceLink: "/assessments" }
    ]
  },
  {
    title: "Clause 9: Performance evaluation",
    clauses: [
      {
        id: "9.1",
        label: "Monitoring and measurement",
        evidenceLink: "/layer4-platform/telemetry"
      },
      { id: "9.2", label: "Internal audit", evidenceLink: "/audit" },
      { id: "9.3", label: "Management review", evidenceLink: "/reports/executive-summary" }
    ]
  },
  {
    title: "Clause 10: Improvement",
    clauses: [
      {
        id: "10.1",
        label: "Nonconformity and corrective action",
        evidenceLink: "/layer3-application/gaps"
      },
      { id: "10.2", label: "Continual improvement", evidenceLink: "/maturity" }
    ]
  },
  {
    title: "Annex A controls summary",
    clauses: [
      { id: "A.2", label: "A.2", evidenceLink: "/compliance/iso42001" },
      { id: "A.3", label: "A.3", evidenceLink: "/compliance/iso42001" },
      { id: "A.4", label: "A.4", evidenceLink: "/compliance/iso42001" },
      { id: "A.5", label: "A.5", evidenceLink: "/compliance/iso42001" },
      { id: "A.6", label: "A.6", evidenceLink: "/compliance/iso42001" },
      { id: "A.7", label: "A.7", evidenceLink: "/compliance/iso42001" },
      { id: "A.8", label: "A.8", evidenceLink: "/compliance/iso42001" },
      { id: "A.9", label: "A.9", evidenceLink: "/compliance/iso42001" },
      { id: "A.10", label: "A.10", evidenceLink: "/compliance/iso42001" }
    ]
  }
];
