import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const schema = z.object({
  userQuestId: z.string().uuid(),
});

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

async function awardXpServerSide(userId: string, amount: number, reason: string, questId: string) {
  const { error } = await supabaseAdmin.rpc("award_xp", {
    _user_id: userId,
    _amount: amount,
    _reason: reason,
    _quest_id: questId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { userQuestId } = schema.parse(await request.json());
    const requestClient = createRequestClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await requestClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("user_quests")
      .select(
        "id, user_id, progress, status, quest:quests(id, title, xp_reward, target_value)",
      )
      .eq("id", userQuestId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }

    if (!assignment || !assignment.quest) {
      return NextResponse.json({ error: "Active quest not found." }, { status: 404 });
    }

    const quest = Array.isArray(assignment.quest) ? assignment.quest[0] : assignment.quest;

    const { error: updateError } = await supabaseAdmin
      .from("user_quests")
      .update({
        status: "completed",
        progress: quest.target_value,
        completed_at: new Date().toISOString(),
      })
      .eq("id", userQuestId)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await awardXpServerSide(user.id, quest.xp_reward, `Quest: ${quest.title}`, quest.id);

    return NextResponse.json({
      ok: true,
      questId: quest.id,
      xpAwarded: quest.xp_reward,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete quest.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
