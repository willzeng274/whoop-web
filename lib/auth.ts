import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

const SESSION_COOKIE = "whoop_session";
const SESSION_DAYS = 30;

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

function sign(expires: number): string {
  return createHmac("sha256", env("SESSION_SECRET")).update(String(expires)).digest("base64url");
}

/** Constant-time compare that also hides length differences. */
function equal(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function passcodeMatches(candidate: string): boolean {
  return equal(candidate, env("SITE_PASSCODE"));
}

/** Keyed hash of the caller's IP, so Convex never stores raw addresses. */
async function clientKey(): Promise<string> {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
  return createHmac("sha256", env("SESSION_SECRET")).update(`attempt:${ip}`).digest("hex");
}

async function attempt(body: { key: string; release?: boolean }): Promise<{ allowed?: boolean }> {
  const site = env("CONVEX_SITE_URL").replace(/\/$/, "");
  const response = await fetch(`${site}/v1/web/attempt`, {
    method: "POST",
    headers: { authorization: `Bearer ${env("WHOOP_WEB_READ_TOKEN")}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Attempt limiter failed: ${response.status}`);
  return response.json();
}

/** Spends one of today's tries; false once the limit is hit (or the limiter is unreachable). */
export async function reserveAttempt(): Promise<{ key: string; allowed: boolean }> {
  const key = await clientKey();
  try {
    return { key, allowed: (await attempt({ key })).allowed === true };
  } catch {
    return { key, allowed: false };
  }
}

export async function releaseAttempt(key: string): Promise<void> {
  await attempt({ key, release: true }).catch(() => undefined);
}

export async function signIn(): Promise<void> {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const expires = Date.now() + maxAge * 1000;
  (await cookies()).set(SESSION_COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge,
  });
}

export async function isSignedIn(): Promise<boolean> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  const at = Number(expires);
  return Number.isFinite(at) && at > Date.now() && Boolean(signature) && equal(signature, sign(at));
}
