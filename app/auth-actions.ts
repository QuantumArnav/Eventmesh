"use server";

import { signIn, signOut } from "@/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function loginWithGoogle(formData: FormData) {
  const redirectTo = safeRedirectPath(formData.get("callbackUrl"));
  await signIn("google", { redirectTo });
}

export async function logout() {
  await signOut({ redirectTo: "/discover" });
}
