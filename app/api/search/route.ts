import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { orgId?: string } | undefined;
  if (!user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (!query.trim()) {
    return NextResponse.json({
      assets: [],
      vendors: [],
      regulations: [],
      useCases: [],
      pages: []
    });
  }

  const caller = await createServerCaller();
  const res = await caller.search.globalSearch({ query: query.trim() });
  return NextResponse.json(res.data);
}
