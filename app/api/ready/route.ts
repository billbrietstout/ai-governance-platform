/**
 * Readiness probe – app is ready to accept traffic (e.g. DB connected).
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // TODO: optionally check DB, cache, etc.
  return NextResponse.json({ ready: true, timestamp: new Date().toISOString() });
}
