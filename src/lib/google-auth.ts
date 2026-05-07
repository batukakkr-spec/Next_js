"use client";

import { supabase } from "@/integrations/supabase/client";

export async function signInWithGoogle(mode: "login" | "register") {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", "/dashboard");
  callbackUrl.searchParams.set("mode", mode);

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });
}
