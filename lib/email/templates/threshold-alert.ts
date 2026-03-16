export type ThresholdAlertData = {
  orgName: string;
  alertType: "CRITICAL" | "HIGH" | "MEDIUM";
  alertTitle: string;
  alertDescription: string;
  actionUrl: string;
  actionLabel: string;
  baseUrl: string;
};

const alertColors: Record<"CRITICAL" | "HIGH" | "MEDIUM", { bg: string; border: string; title: string }> = {
  CRITICAL: { bg: "#fef2f2", border: "#fecaca", title: "#dc2626" },
  HIGH: { bg: "#fff7ed", border: "#fed7aa", title: "#ea580c" },
  MEDIUM: { bg: "#fefce8", border: "#fde68a", title: "#ca8a04" }
};

export function thresholdAlertTemplate({
  alertType,
  alertTitle,
  alertDescription,
  actionUrl,
  actionLabel,
  baseUrl
}: ThresholdAlertData): string {
  const colors = alertColors[alertType] ?? alertColors.MEDIUM;

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;
  font-family:-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;
    padding:32px 16px;">
    
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#64748b;">
        AI Posture Platform Alert
      </div>
    </div>
    
    <div style="background:${colors.bg};
      border:1px solid ${colors.border};
      border-radius:12px;padding:24px;">
      <div style="font-size:16px;font-weight:600;
        color:${colors.title};margin-bottom:8px;">
        ${alertTitle}
      </div>
      <div style="font-size:14px;color:#0f172a;
        margin-bottom:20px;">
        ${alertDescription}
      </div>
      <a href="${actionUrl}"
        style="display:inline-block;
          background:#0f172a;color:white;
          padding:10px 20px;border-radius:8px;
          text-decoration:none;font-size:14px;">
        ${actionLabel}
      </a>
    </div>
    
    <div style="text-align:center;margin-top:24px;">
      <a href="${baseUrl}/settings/notifications"
        style="color:#94a3b8;font-size:12px;
          text-decoration:none;">
        Manage notification preferences
      </a>
    </div>
  </div>
</body>
</html>`;
}
