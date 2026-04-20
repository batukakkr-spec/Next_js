import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import aiAssistant from "@/assets/ai-assistant.jpg";
import { Send, Sparkles, Sword } from "lucide-react";

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
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I am Jin, your System AI. I can analyze your level, propose a personalized quest plan, and assign quests for you. What's your goal today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

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
        toast.success(`⚔ ${data.assigned.length} quest(s) added`);
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
    toast.success("Quest accepted");
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6 flex flex-col sm:flex-row gap-6 items-center">
        <img src={aiAssistant} alt="Jin" width={96} height={96}
          className="w-24 h-24 rounded-full object-cover border border-primary/40 animate-pulse-glow" loading="lazy" />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ AI Companion</p>
          <h1 className="text-3xl font-bold glow-text">JIN — Smart Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lv.{profile?.level} Hunter · {profile?.xp}/{profile?.xp_to_next} XP
          </p>
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
              <div className="text-sm text-muted-foreground italic">Jin is thinking…</div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Jin to plan your day…"
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Quick prompts</p>
          {[
            "Plan my day with 3 quests",
            "What should I train this week?",
            "Suggest a focus session",
            "Surprise me",
          ].map((p) => (
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
