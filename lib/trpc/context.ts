import type { NextRequest } from "next/server";

export type TrpcContext = {
  req: NextRequest;
};

export async function createTrpcContext(opts: { req: NextRequest }): Promise<TrpcContext> {
  return { req: opts.req };
}

