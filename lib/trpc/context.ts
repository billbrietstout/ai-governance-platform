import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

export type TrpcContext = {
  req: NextRequest;
  session: Session | null;
};

export async function createTrpcContext(opts: {
  req: NextRequest;
  session: Session | null;
}): Promise<TrpcContext> {
  return { req: opts.req, session: opts.session };
}

