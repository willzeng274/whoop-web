"use server";

import { redirect } from "next/navigation";

import { passcodeMatches, releaseAttempt, reserveAttempt, signIn } from "@/lib/auth";

export type UnlockResult = "wrong" | "locked";

export async function unlock(code: string): Promise<UnlockResult> {
  if (!/^\d{4}$/.test(code)) return "wrong";
  const { key, allowed } = await reserveAttempt();
  if (!allowed) return "locked";
  if (!passcodeMatches(code)) return "wrong";
  await releaseAttempt(key);
  await signIn();
  redirect("/");
}
