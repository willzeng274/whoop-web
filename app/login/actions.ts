"use server";

import { redirect } from "next/navigation";

import { passcodeMatches, signIn } from "@/lib/auth";

export async function unlock(code: string): Promise<boolean> {
  if (!/^\d{4}$/.test(code) || !passcodeMatches(code)) {
    // Slow down guessing a little.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return false;
  }
  await signIn();
  redirect("/");
}
