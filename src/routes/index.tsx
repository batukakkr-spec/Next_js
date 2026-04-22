import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import heroBg from "@/assets/hero-bg.jpg";
import aiAssistant from "@/assets/ai-assistant.jpg";
import { Dumbbell, Sparkles, Trophy, Shield, Zap, Brain, Swords, HeartPulse, Flame } from "lucide-react";

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

      <div className="absolute inset-0 -z-10 scanline opacity-30 pointer-events-none" />
      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between p-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 hex-cut btn-glow flex items-center justify-center">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-bold tracking-[0.3em] glow-text">LEVELING</span>
            <p className="system-label text-[9px] text-primary-glow/80">▸ Hunter Fitness System</p>
          </div>
        </div>
        <nav className="flex gap-3">
          <Link to="/login" className="px-4 py-2 text-xs uppercase tracking-widest hex-cut border border-primary/40 hover:bg-primary/10">
            Re-enter
          </Link>
          <Link to="/register" className="px-4 py-2 text-xs uppercase tracking-widest hex-cut btn-glow font-medium">
            ⚔ Awaken
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-12 lg:pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-float-up">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 hex-cut border border-primary/50 bg-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-pulse" />
            <p className="system-label text-[10px] text-primary-glow">▸ System Notification</p>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black glow-text leading-none">
            ARISE.<br />LEVEL UP.<br />
            <span className="text-primary-glow">DOMINATE.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Real-world fitness, gamified like Solo Leveling. Complete push-up, run, and discipline
            quests, earn XP, ascend Hunter ranks, and let your AI Trainer forge your daily program.
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
              { n: "∞", l: "Hunter Levels" },
              { n: "AI", l: "Smart Trainer" },
            ].map((s) => (
              <div key={s.l} className="glass-panel frame-corner p-3 text-center">
                <p className="text-2xl font-bold glow-text">{s.n}</p>
                <p className="system-label text-[9px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-float-up">
          <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl" />
          <div className="relative glass-panel frame-corner overflow-hidden animate-system-scan">
            <img
              src={aiAssistant}
              alt="AI Assistant Hunter"
              className="w-full h-auto"
              width={768}
              height={1024}
            />
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background/70 to-transparent">
              <p className="system-label text-[10px] text-primary-glow">▸ AI Trainer Online</p>
              <p className="text-2xl font-bold glow-text">JIN-WOO.AI</p>
              <p className="text-sm text-muted-foreground">Your personal Hunter strategist.</p>
            </div>
            <div className="absolute top-3 left-3 system-label text-[9px] text-primary-glow animate-flicker">
              [ STATUS: ACTIVE ]
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <h2 className="text-3xl lg:text-4xl font-bold text-center glow-text mb-12">
          ▸ SYSTEM CAPABILITIES
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { i: Dumbbell, t: "Workout Quests", d: "Push-ups, runs, planks. Real-world fitness translated into XP-earning quests." },
            { i: HeartPulse, t: "Daily Discipline", d: "Hydration, sleep, focus. Build the habits of an S-Rank Hunter." },
            { i: Brain, t: "AI Smart Trainer", d: "An adaptive agent that designs your daily program based on your level and streak." },
            { i: Trophy, t: "Hunter Rankings", d: "Climb from E-Rank to S-Rank as you out-level other Hunters worldwide." },
            { i: Flame, t: "Streak System", d: "Skip a day, lose your streak. The System never forgives weakness." },
            { i: Swords, t: "Boss Challenges", d: "Weekly elite quests forged by Admins. Crush them for legendary XP." },
          ].map((f) => (
            <div key={f.t} className="glass-panel frame-corner p-6">
              <div className="w-12 h-12 hex-cut bg-primary/15 border border-primary/50 flex items-center justify-center mb-4">
                <f.i className="w-5 h-5 text-primary-glow" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-wider">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-primary/20 py-6 text-center system-label text-[10px] text-muted-foreground">
        LEVELING © {new Date().getFullYear()} — Indra Cyber Institute Final Project
      </footer>
    </div>
  );
}
