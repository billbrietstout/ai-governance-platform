import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigests } from "@/lib/notifications/engine";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendWeeklyDigests();
  return NextResponse.json({ success: true });
}
