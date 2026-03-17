import { NextRequest, NextResponse } from "next/server";
import { checkThresholdAlerts, checkDeadlineReminders } from "@/lib/notifications/engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await checkThresholdAlerts();
  await checkDeadlineReminders();
  return NextResponse.json({ success: true });
}
