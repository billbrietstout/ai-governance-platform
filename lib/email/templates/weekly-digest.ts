export type WeeklyDigestData = {
  orgName: string;
  recipientName: string;
  regulatoryLight: "RED" | "AMBER" | "GREEN";
  regulatoryText: string;
  operationalLight: "RED" | "AMBER" | "GREEN";
  operationalText: string;
  readinessLight: "RED" | "AMBER" | "GREEN";
  readinessText: string;
  decisionItem: string | null;
  baseUrl: string;
  unsubscribeUrl: string;
};

const lightColor: Record<"RED" | "AMBER" | "GREEN", string> = {
  RED: "#dc2626",
  AMBER: "#f97316",
  GREEN: "#10b981"
};

export function weeklyDigestTemplate({
  orgName,
  recipientName,
  regulatoryLight,
  regulatoryText,
  operationalLight,
  operationalText,
  readinessLight,
  readinessText,
  decisionItem,
  baseUrl,
  unsubscribeUrl
}: WeeklyDigestData): string {
  const items = [
    { light: regulatoryLight, text: regulatoryText, title: "Legal & Regulatory Exposure" },
    { light: operationalLight, text: operationalText, title: "Operational Safety" },
    { light: readinessLight, text: readinessText, title: "Readiness Progress" }
  ];

  const trafficLightsHtml = items
    .map(
      ({ light, text, title }) => `
    <div style="background:white;border-radius:12px;
      padding:20px 24px;margin-bottom:12px;
      border:1px solid #e2e8f0;">
      <div style="display:flex;align-items:center;
        gap:12px;">
        <div style="width:14px;height:14px;
          border-radius:50%;flex-shrink:0;
          background:${lightColor[light]};">
        </div>
        <div>
          <div style="font-size:13px;font-weight:500;
            color:#64748b;margin-bottom:2px;">
            ${title}
          </div>
          <div style="font-size:15px;color:#0f172a;">
            ${text}
          </div>
        </div>
      </div>
    </div>`
    )
    .join("");

  const decisionHtml = decisionItem
    ? `
    <div style="background:#eff6ff;border-radius:12px;
      padding:20px 24px;margin-top:20px;
      border:1px solid #bfdbfe;">
      <div style="font-size:13px;font-weight:600;
        color:#1d4ed8;margin-bottom:8px;">
        One thing that needs your attention
      </div>
      <div style="font-size:15px;color:#0f172a;
        margin-bottom:16px;">
        ${decisionItem}
      </div>
      <a href="${baseUrl}/dashboard/executive" 
        style="display:inline-block;
          background:#1d4ed8;color:white;
          padding:10px 20px;border-radius:8px;
          text-decoration:none;font-size:14px;
          font-weight:500;">
        Review and decide →
      </a>
    </div>`
    : `
    <div style="background:#f0fdf4;border-radius:12px;
      padding:20px 24px;margin-top:20px;
      border:1px solid #bbf7d0;text-align:center;">
      <div style="font-size:15px;color:#166534;">
        ✓ Nothing urgent this week
      </div>
    </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>AI Risk Briefing — ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;
  font-family:-apple-system,BlinkMacSystemFont,
  'Segoe UI',sans-serif;">
  
  <div style="max-width:600px;margin:0 auto;
    padding:32px 16px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:13px;color:#64748b;
        margin-bottom:8px;">AI Readiness Platform</div>
      <h1 style="margin:0;font-size:24px;
        font-weight:600;color:#0f172a;">
        AI Risk Briefing
      </h1>
      <div style="font-size:14px;color:#64748b;
        margin-top:4px;">${orgName}</div>
      <div style="font-size:12px;color:#94a3b8;
        margin-top:2px;">
        Week of ${new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        })}
      </div>
    </div>

    <!-- Three traffic lights -->
    ${trafficLightsHtml}

    <!-- Decision item -->
    ${decisionHtml}

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;margin-top:32px;
      padding-top:16px;text-align:center;">
      <a href="${baseUrl}/dashboard/executive"
        style="color:#3b82f6;text-decoration:none;
          font-size:13px;">
        View full briefing →
      </a>
      <span style="color:#cbd5e1;margin:0 8px;">·</span>
      <a href="${baseUrl}/settings/notifications"
        style="color:#3b82f6;text-decoration:none;
          font-size:13px;">
        Manage preferences
      </a>
      <div style="margin-top:16px;padding-top:16px;
        border-top:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#64748b;
          margin:0 0 8px;">
          You&apos;re receiving this because you have an
          AI Readiness Platform account at ${orgName}.
        </p>
        <a href="${unsubscribeUrl}"
          style="font-size:12px;color:#64748b;
            text-decoration:underline;">
          Unsubscribe from all emails
        </a>
        <span style="color:#cbd5e1;margin:0 6px;">·</span>
        <a href="${baseUrl}/settings/notifications"
          style="font-size:12px;color:#64748b;
            text-decoration:underline;">
          Manage preferences
        </a>
      </div>
      <div style="margin-top:12px;font-size:11px;
        color:#94a3b8;">
        AI Readiness Platform · Built on CoSAI SRF v0.7
      </div>
    </div>
  </div>
</body>
</html>`;
}
