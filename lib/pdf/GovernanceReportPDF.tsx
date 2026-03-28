/**
 * Executive readiness report – lighter PDF for board/executive reporting.
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
  scorecard: {
    alignItems: "center",
    marginBottom: 24,
    padding: 24,
    backgroundColor: "#f8fafc",
    borderRadius: 8
  },
  scorecardValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1e3a5f"
  },
  scorecardLabel: {
    fontSize: 12,
    marginTop: 4,
    color: "#64748b"
  },
  table: { marginBottom: 16 },
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
  tableCell: { flex: 1, paddingHorizontal: 4 },
  tableCellSmall: { flex: 0.6, paddingHorizontal: 4 },
  listItem: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#3367ff"
  }
});

export type GovernanceReportOrg = {
  name: string;
  tier: string;
  maturityLevel: number;
};

export type GovernanceReportRisk = {
  title: string;
  layer: string;
  severity: string;
  status: string;
  owner?: string;
};

export type GovernanceReportSnapshot = {
  frameworkCode: string | null;
  overallScore: number;
  createdAt: string;
};

export type GovernanceReportPDFProps = {
  org: GovernanceReportOrg;
  maturityScores: { L1: number; L2: number; L3: number; L4: number; L5: number; overall: number };
  topRisks: GovernanceReportRisk[];
  complianceTrend: GovernanceReportSnapshot[];
  nextSteps: Array<{ action: string; effort: string; impact: string }>;
  generatedAt: Date;
};

const MATURITY_LABELS: Record<number, string> = {
  1: "M1 Aware",
  2: "M2 Documented",
  3: "M3 Implemented",
  4: "M4 Measured",
  5: "M5 Optimised"
};

const LAYER_NAMES: Record<string, string> = {
  L1: "Layer 1: Business",
  L2: "Layer 2: Information",
  L3: "Layer 3: Application",
  L4: "Layer 4: Platform",
  L5: "Layer 5: Supply Chain"
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

export function GovernanceReportPDF({
  org,
  maturityScores,
  topRisks,
  complianceTrend,
  nextSteps,
  generatedAt
}: GovernanceReportPDFProps) {
  const dateStr = generatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const maturityLevel = org.maturityLevel ?? 1;
  const maturityLabel = MATURITY_LABELS[maturityLevel] ?? `M${maturityLevel}`;
  const nextLevel = Math.min(5, maturityLevel + 1);
  const nextLevelLabel = MATURITY_LABELS[nextLevel] ?? `M${nextLevel}`;

  return (
    <Document>
      {/* Page 1 – Cover */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>AI Readiness Platform</Text>
        <Text style={styles.coverSubtitle}>Executive Readiness Report</Text>
        <Text style={styles.coverOrg}>{org.name}</Text>
        <Text style={styles.coverDate}>Generated {dateStr}</Text>
        <Text style={styles.coverNote}>
          Prepared using the CoSAI Shared Responsibility Framework
        </Text>
        <View style={styles.maturityBadge}>
          <Text style={styles.maturityBadgeText}>{maturityLabel}</Text>
        </View>
        <PDFFooter pageNumber={1} totalPages={5} />
      </Page>

      {/* Page 2 – AI Readiness Scorecard */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>AI Readiness Scorecard</Text>
        <View style={styles.scorecard}>
          <Text style={styles.scorecardValue}>{maturityLabel}</Text>
          <Text style={styles.scorecardLabel}>Current maturity level</Text>
        </View>
        <Text style={{ marginBottom: 12, fontWeight: "bold" }}>Layer-by-layer scores</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Layer</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Score</Text>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Progress</Text>
          </View>
          {(["L1", "L2", "L3", "L4", "L5"] as const).map((l) => {
            const score = maturityScores[l] ?? 0;
            const pct = Math.round(score * 20);
            return (
              <View key={l} style={styles.tableRow}>
                <Text style={styles.tableCell}>{LAYER_NAMES[l]}</Text>
                <Text style={styles.tableCellSmall}>{score.toFixed(1)}</Text>
                <Text style={styles.tableCell}>
                  {pct}% {pct >= 80 ? "✓" : "→"}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={{ marginTop: 16, fontWeight: "bold" }}>What {nextLevelLabel} requires</Text>
        <Text style={{ marginTop: 4, fontSize: 9, color: "#64748b" }}>
          {nextLevel === 2 &&
            "Documented policies, data inventory, and accountability assignments."}
          {nextLevel === 3 && "Implemented controls, model cards, and evidence collection."}
          {nextLevel === 4 && "Measured metrics, drift detection, and continuous monitoring."}
          {nextLevel === 5 &&
            "Optimised processes, automated compliance, and continuous improvement."}
        </Text>
        <PDFFooter pageNumber={2} totalPages={5} />
      </Page>

      {/* Page 3 – Risk Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Risk Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Risk</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Layer</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Severity</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Status</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Owner</Text>
          </View>
          {(topRisks.length > 0 ? topRisks.slice(0, 10) : []).map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{r.title}</Text>
              <Text style={styles.tableCellSmall}>{LAYER_NAMES[r.layer] ?? r.layer}</Text>
              <Text style={styles.tableCellSmall}>{r.severity}</Text>
              <Text style={styles.tableCellSmall}>{r.status}</Text>
              <Text style={styles.tableCellSmall}>{r.owner ?? "—"}</Text>
            </View>
          ))}
        </View>
        {topRisks.length === 0 && (
          <Text style={{ color: "#64748b", marginTop: 8 }}>No risks on record.</Text>
        )}
        <PDFFooter pageNumber={3} totalPages={5} />
      </Page>

      {/* Page 4 – Compliance Status */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Compliance Status</Text>
        <Text style={{ marginBottom: 8 }}>Active regulations with compliance %</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Framework</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Score</Text>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Snapshot Date</Text>
          </View>
          {complianceTrend.map((s, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{s.frameworkCode ?? "Overall"}</Text>
              <Text style={styles.tableCellSmall}>{Math.round(s.overallScore * 100)}%</Text>
              <Text style={styles.tableCell}>{s.createdAt}</Text>
            </View>
          ))}
        </View>
        {complianceTrend.length === 0 && (
          <Text style={{ color: "#64748b", marginTop: 8 }}>No compliance snapshots yet.</Text>
        )}
        <Text style={{ marginTop: 16, fontWeight: "bold" }}>Upcoming deadlines</Text>
        <Text style={{ marginTop: 4, fontSize: 9, color: "#64748b" }}>
          Review compliance snapshots and regulation deadlines in the platform.
        </Text>
        <PDFFooter pageNumber={4} totalPages={5} />
      </Page>

      {/* Page 5 – Recommended Next Steps */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Recommended Next Steps</Text>
        <Text style={{ marginBottom: 12 }}>Top 5 priority actions (effort / impact)</Text>
        {(nextSteps.length > 0
          ? nextSteps.slice(0, 5)
          : [
              {
                action: "Complete data classification for AI assets",
                effort: "Medium",
                impact: "High"
              },
              {
                action: "Document accountability matrix for high-risk systems",
                effort: "Low",
                impact: "High"
              },
              {
                action: "Implement drift detection for production models",
                effort: "High",
                impact: "Medium"
              },
              {
                action: "Collect vendor assurance documentation",
                effort: "Medium",
                impact: "Medium"
              },
              { action: "Schedule recurring compliance snapshots", effort: "Low", impact: "Medium" }
            ]
        ).map((s, i) => (
          <View key={i} style={styles.listItem}>
            <Text>
              {s.action} — {s.effort} effort / {s.impact} impact
            </Text>
          </View>
        ))}
        <PDFFooter pageNumber={5} totalPages={5} />
      </Page>
    </Document>
  );
}
