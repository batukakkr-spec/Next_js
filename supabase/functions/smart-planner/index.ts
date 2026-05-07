// Deprecated: the production AI coach now runs through
// app/api/ai -> src/routes/aiRoutes.ts -> src/controllers/aiController.ts -> src/services/aiCoach.ts.
// This edge function is kept only as legacy reference.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-token",
};

const SYSTEM_PROMPT = `You are Jin, the AI System companion for the LEVELING gamified self-improvement app.
You are an action-oriented planner, not a casual chatbot. Your job is to study the Hunter's level, XP, streak,
and available quest catalog, then produce a concrete, useful plan that feels realistic for one day or one week.

Core behavior:
- Always use tools before making recommendations. Never invent quests.
- Call list_quests first, then call suggest_quests with real quest IDs.
- If the user clearly asks to add, assign, start, or accept a plan, also call assign_quests.
- Recommend only 2 to 4 quests at a time unless the user explicitly asks for more.

Selection rules:
- Level 1-3: prioritize easy, momentum-building quests.
- Level 4-7: prefer medium difficulty with one stretch task.
- Level 8+: choose a sharper mix with harder challenges when available.
- Avoid picking multiple quests that feel repetitive unless the user explicitly wants intense specialization.
- Prefer a balanced mix across fitness, mind, study, work, social, or creative when possible.
- If the user's message suggests fatigue, overload, burnout, poor focus, or low motivation, choose a lighter recovery-friendly plan.
- If the user's message suggests ambition, grind, discipline, or performance, choose a more demanding plan.

Reply style:
- Keep the answer concise, practical, and motivating.
- Do not ramble.
- Sound like a sharp RPG system guide, but still natural and supportive.
- Explain the logic briefly.

Response format:
- Start with a one-line summary of today's or this week's direction.
- Then list the recommended quests as a short numbered plan.
- End with one short motivating line.

Language rules:
- Reply in the language requested by the system message.
- When replying in Mongolian, write naturally in Mongolian Cyrillic.
- Quest titles may remain in English if that is how they exist in the catalog.`;

const tools = [
  {
    type: "function",
    function: {
      name: "list_quests",
      description: "List active quests from the catalog. Optional category filter.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["fitness", "mind", "study", "work", "social", "creative"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_quests",
      description: "Suggest quests to display as actionable buttons in the chat. Just suggest, do not assign.",
      parameters: {
        type: "object",
        properties: {
          quest_ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
          rationale: { type: "string" },
        },
        required: ["quest_ids", "rationale"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_quests",
      description: "Assign quests to the current user (creates active user_quests rows). Use only when the user explicitly asks you to add/assign/start quests.",
      parameters: {
        type: "object",
        properties: {
          quest_ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
        },
        required: ["quest_ids"],
      },
    },
  },
];

type ChatMessage = {
  role: string;
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
};

async function createAICompletion({
  messages,
}: {
  messages: ChatMessage[];
}) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (OPENAI_API_KEY) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        tools,
      }),
    });

    return { response, provider: "openai" as const };
  }

  if (LOVABLE_API_KEY) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
      }),
    });

    return { response, provider: "lovable" as const };
  }

  throw new Error("No AI provider configured. Set OPENAI_API_KEY or LOVABLE_API_KEY.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const userToken = req.headers.get("x-user-token") ?? req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: userToken ? { Authorization: `Bearer ${userToken}` } : {} },
    });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages = [], language = "en" } = await req.json();
    const latestUserMessage = [...messages]
      .reverse()
      .find((message: { role?: string; content?: string }) => message?.role === "user")
      ?.content ?? "";

    // Inject user context
    const { data: profile } = await supabase
      .from("profiles").select("level, xp, xp_to_next, streak_days, display_name")
      .eq("user_id", user.id).maybeSingle();

    const contextMsg = `Current Hunter context: name=${profile?.display_name ?? "Hunter"}, level=${profile?.level ?? 1}, xp=${profile?.xp ?? 0}/${profile?.xp_to_next ?? 100}, streak=${profile?.streak_days ?? 0} days.`;

    const coachingModeMsg = `Interpret the user's latest request carefully: "${latestUserMessage}".
If they ask for today's plan, optimize for immediate execution.
If they ask for this week, optimize for sustainable variety.
If they ask what to train, prioritize fitness-oriented quests when available.
If they ask about focus, studying, discipline, or productivity, prioritize mind/study/work quests when available.
If the request is vague, choose a balanced plan with one easy win first.`;

    const langMsg = language === "mn"
      ? "IMPORTANT: Reply ONLY in Mongolian (Cyrillic). Бүх хариултаа Монгол хэлээр, Кирилл үсгээр бич. Quest нэрийг англиар үлдээж болно."
      : "IMPORTANT: Reply ONLY in English.";

    const conversation = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextMsg },
      { role: "system", content: coachingModeMsg },
      { role: "system", content: langMsg },
      ...messages,
    ];

    const collectedSuggestions: { quest_id: string; title: string; xp_reward: number }[] = [];
    const assignedIds: string[] = [];

    // Agentic loop (max 4 iterations)
    for (let iter = 0; iter < 4; iter++) {
      const { response: aiResp } = await createAICompletion({ messages: conversation });

      if (!aiResp.ok) {
        const t = await aiResp.text();
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error("AI provider error:", aiResp.status, t);
        throw new Error(`AI provider error: ${aiResp.status}`);
      }

      const ai = await aiResp.json();
      const choice = ai.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      // Push assistant message into conversation
      conversation.push(msg);

      const toolCalls = msg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        // Final reply
        return new Response(
          JSON.stringify({
            reply: msg.content ?? "",
            suggestions: collectedSuggestions,
            assigned: assignedIds,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Execute tool calls
      for (const call of toolCalls) {
        const name = call.function?.name;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(call.function?.arguments ?? "{}"); } catch { /* noop */ }
        let result: unknown = { ok: true };

        if (name === "list_quests") {
          let q = supabase.from("quests").select("id, title, description, category, difficulty, xp_reward").eq("is_active", true);
          if (typeof args.category === "string") q = q.eq("category", args.category);
          const { data, error } = await q.limit(20);
          result = error ? { error: error.message } : { quests: data };
        } else if (name === "suggest_quests") {
          const ids = (args.quest_ids as string[]) ?? [];
          const { data } = await supabase.from("quests").select("id, title, xp_reward").in("id", ids);
          (data ?? []).forEach((d) => collectedSuggestions.push({ quest_id: d.id, title: d.title, xp_reward: d.xp_reward }));
          result = { suggested: data?.length ?? 0 };
        } else if (name === "assign_quests") {
          const ids = (args.quest_ids as string[]) ?? [];
          // skip already-active
          const { data: existing } = await supabase
            .from("user_quests").select("quest_id").eq("user_id", user.id).eq("status", "active").in("quest_id", ids);
          const existingSet = new Set((existing ?? []).map((e) => e.quest_id));
          const toInsert = ids.filter((i) => !existingSet.has(i)).map((quest_id) => ({ user_id: user.id, quest_id }));
          if (toInsert.length > 0) {
            const { error } = await supabase.from("user_quests").insert(toInsert);
            if (error) { result = { error: error.message }; }
            else { toInsert.forEach((t) => assignedIds.push(t.quest_id)); result = { assigned: toInsert.length }; }
          } else {
            result = { assigned: 0, note: "already active" };
          }
        } else {
          result = { error: "unknown tool" };
        }

        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    return new Response(
      JSON.stringify({
        reply: "(Jin completed the analysis but did not finalize a reply.)",
        suggestions: collectedSuggestions,
        assigned: assignedIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("smart-planner error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
