/**
 * Health check endpoint for load balancers and monitoring.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "healthy", timestamp: new Date().toISOString() });
}
