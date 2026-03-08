/**
 * API v1 – placeholder root for versioned API.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ version: "1", status: "ok" });
}
