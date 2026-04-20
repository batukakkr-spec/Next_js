import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import aiAssistant from "@/assets/ai-assistant.jpg";
import { Send, Sparkles, Sword, Languages } from "lucide-react";

type Lang = "en" | "mn";
const T = {
  en: {
    badge: "▸ AI Companion",
    subtitle: (lv?: number, xp?: number, max?: number) => `Lv.${lv} Hunter · ${xp}/${max} XP`,
    greeting: "I am Jin, your System AI. I can analyze your level, propose a personalized quest plan, and assign quests for you. What's your goal today?",
    placeholder: "Ask Jin to plan your day…",
    thinking: "Jin is thinking…",
    quick: "Quick prompts",
    prompts: ["Plan my day with 3 quests", "What should I train this week?", "Suggest a focus session", "Surprise me"],
    added: (n: number) => `⚔ ${n} quest(s) added`,
    accepted: "Quest accepted",
    langLabel: "Language",
  },
  mn: {
    badge: "▸ AI Туслах",
    subtitle: (lv?: number, xp?: number, max?: number) => `Lv.${lv} Анчин · ${xp}/${max} XP`,
    greeting: "Сайн уу, би Жин — System AI. Чиний түвшинг шинжилж, өдрийн quest төлөвлөгөө гаргаж, шууд оноож өгч чадна. Өнөөдрийн зорилго чинь юу вэ?",
    placeholder: "Жинд өдрийн төлөвлөгөө гаргуулах…",
    thinking: "Жин бодож байна…",
    quick: "Түргэн сонголт",
    prompts: ["Өдрийн 3 quest төлөвлө", "Энэ долоо хоногт юу сургах вэ?", "Фокус session санал болго", "Гэнэтийн санаа өг"],
    added: (n: number) => `⚔ ${n} quest нэмэгдлээ`,
    accepted: "Quest хүлээн авлаа",
    langLabel: "Хэл",
  },
} as const;

export const Route = createFileRoute("/_app/ai")({
  component: AIPage,
});

interface Msg {
  role: "user" | "assistant";
  content: string;
  suggestions?: { quest_id: string; title: string; xp_reward: number }[];
}

function AIPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("jin-lang") as Lang) ?? "en";
  });
  const t = T[lang];
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: T[typeof window !== "undefined" ? ((localStorage.getItem("jin-lang") as Lang) ?? "en") : "en"].greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("jin-lang", l);
    setMessages([{ role: "assistant", content: T[l].greeting }]);
  };

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
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-planner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "x-user-token": session?.access_token ?? "",
          },
          body: JSON.stringify({
            messages: next.map((m) => ({ role: m.role, content: m.content })),
            language: lang,
          }),
        },
      );
      const data = await resp.json();
      if (!resp.ok || data?.error) throw new Error(data?.error ?? `HTTP ${resp.status}`);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "(no reply)", suggestions: data.suggestions },
      ]);
      if (data?.assigned?.length) {
        toast.success(t.added(data.assigned.length));
        await refreshProfile();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI request failed";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: `⚠ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (qid: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_quests").insert({ user_id: user.id, quest_id: qid });
    if (error) { toast.error(error.message); return; }
    toast.success(t.accepted);
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6 flex flex-col sm:flex-row gap-6 items-center">
        <img src={aiAssistant} alt="Jin" width={96} height={96}
          className="w-24 h-24 rounded-full object-cover border border-primary/40 animate-pulse-glow" loading="lazy" />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">{t.badge}</p>
          <h1 className="text-3xl font-bold glow-text">JIN — Smart Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.subtitle(profile?.level, profile?.xp, profile?.xp_to_next)}
          </p>
        </div>
        {/* Language toggle — visible top-right */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-1">
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

      <div className="grid lg:grid-cols-[1fr,200px] gap-4">
        <div className="glass-panel frame-corner p-4 lg:p-6 flex flex-col" style={{ minHeight: 480 }}>
          <div ref={scroller} className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[60vh]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  m.role === "user"
                    ? "bg-accent/40 border border-primary/40"
                    : "bg-secondary/40 border border-border"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.suggestions.map((s) => (
                        <button
                          key={s.quest_id}
                          onClick={() => acceptSuggestion(s.quest_id)}
                          className="w-full flex items-center justify-between text-xs px-3 py-2 rounded border border-primary/40 hover:bg-accent/30 transition"
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
            {loading && (
              <div className="text-sm text-muted-foreground italic">{t.thinking}</div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 bg-input/60 border border-border rounded-md px-3 py-2 text-sm"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="btn-glow px-4 py-2 rounded-md font-semibold disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="glass-panel frame-corner p-4 space-y-2 h-fit">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t.quick}</p>
          {t.prompts.map((p) => (
            <button key={p} onClick={() => void send(p)}
              className="w-full text-left text-xs px-3 py-2 rounded border border-border hover:bg-secondary/40 transition flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary-glow" /> {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
