import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getUserByOpenId } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // DEV MODE: Check for dev-user header for testing
  if (process.env.NODE_ENV === "development") {
    const devUserOpenId = opts.req.headers["x-dev-user"] as string;
    if (devUserOpenId) {
      user = await getUserByOpenId(devUserOpenId) ?? null;
      if (user) {
        console.log(`[DEV] Authenticated as: ${user.name} (${user.role})`);
        return { req: opts.req, res: opts.res, user };
      }
    }
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
