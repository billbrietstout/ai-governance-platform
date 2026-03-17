/**
 * Regulation Discovery Report – 2-page PDF for discovery results.
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#0f172a"
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#334155"
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
  table: { marginBottom: 12 },
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
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#3367ff"
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8
  },
  badgeMandatory: { backgroundColor: "#fef2f2", color: "#991b1b" },
  badgeLikely: { backgroundColor: "#fffbeb", color: "#92400e" },
  badgeRecommended: { backgroundColor: "#eff6ff", color: "#1e40af" }
});

export type DiscoveryRegulation = {
  code: string;
  name: string;
  jurisdiction: string;
  applicability: string;
  keyRequirements?: string;
  deadline?: string;
  implementationEffort?: string;
};

export type DiscoveryControl = {
  controlId: string;
  title: string;
  cosaiLayer: string;
  complianceStatus?: string;
};

export type DiscoveryReportPDFProps = {
  applicableRegulations: DiscoveryRegulation[];
  riskScore?: number;
  estimatedMaturityRequired?: number;
  requiredControls: DiscoveryControl[];
  implementationRoadmap: string[];
  generatedAt: Date;
};

const LAYER_NAMES: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1: Business",
  LAYER_2_INFORMATION: "Layer 2: Information",
  LAYER_3_APPLICATION: "Layer 3: Application",
  LAYER_4_PLATFORM: "Layer 4: Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5: Supply Chain"
};

function PDFFooter({ pageNumber }: { pageNumber: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text>AI Readiness Platform — Regulation Discovery</Text>
      <Text>Page {pageNumber} of 2 • Built on CoSAI SRF v0.7</Text>
    </View>
  );
}

export function DiscoveryReportPDF({
  applicableRegulations,
  riskScore,
  estimatedMaturityRequired,
  requiredControls,
  implementationRoadmap,
  generatedAt
}: DiscoveryReportPDFProps) {
  const dateStr = generatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const mandatory = applicableRegulations.filter((r) => r.applicability === "MANDATORY");
  const likely = applicableRegulations.filter((r) => r.applicability === "LIKELY_APPLICABLE");
  const recommended = applicableRegulations.filter((r) => r.applicability === "RECOMMENDED");

  return (
    <Document>
      {/* Page 1 – Discovery Results Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Regulation Discovery Results</Text>
        <Text style={{ marginBottom: 16, color: "#64748b" }}>Generated {dateStr}</Text>

        {(riskScore != null || estimatedMaturityRequired != null) && (
          <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
            {riskScore != null && (
              <View>
                <Text style={{ fontSize: 9, color: "#64748b" }}>Risk Score</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>{riskScore}/100</Text>
              </View>
            )}
            {estimatedMaturityRequired != null && (
              <View>
                <Text style={{ fontSize: 9, color: "#64748b" }}>Maturity Required</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                  M{estimatedMaturityRequired}
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Applicable Regulations</Text>
        {mandatory.length > 0 && (
          <>
            <View style={[styles.badge, styles.badgeMandatory]}>
              <Text>MANDATORY — {mandatory.length} regulation(s)</Text>
            </View>
            {mandatory.map((r, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "bold" }}>{r.name}</Text>
                <Text style={{ fontSize: 9, color: "#64748b" }}>
                  {r.jurisdiction} • {r.keyRequirements ?? "—"}
                  {r.deadline ? ` • Deadline: ${r.deadline}` : ""}
                </Text>
              </View>
            ))}
          </>
        )}
        {likely.length > 0 && (
          <>
            <View style={[styles.badge, styles.badgeLikely]}>
              <Text>LIKELY APPLICABLE — {likely.length} regulation(s)</Text>
            </View>
            {likely.map((r, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "bold" }}>{r.name}</Text>
                <Text style={{ fontSize: 9, color: "#64748b" }}>
                  {r.jurisdiction} • {r.keyRequirements ?? "—"}
                </Text>
              </View>
            ))}
          </>
        )}
        {recommended.length > 0 && (
          <>
            <View style={[styles.badge, styles.badgeRecommended]}>
              <Text>RECOMMENDED — {recommended.length} regulation(s)</Text>
            </View>
            {recommended.map((r, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text>{r.name} ({r.jurisdiction})</Text>
              </View>
            ))}
          </>
        )}
        {applicableRegulations.length === 0 && (
          <Text style={{ color: "#64748b" }}>No applicable regulations identified.</Text>
        )}
        <PDFFooter pageNumber={1} />
      </Page>

      {/* Page 2 – Required Controls & Implementation Roadmap */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Required Controls & Implementation Roadmap</Text>

        <Text style={styles.sectionTitle}>Required Controls (CoSAI layers)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Control</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Layer</Text>
            <Text style={[styles.tableCellSmall, { fontWeight: "bold" }]}>Status</Text>
          </View>
          {requiredControls.map((c, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{c.title}</Text>
              <Text style={styles.tableCellSmall}>
                {LAYER_NAMES[c.cosaiLayer] ?? c.cosaiLayer}
              </Text>
              <Text style={styles.tableCellSmall}>{c.complianceStatus ?? "—"}</Text>
            </View>
          ))}
        </View>
        {requiredControls.length === 0 && (
          <Text style={{ color: "#64748b", marginBottom: 12 }}>
            No controls specified. Run discovery to populate.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Implementation Roadmap</Text>
        {(implementationRoadmap.length > 0 ? implementationRoadmap : [
          "1. Assess applicability of identified regulations",
          "2. Map controls to CoSAI layers",
          "3. Assign accountability for each control",
          "4. Collect evidence and document compliance",
          "5. Schedule recurring compliance reviews"
        ]).map((step, i) => (
          <View key={i} style={styles.listItem}>
            <Text>{step}</Text>
          </View>
        ))}
        <PDFFooter pageNumber={2} />
      </Page>
    </Document>
  );
}
