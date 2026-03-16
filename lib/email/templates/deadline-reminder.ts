export type DeadlineReminderData = {
  orgName: string;
  regulationName: string;
  deadline: string;
  daysRemaining: number;
  complianceScore: number;
  actionUrl: string;
  baseUrl: string;
};

export function deadlineReminderTemplate({
  orgName,
  regulationName,
  deadline,
  daysRemaining,
  complianceScore,
  actionUrl
}: DeadlineReminderData): string {
  const urgencyColor =
    daysRemaining <= 7 ? "#dc2626" : daysRemaining <= 30 ? "#f97316" : "#f59e0b";

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;
  font-family:-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;
    padding:32px 16px;">
    
    <div style="background:white;border-radius:12px;
      padding:24px;border:1px solid #e2e8f0;">
      
      <div style="font-size:13px;color:#64748b;
        margin-bottom:4px;">
        Regulatory Deadline Reminder
      </div>
      
      <h2 style="margin:0 0 16px;font-size:20px;
        color:#0f172a;">
        ${regulationName}
      </h2>
      
      <div style="display:flex;gap:16px;
        margin-bottom:20px;">
        <div style="flex:1;background:#f8fafc;
          border-radius:8px;padding:16px;
          text-align:center;">
          <div style="font-size:32px;font-weight:700;
            color:${urgencyColor};">
            ${daysRemaining}
          </div>
          <div style="font-size:12px;color:#64748b;">
            days remaining
          </div>
        </div>
        <div style="flex:1;background:#f8fafc;
          border-radius:8px;padding:16px;
          text-align:center;">
          <div style="font-size:32px;font-weight:700;
            color:#0f172a;">
            ${complianceScore}%
          </div>
          <div style="font-size:12px;color:#64748b;">
            current compliance
          </div>
        </div>
      </div>
      
      <div style="font-size:14px;color:#475569;
        margin-bottom:20px;">
        Deadline: ${new Date(deadline).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        })}
      </div>
      
      <a href="${actionUrl}"
        style="display:inline-block;
          background:#0f172a;color:white;
          padding:10px 20px;border-radius:8px;
          text-decoration:none;font-size:14px;">
        View compliance status →
      </a>
    </div>
  </div>
</body>
</html>`;
}
