import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import {
  AIConfigurationError,
  AIProviderError,
  generateWorkoutPlan,
  type AICoachConversationMessage,
  type AICoachQuestCatalogEntry,
  type AICoachRecentQuestEntry,
  type AICoachXPEvent,
} from "@/services/aiCoach";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
  language: z.enum(["en", "mn"]).default("mn"),
});

type QuestRow = Database["public"]["Tables"]["quests"]["Row"];

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

function shouldAssignPlan(message: string) {
  return /(assign|add|start|accept|give me the plan|нэм|оноо|эхлүүл|авъя|өг)/i.test(message);
}

function mapQuestCatalogEntry(quest: QuestRow): AICoachQuestCatalogEntry {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    category: quest.category,
    difficulty: quest.difficulty,
    xpReward: quest.xp_reward,
    targetValue: quest.target_value,
    unit: quest.unit,
    isDaily: quest.is_daily,
  };
}

function mapRecentQuestEntry(
  questCatalogMap: Map<string, QuestRow>,
  questAssignment: {
    quest_id: string;
    status: Database["public"]["Enums"]["user_quest_status"];
    progress: number;
    updated_at: string;
    completed_at: string | null;
  },
): AICoachRecentQuestEntry {
  const quest = questCatalogMap.get(questAssignment.quest_id);

  return {
    questId: questAssignment.quest_id,
    title: quest?.title ?? "Unknown Quest",
    category: quest?.category ?? "fitness",
    difficulty: quest?.difficulty ?? "easy",
    status: questAssignment.status,
    progress: questAssignment.progress,
    xpReward: quest?.xp_reward ?? 0,
    updatedAt: questAssignment.updated_at,
    completedAt: questAssignment.completed_at,
  };
}

function mapXpEvent(event: {
  amount: number;
  reason: string;
  created_at: string;
  quest_id: string | null;
}): AICoachXPEvent {
  return {
    amount: event.amount,
    reason: event.reason,
    createdAt: event.created_at,
    questId: event.quest_id,
  };
}

function getErrorStatus(error: unknown) {
  if (error instanceof AIConfigurationError) return 503;
  if (error instanceof AIProviderError) return error.status;
  if (error instanceof z.ZodError) return 400;
  return 500;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AIConfigurationError) return error.message;
  if (error instanceof AIProviderError) return error.message;
  if (error instanceof z.ZodError) return "Invalid AI coach request payload.";
  return error instanceof Error ? error.message : "Failed to generate workout plan.";
}

// The controller owns auth, Supabase hydration, and orchestration of the AI service.
export async function handleAICoachRequest(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { messages, language } = requestSchema.parse(await request.json());
    const latestUserMessage =
      [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

    const requestClient = createRequestClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await requestClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const [profileResult, questCatalogResult, recentQuestResult, xpLogResult] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("display_name, level, xp, xp_to_next, streak_days")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("quests")
        .select(
          "id, title, description, category, difficulty, xp_reward, target_value, unit, is_daily, is_active, created_at, created_by, updated_at",
        )
        .eq("is_active", true)
        .limit(50),
      supabaseAdmin
        .from("user_quests")
        .select("quest_id, status, progress, updated_at, completed_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("xp_logs")
        .select("amount, reason, created_at, quest_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (profileResult.error) throw new Error(profileResult.error.message);
    if (questCatalogResult.error) throw new Error(questCatalogResult.error.message);
    if (recentQuestResult.error) throw new Error(recentQuestResult.error.message);
    if (xpLogResult.error) throw new Error(xpLogResult.error.message);

    const profile = profileResult.data;
    const questCatalog = questCatalogResult.data ?? [];
    const questCatalogMap = new Map(questCatalog.map((quest) => [quest.id, quest]));
    const recentQuestHistory = (recentQuestResult.data ?? []).map((assignment) =>
      mapRecentQuestEntry(questCatalogMap, assignment),
    );
    const activeQuests = recentQuestHistory.filter((quest) => quest.status === "active");

    const plan = await generateWorkoutPlan({
      userId: user.id,
      displayName: profile?.display_name ?? "Hunter",
      level: profile?.level ?? 1,
      xp: profile?.xp ?? 0,
      xpToNext: profile?.xp_to_next ?? 100,
      streakDays: profile?.streak_days ?? 0,
      language,
      latestRequest: latestUserMessage,
      conversation: messages as AICoachConversationMessage[],
      questCatalog: questCatalog.map(mapQuestCatalogEntry),
      recentQuestHistory,
      activeQuests,
      recentXpEvents: (xpLogResult.data ?? []).map(mapXpEvent),
    });

    const activeQuestIds = new Set(activeQuests.map((quest) => quest.questId));
    const suggestionRows = plan.suggestedQuestIds
      .map((questId) => questCatalogMap.get(questId))
      .filter((quest): quest is QuestRow => Boolean(quest))
      .filter((quest) => !activeQuestIds.has(quest.id))
      .slice(0, 4);

    let assigned: string[] = [];
    if (shouldAssignPlan(latestUserMessage) && suggestionRows.length > 0) {
      const rowsToInsert = suggestionRows.map((quest) => ({
        user_id: user.id,
        quest_id: quest.id,
      }));

      const { error: insertError } = await supabaseAdmin.from("user_quests").insert(rowsToInsert);
      if (insertError) {
        throw new Error(insertError.message);
      }

      assigned = rowsToInsert.map((row) => row.quest_id);
    }

    return NextResponse.json({
      reply: plan.coachSummary,
      plan,
      suggestions: suggestionRows.map((quest) => ({
        quest_id: quest.id,
        title: quest.title,
        xp_reward: quest.xp_reward,
      })),
      assigned,
    });
  } catch (error) {
    console.error("[AI_COACH_ERROR]", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: getErrorStatus(error) });
  }
}
