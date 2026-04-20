import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import heroBg from "@/assets/hero-bg.jpg";
import aiAssistant from "@/assets/ai-assistant.jpg";
import { Sword, Sparkles, Trophy, Shield, Zap, Brain } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/dashboard" });
  }, [loading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroBg}
          alt="Mystical dungeon"
          className="w-full h-full object-cover opacity-40"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 scanline opacity-50" />
      </div>

      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <Sword className="w-6 h-6 text-primary-glow" />
          <span className="font-bold tracking-widest glow-text">LEVELING</span>
        </div>
        <nav className="flex gap-3">
          <Link to="/login" className="px-4 py-2 text-sm rounded-md border border-border hover:bg-secondary/50">
            Login
          </Link>
          <Link to="/register" className="px-4 py-2 text-sm rounded-md btn-glow font-medium">
            Awaken
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-12 lg:pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-float-up">
          <p className="text-xs uppercase tracking-[0.4em] text-primary-glow mb-4">
            ▸ System Notification
          </p>
          <h1 className="text-5xl lg:text-7xl font-black glow-text leading-none">
            ARISE.<br />LEVEL UP.<br />
            <span className="text-primary-glow">DOMINATE.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            A full-stack gamified quest system. Complete daily challenges, earn XP, ascend ranks,
            and let your AI companion forge a personalized growth plan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-glow px-6 py-3 rounded-md font-semibold tracking-wider">
              ⚔ ENTER THE SYSTEM
            </Link>
            <Link to="/login" className="px-6 py-3 rounded-md border border-primary/40 hover:bg-secondary/40">
              I am already a Hunter
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
            {[
              { n: "8+", l: "Daily Quests" },
              { n: "∞", l: "Levels" },
              { n: "AI", l: "Smart Planner" },
            ].map((s) => (
              <div key={s.l} className="glass-panel frame-corner p-3 text-center">
                <p className="text-2xl font-bold glow-text">{s.n}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-float-up">
          <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl" />
          <div className="relative glass-panel frame-corner overflow-hidden rounded-2xl">
            <img
              src={aiAssistant}
              alt="AI Assistant Hunter"
              className="w-full h-auto"
              width={768}
              height={1024}
            />
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background/70 to-transparent">
              <p className="text-xs uppercase tracking-[0.3em] text-primary-glow">AI Companion</p>
              <p className="text-2xl font-bold glow-text">JIN</p>
              <p className="text-sm text-muted-foreground">Your personal growth strategist.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <h2 className="text-3xl lg:text-4xl font-bold text-center glow-text mb-12">
          SYSTEM CAPABILITIES
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { i: Zap, t: "Daily Quests & XP", d: "Curated challenges across fitness, mind, study & focus. Earn XP, level up, evolve." },
            { i: Brain, t: "AI Smart Planner", d: "Tool-calling agent that designs a personal plan based on your level and history." },
            { i: Trophy, t: "Leaderboard & Ranks", d: "Compete with other Hunters. Climb the ranks. Unlock achievements." },
            { i: Shield, t: "RBAC Security", d: "Admin / Moderator / User roles. Row-level security on every table." },
            { i: Sparkles, t: "Achievements", d: "Unlock badges for streaks, milestones, and quest mastery." },
            { i: Sword, t: "Quest Catalog", d: "Admins forge new quests with categories, difficulty and XP rewards." },
          ].map((f) => (
            <div key={f.t} className="glass-panel frame-corner p-6">
              <f.i className="w-8 h-8 text-primary-glow mb-4" />
              <h3 className="text-lg font-bold mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        LEVELING © {new Date().getFullYear()} — Indra Cyber Institute Final Project
      </footer>
    </div>
  );
}
