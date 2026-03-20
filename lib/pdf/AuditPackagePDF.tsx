/**
 * AI Governance Audit Package – PDF document for @react-pdf/renderer.
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica"
  },
  coverTitle: {
    fontSize: 28,
    marginTop: 80,
    marginBottom: 8,
    textAlign: "center"
  },
  coverSubtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: "center",
    color: "#334155"
  },
  coverOrg: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center"
  },
  coverDate: {
    fontSize: 10,
    marginBottom: 24,
    textAlign: "center",
    color: "#64748b"
  },
  coverNote: {
    fontSize: 9,
    marginTop: 60,
    textAlign: "center",
    color: "#64748b"
  },
  maturityBadge: {
    marginTop: 40,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1e3a5f",
    borderRadius: 4
  },
  maturityBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold"
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    fontSize: 8,
    color: "#64748b"
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#0f172a"
  },
  table: {
    marginBottom: 16
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#334155",
    paddingVertical: 6,
    marginBottom: 4
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4
  },
  tableCellSmall: {
    flex: 0.6,
    paddingHorizontal: 4
  },
  scoreGreen: { color: "#059669" },
  scoreAmber: { color: "#d97706" },
  scoreRed: { color: "#dc2626" },
  listItem: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#3367ff"
  }
});

export type AuditPackageOrg = {
  name: string;
  tier: string;
  maturityLevel: number;
};

export type AuditPackageAsset = {
  id: string;
  name: string;
  assetType: string;
  euRiskLevel: string | null;
  cosaiLayer: string | null;
  accountability?: string;
  lastReviewed?: string;
};

export type AuditPackageSnapshot = {
  id: string;
  overallScore: number;
  layerScores: Record<string, number>;
  frameworkCode: string | null;
  createdAt: string;
};

export type DiscoveredRegulation = {
  code: string;
  name: string;
  jurisdiction: string;
  applicability: string;
  keyRequirements?: string;
  deadline?: string;
};

export type LayerComplianceRow = {
  layer: string;
  owner: string;
  score: number;
  status: string;
  keyGaps: string[];
};

export type EvidenceRequirement = {
  layer: string;
  artifact: string;
  status: "Collected" | "Missing" | "Partial";
};

export type Recommendation = {
  priority: string;
  layer: string;
  action: string;
  effort: string;
  deadline?: string;
};

export type AuditPackagePDFProps = {
  org: AuditPackageOrg;
  assets: AuditPackageAsset[];
  snapshots: AuditPackageSnapshot[];
  regulations: DiscoveredRegulation[];
  layerCompliance: LayerComplianceRow[];
  evidenceRequirements: EvidenceRequirement[];
  recommendations: Recommendation[];
  riskSummary: { critical: number; high: number; medium: number; low: number };
  keyFindings: string[];
  generatedAt: Date;
};

function PDFFooter({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text>AI Readiness Platform — Confidential</Text>
      <Text>
        Page {pageNumber} of {totalPages} • Built on CoSAI SRF v0.7
      </Text>
    </View>
  );
}

export function AuditPackagePDF({
  org,
  assets,
  snapshots,
  regulations,
  layerCompliance,
  evidenceRequirements,
  recommendations,
  riskSummary,
  keyFindings,
  generatedAt
}: AuditPackagePDFProps) {
  const dateStr = generatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const maturityLabel = `M${org.maturityLevel}`;
  const latestSnapshot = snapshots[0];
  const overallScore = latestSnapshot?.overallScore ?? 0;
  const totalRisks = riskSummary.critical + riskSummary.high + riskSummary.medium + riskSummary.low;

  const getScoreColor = (score: number) => {
    if (score >= 80) return styles.scoreGreen;
    if (score >= 50) return styles.scoreAmber;
    return styles.scoreRed;
  };

  const LAYER_NAMES: Record<string, string> = {
    L1: "Layer 1: Business",
    L2: "Layer 2: Information",
    L3: "Layer 3: Application",
    L4: "Layer 4: Platform",
    L5: "Layer 5: Supply Chain"
  };

  const mandatoryRegs = regulations.filter((r) => r.applicability === "MANDATORY");
  const likelyRegs = regulations.filter((r) => r.applicability === "LIKELY_APPLICABLE");
  const recommendedRegs = regulations.filter((r) => r.applicability === "RECOMMENDED");

  return (
    <Document>
      {/* Page 1 – Cover */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>AI Readiness Platform</Text>
        <Text style={styles.coverSubtitle}>AI Governance Audit Package</Text>
        <Text style={styles.coverOrg}>{org.name}</Text>
        <Text style={styles.coverDate}>Generated {dateStr}</Text>
        <Text style={styles.coverNote}>
          Prepared using the CoSAI Shared Responsibility Framework
        </Text>
        <View style={styles.maturityBadge}>
          <Text style={styles.maturityBadgeText}>{maturityLabel}</Text>
        </View>
        <PDFFooter pageNumber={1} totalPages={7} />
      </Page>

      {/* Page 2 – Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={{ marginBottom: 16 }}>
          <Text>Overall compliance score: </Text>
          <Text style={[getScoreColor(overallScore), { fontSize: 16, fontWeight: "bold" }]}>
            {Math.round(overallScore)}%
          </Text>
        </View>
        <Text style={{ marginBottom: 8 }}>
          Maturity level: {maturityLabel}. Next steps toward M{Math.min(5, org.maturityLevel + 1)}:
          strengthen evidence collection and control attestations.
        </Text>
        <Text style={{ marginBottom: 8 }}>
          Risk summary: {riskSummary.critical} critical, {riskSummary.high} high,{" "}
          {riskSummary.medium} medium, {riskSummary.low} low ({totalRisks} total).
        </Text>
        <Text style={{ marginBottom: 12 }}>Active regulations: {regulations.length}</Text>
        <Text style={{ marginBottom: 8, fontWeight: "bold" }}>Key findings</Text>
        {(keyFindings.length > 0 ? keyFindings.slice(0, 3) : ["No gaps identified"]).map((f, i) => (
          <View key={i} style={styles.listItem}>
            <Text>{f}</Text>
          </View>
        ))}
        <PDFFooter pageNumber={2} totalPages={7} />
      </Page>

      {/* Page 3 – Layer Compliance Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Layer Compliance Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Layer</Text>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Owner</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Score</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Status</Text>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Key Gaps</Text>
          </View>
          {(layerCompliance.length > 0
            ? layerCompliance
            : [
                { layer: "L1", owner: "—", score: 0, status: "—", keyGaps: [] },
                { layer: "L2", owner: "—", score: 0, status: "—", keyGaps: [] },
                { layer: "L3", owner: "—", score: 0, status: "—", keyGaps: [] },
                { layer: "L4", owner: "—", score: 0, status: "—", keyGaps: [] },
                { layer: "L5", owner: "—", score: 0, status: "—", keyGaps: [] }
              ]
          ).map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{LAYER_NAMES[row.layer] ?? row.layer}</Text>
              <Text style={styles.tableCell}>{row.owner}</Text>
              <Text style={[styles.tableCellSmall, getScoreColor(row.score)]}>{row.score}%</Text>
              <Text style={styles.tableCellSmall}>{row.status}</Text>
              <Text style={styles.tableCell}>{row.keyGaps?.slice(0, 2).join(", ") || "—"}</Text>
            </View>
          ))}
        </View>
        <PDFFooter pageNumber={3} totalPages={7} />
      </Page>

      {/* Page 4 – AI Asset Inventory */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>AI Asset Inventory</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Name</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Type</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>EU Risk</Text>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Accountability</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Last Reviewed</Text>
          </View>
          {assets.map((a) => (
            <View key={a.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{a.name}</Text>
              <Text style={styles.tableCellSmall}>{a.assetType}</Text>
              <Text style={styles.tableCellSmall}>{a.euRiskLevel ?? "—"}</Text>
              <Text style={styles.tableCell}>{a.accountability ?? "—"}</Text>
              <Text style={styles.tableCellSmall}>{a.lastReviewed ?? "—"}</Text>
            </View>
          ))}
        </View>
        {assets.length === 0 && (
          <Text style={{ color: "#64748b", marginTop: 8 }}>No assets in inventory.</Text>
        )}
        <PDFFooter pageNumber={4} totalPages={7} />
      </Page>

      {/* Page 5 – Applicable Regulations */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Applicable Regulations</Text>
        {mandatoryRegs.length > 0 && (
          <>
            <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Mandatory</Text>
            {mandatoryRegs.map((r, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text>
                  {r.name} ({r.jurisdiction})
                </Text>
                <Text style={{ fontSize: 9, color: "#64748b" }}>
                  Applicability: {r.applicability} • Key requirements: {r.keyRequirements ?? "—"}
                  {r.deadline ? ` • Deadline: ${r.deadline}` : ""}
                </Text>
              </View>
            ))}
          </>
        )}
        {likelyRegs.length > 0 && (
          <>
            <Text style={{ fontWeight: "bold", marginTop: 12, marginBottom: 6 }}>
              Likely applicable
            </Text>
            {likelyRegs.map((r, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text>
                  {r.name} ({r.jurisdiction})
                </Text>
                <Text style={{ fontSize: 9, color: "#64748b" }}>
                  {r.keyRequirements ?? "—"}
                  {r.deadline ? ` • Deadline: ${r.deadline}` : ""}
                </Text>
              </View>
            ))}
          </>
        )}
        {recommendedRegs.length > 0 && (
          <>
            <Text style={{ fontWeight: "bold", marginTop: 12, marginBottom: 6 }}>Recommended</Text>
            {recommendedRegs.map((r, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text>
                  {r.name} ({r.jurisdiction})
                </Text>
                <Text style={{ fontSize: 9, color: "#64748b" }}>{r.keyRequirements ?? "—"}</Text>
              </View>
            ))}
          </>
        )}
        {regulations.length === 0 && (
          <Text style={{ color: "#64748b" }}>No regulations on record.</Text>
        )}
        <PDFFooter pageNumber={5} totalPages={7} />
      </Page>

      {/* Page 6 – Evidence Requirements (CoSAI A.7) */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Evidence Requirements (CoSAI A.7)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Layer</Text>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Required Artifact</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Status</Text>
          </View>
          {(evidenceRequirements.length > 0
            ? evidenceRequirements
            : [
                {
                  layer: "L1",
                  artifact: "Business case & risk assessment",
                  status: "Partial" as const
                },
                {
                  layer: "L2",
                  artifact: "Data classification & lineage",
                  status: "Missing" as const
                },
                {
                  layer: "L3",
                  artifact: "Model card & accountability matrix",
                  status: "Partial" as const
                },
                {
                  layer: "L4",
                  artifact: "Monitoring & drift detection",
                  status: "Missing" as const
                },
                {
                  layer: "L5",
                  artifact: "Vendor assurance & provenance",
                  status: "Missing" as const
                }
              ]
          ).map((e, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{LAYER_NAMES[e.layer] ?? e.layer}</Text>
              <Text style={styles.tableCell}>{e.artifact}</Text>
              <Text
                style={[
                  styles.tableCellSmall,
                  e.status === "Collected"
                    ? styles.scoreGreen
                    : e.status === "Partial"
                      ? styles.scoreAmber
                      : styles.scoreRed
                ]}
              >
                {e.status}
              </Text>
            </View>
          ))}
        </View>
        <PDFFooter pageNumber={6} totalPages={7} />
      </Page>

      {/* Page 7 – Recommendations */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {(recommendations.length > 0
          ? recommendations
          : [
              {
                priority: "P1",
                layer: "L2",
                action: "Complete data classification for AI training data",
                effort: "Medium",
                deadline: "30 days"
              },
              {
                priority: "P2",
                layer: "L3",
                action: "Document accountability matrix for high-risk assets",
                effort: "Low",
                deadline: "14 days"
              },
              {
                priority: "P3",
                layer: "L4",
                action: "Implement drift detection for production models",
                effort: "High",
                deadline: "60 days"
              }
            ]
        ).map((r, i) => (
          <View key={i} style={styles.listItem}>
            <Text>
              [{r.priority}] {LAYER_NAMES[r.layer] ?? r.layer}: {r.action} — {r.effort} effort
              {r.deadline ? ` (${r.deadline})` : ""}
            </Text>
          </View>
        ))}
        <PDFFooter pageNumber={7} totalPages={7} />
      </Page>
    </Document>
  );
}
