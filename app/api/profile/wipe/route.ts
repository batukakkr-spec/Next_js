import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

function createRequestClient(authHeader: string) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const requestClient = createRequestClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await requestClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const userId = user.id;

    const [achievementsResult, xpLogsResult, userQuestsResult, profileResult] = await Promise.all([
      supabaseAdmin.from("user_achievements").delete().eq("user_id", userId),
      supabaseAdmin.from("xp_logs").delete().eq("user_id", userId),
      supabaseAdmin.from("user_quests").delete().eq("user_id", userId),
      supabaseAdmin
        .from("profiles")
        .update({
          level: 1,
          xp: 0,
          xp_to_next: 100,
          streak_days: 0,
          last_activity_at: null,
        })
        .eq("user_id", userId),
    ]);

    const firstError =
      achievementsResult.error ??
      xpLogsResult.error ??
      userQuestsResult.error ??
      profileResult.error;

    if (firstError) {
      throw new Error(firstError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to wipe progress.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
