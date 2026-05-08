"use client";

import Image from "next/image";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLanguage, type Lang } from "@/lib/language";
import { toast } from "sonner";
import aiAssistant from "@/assets/hunter-avatar-neon.png";
import { Send, Sparkles, Sword, Languages, CheckCircle2, Clock3 } from "lucide-react";

const T = {
  en: {
    badge: "▸ AI Weekly Planner",
    subtitle: (lv?: number, xp?: number, max?: number) => `Lv.${lv} Hunter · ${xp}/${max} XP`,
    greeting:
      "I am Jin, your AI weekly planner. Tell me your goals, constraints, and preferences, and I will build a personalized 7-day task plan for you.",
    placeholder: "Tell Jin what kind of 7-day plan you want…",
    thinking: "Jin is thinking…",
    quick: "Quick prompts",
    prompts: [
      "Build me a 7-day study plan for improving my English",
      "Give me a 7-day work plan focused on shipping my project",
      "Make me a balanced week with gym, study, and rest",
      "I only have 2 hours a day. Build a realistic weekly task plan",
    ],
    added: (n: number) => `⚔ ${n} quest(s) added`,
    accepted: "Quest accepted",
    langLabel: "Language",
  },
  mn: {
    badge: "▸ AI 7 Хоногийн Planner",
    subtitle: (lv?: number, xp?: number, max?: number) => `Lv.${lv} Анчин · ${xp}/${max} XP`,
    greeting:
      "Сайн уу, би Жин — таны AI 7 хоногийн planner. Зорилго, хязгаарлалт, хүссэн нөхцлөө бичээрэй, би түүнд таарсан 7 хоногийн task төлөвлөгөө гаргаж өгнө.",
    placeholder: "Жинд энэ 7 хоногт ямар plan хүсэж байгаагаа бич…",
    thinking: "Жин бодож байна…",
    quick: "Түргэн сонголт",
    prompts: [
      "Англи хэлээ сайжруулах 7 хоногийн study plan гарга",
      "Төслөө урагшлуулах 7 хоногийн ажлын plan гарга",
      "Gym, study, амралт хосолсон тэнцвэртэй 7 хоногийн plan гарга",
      "Өдөрт 2 цаг л байна. Бодитой weekly task plan гарга",
    ],
    added: (n: number) => `⚔ ${n} quest нэмэгдлээ`,
    accepted: "Quest хүлээн авлаа",
    langLabel: "Хэл",
  },
} as const;

export const Route = createFileRoute("/_app/ai")({
  component: AIPage,
});

interface WeeklyTask {
  title: string;
  description: string;
  estimatedMinutes: number;
  successMetric: string;
  categoryHint: "fitness" | "mind" | "study" | "work" | "social" | "creative" | "general";
}

interface WorkoutDayPlan {
  dayNumber: number;
  label: string;
  focus: string;
  difficulty: "rest" | "easy" | "moderate" | "hard";
  isRecoveryDay: boolean;
  estimatedTotalMinutes: number;
  tasks: WeeklyTask[];
  supportActions: string[];
  coachingNote: string;
}

interface WorkoutPlan {
  coachSummary: string;
  personalizationSummary: string;
  weekFocus: string;
  difficultyAdjustment: string;
  recoveryStrategy: string;
  progressionRule: string;
  warningNotes: string[];
  schedule: WorkoutDayPlan[];
  suggestedQuestIds: string[];
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  plan?: WorkoutPlan;
  suggestions?: { quest_id: string; title: string; xp_reward: number }[];
}

interface AIResponse {
  error?: string;
  reply?: string;
  plan?: WorkoutPlan;
  suggestions?: { quest_id: string; title: string; xp_reward: number }[];
  assigned?: string[];
}

function getAIErrorMessage(error: unknown, lang: Lang) {
  const fallback = lang === "mn" ? "AI хүсэлт амжилтгүй боллоо" : "AI request failed";
  const raw = error instanceof Error ? error.message : fallback;

  if (raw.includes("Requested function was not found") || raw.includes("Function not deployed")) {
    return lang === "mn" ? "AI service олдсонгүй." : "The AI service could not be reached.";
  }

  if (raw.includes("OPENAI_API_KEY") || raw.includes("No AI provider configured")) {
    return lang === "mn"
      ? "AI coach тохируулагдаагүй байна. Серверийн орчинд `OPENAI_API_KEY` нэмнэ үү."
      : "The AI coach is not configured. Add `OPENAI_API_KEY` to the server environment.";
  }

  if (raw.includes("Unauthorized")) {
    return lang === "mn"
      ? "AI ашиглахын тулд дахин нэвтэрнэ үү."
      : "Please sign in again to use the AI planner.";
  }

  return raw || fallback;
}

function isMissingQuestRpc(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("could not find the function") ||
    normalized.includes("schema cache") ||
    normalized.includes("accept_quest")
  );
}

async function acceptQuestForUser(userId: string, questId: string) {
  const rpcResult = await supabase.rpc("accept_quest", { _quest_id: questId });
  if (!rpcResult.error) return;

  if (!isMissingQuestRpc(rpcResult.error.message)) {
    throw rpcResult.error;
  }

  const { error: insertError } = await supabase
    .from("user_quests")
    .insert({ user_id: userId, quest_id: questId });

  if (insertError) {
    throw insertError;
  }
}

function AIPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { lang, setLang } = useLanguage();
  const t = T[lang];
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: T[lang].greeting,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const switchLang = (l: "en" | "mn") => {
    setLang(l);
    setMessages([{ role: "assistant", content: T[l].greeting }]);
  };

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.role !== "assistant") return current;
      return [{ role: "assistant", content: T[lang].greeting }];
    });
  }, [lang]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content } as Msg];
    setMessages(next);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Unauthorized");
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          language: lang,
        }),
      });

      let data: AIResponse | null = null;

      try {
        data = (await response.json()) as AIResponse;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error ?? `HTTP ${response.status}`);
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      if (!data) {
        throw new Error("Empty response from AI service");
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply ?? data.plan?.coachSummary ?? "(no reply)",
          plan: data.plan,
          suggestions: data.suggestions,
        },
      ]);
      if (data?.assigned?.length) {
        toast.success(t.added(data.assigned.length));
        await refreshProfile();
      }
    } catch (e: unknown) {
      const msg = getAIErrorMessage(e, lang);
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: `⚠ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (qid: string) => {
    if (!user) return;
    try {
      await acceptQuestForUser(user.id, qid);
      toast.success(t.accepted);
      await refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept quest");
    }
  };

  return (
    <div className="animate-float-up space-y-4 sm:space-y-6">
      <div className="glass-panel frame-corner flex flex-col items-center gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6">
        <div className="w-24 h-24 shrink-0 overflow-hidden rounded-full border border-primary/40 bg-[radial-gradient(circle_at_center,oklch(0.36_0.12_285),oklch(0.14_0.03_260)_70%)] shadow-[0_0_30px_oklch(0.62_0.22_275/0.35)] animate-pulse-glow">
          <Image
            src={aiAssistant}
            alt="Jin"
            width={96}
            height={96}
            sizes="96px"
            className="h-full w-full scale-[1.9] object-cover object-[56%_48%]"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">{t.badge}</p>
          <h1 className="glow-text text-2xl font-bold sm:text-3xl">JIN — AI Weekly Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.subtitle(profile?.level, profile?.xp, profile?.xp_to_next)}
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Languages className="w-3 h-3" /> {t.langLabel}
          </span>
          <div className="inline-flex rounded-md border border-primary/40 overflow-hidden">
            <button
              type="button"
              onClick={() => switchLang("en")}
              className={`px-3 py-1.5 text-xs font-bold transition ${lang === "en" ? "bg-accent/40 text-foreground shadow-[0_0_12px_oklch(0.78_0.22_230/0.4)]" : "text-muted-foreground hover:bg-secondary/40"}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => switchLang("mn")}
              className={`px-3 py-1.5 text-xs font-bold transition border-l border-primary/40 ${lang === "mn" ? "bg-accent/40 text-foreground shadow-[0_0_12px_oklch(0.78_0.22_230/0.4)]" : "text-muted-foreground hover:bg-secondary/40"}`}
            >
              МН
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="glass-panel frame-corner flex min-h-[420px] flex-col p-3 sm:p-4 lg:min-h-[480px] lg:p-6">
          <div
            ref={scroller}
            className="max-h-[58vh] flex-1 space-y-4 overflow-y-auto pr-1 sm:pr-2"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`w-full max-w-full rounded-lg p-3 text-sm sm:max-w-[90%] lg:max-w-[85%] ${
                    m.role === "user"
                      ? "bg-accent/40 border border-primary/40"
                      : "bg-secondary/40 border border-border"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.plan && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-lg border border-primary/25 bg-background/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-primary-glow">
                          Week Focus
                        </p>
                        <p className="mt-2 text-sm font-semibold">{m.plan.weekFocus}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {m.plan.personalizationSummary}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {m.plan.difficultyAdjustment}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {m.plan.schedule.map((day) => (
                          <div
                            key={`${day.dayNumber}-${day.label}`}
                            className="rounded-lg border border-border bg-background/35 p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.35em] text-primary-glow">
                                  Day {day.dayNumber}
                                </p>
                                <h3 className="mt-1 text-sm font-semibold">{day.label}</h3>
                                <p className="text-xs text-muted-foreground">{day.focus}</p>
                              </div>
                              <span className="rounded-full border border-primary/30 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-primary-glow">
                                {day.difficulty}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                              {day.isRecoveryDay
                                ? `Recovery / catch-up day · ${day.estimatedTotalMinutes} min`
                                : `Execution day · ${day.estimatedTotalMinutes} min`}
                            </p>

                            {day.tasks.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {day.tasks.map((task, taskIndex) => (
                                  <div
                                    key={`${day.dayNumber}-${taskIndex}-${task.title}`}
                                    className="rounded-md border border-border/70 bg-background/30 p-2"
                                  >
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                      <p className="text-xs font-semibold">{task.title}</p>
                                      <span className="text-[10px] uppercase tracking-[0.2em] text-primary-glow">
                                        {task.categoryHint}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                      {task.description}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                      <span className="inline-flex items-center gap-1">
                                        <Clock3 className="h-3 w-3" /> {task.estimatedMinutes} min
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> {task.successMetric}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {day.supportActions.length > 0 && (
                              <p className="mt-3 text-xs text-muted-foreground">
                                Support: {day.supportActions.join(", ")}
                              </p>
                            )}

                            <p className="mt-2 text-xs">{day.coachingNote}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-primary/20 bg-background/35 p-3">
                        <p className="text-xs font-semibold">Progression</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.plan.progressionRule}
                        </p>
                        <p className="mt-3 text-xs font-semibold">Recovery Strategy</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.plan.recoveryStrategy}
                        </p>
                        {m.plan.warningNotes.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {m.plan.warningNotes.map((note, noteIndex) => (
                              <p
                                key={`${noteIndex}-${note}`}
                                className="text-xs text-muted-foreground"
                              >
                                {note}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.suggestions.map((s) => (
                        <button
                          key={s.quest_id}
                          onClick={() => acceptSuggestion(s.quest_id)}
                          className="flex w-full flex-col items-start gap-2 rounded border border-primary/40 px-3 py-2 text-left text-xs transition hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Sword className="w-3 h-3" /> {s.title}
                          </span>
                          <span className="text-warning font-bold">+{s.xp_reward} XP</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-muted-foreground italic">{t.thinking}</div>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 rounded-md border border-border bg-input/60 px-3 py-2 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-glow flex items-center justify-center rounded-md px-4 py-2 font-semibold disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="glass-panel frame-corner p-4 space-y-2 h-fit">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t.quick}</p>
          {t.prompts.map((p) => (
            <button
              key={p}
              onClick={() => void send(p)}
              className="flex w-full items-start gap-2 rounded border border-border px-3 py-2 text-left text-xs transition hover:bg-secondary/40"
            >
              <Sparkles className="w-3 h-3 text-primary-glow" /> {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
