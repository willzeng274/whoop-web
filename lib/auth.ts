import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

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
