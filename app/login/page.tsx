import { redirect } from "next/navigation";

import { Passcode } from "@/components/Passcode";
import { isSignedIn } from "@/lib/auth";

export default async function Login() {
  if (await isSignedIn()) redirect("/");
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Passcode />
    </main>
  );
}
