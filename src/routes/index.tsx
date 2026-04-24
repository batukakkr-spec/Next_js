import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import heroBg from "@/assets/hero-bg.jpg";
import aiAssistant from "@/assets/ai-trainer.webp";
import heroWarrior from "@/assets/hero-warrior.png";
import {
  Dumbbell, Trophy, Brain, Swords, HeartPulse, Flame,
  Activity, BarChart3, Target, Zap, Shield, Sparkles,
  ArrowRight, CheckCircle2, Github, Twitter, Instagram, Mail,
  Users, TrendingUp, Headphones,
} from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden scroll-smooth">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          className="w-full h-[80vh] object-cover opacity-25"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        <div className="absolute inset-0 scanline opacity-30" />
        {/* Floating glow blobs */}
        <div className="absolute top-[10%] -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-[40%] -right-32 w-[32rem] h-[32rem] rounded-full bg-accent/25 blur-[140px] animate-pulse-glow" style={{ animationDelay: "1.2s" }} />
        <div className="absolute bottom-[5%] left-1/3 w-[24rem] h-[24rem] rounded-full bg-primary-glow/20 blur-[120px] animate-pulse-glow" style={{ animationDelay: "2.4s" }} />
      </div>

      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between p-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 hex-cut btn-glow flex items-center justify-center">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-bold tracking-[0.3em] glow-text">XuchTrack</span>
            <p className="system-label text-[9px] text-primary-glow/80">▸ Fitness Tracking System</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <a href="#features" className="hidden md:inline text-xs uppercase tracking-widest text-muted-foreground hover:text-primary-glow transition-colors">Features</a>
          <a href="#preview" className="hidden md:inline text-xs uppercase tracking-widest text-muted-foreground hover:text-primary-glow transition-colors">Preview</a>
          <a href="#benefits" className="hidden md:inline text-xs uppercase tracking-widest text-muted-foreground hover:text-primary-glow transition-colors">Benefits</a>
          <Link to="/register" className="px-4 py-2 text-xs uppercase tracking-widest hex-cut btn-glow font-medium">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-12 lg:pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-float-up">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 hex-cut border border-primary/50 bg-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-pulse" />
            <p className="system-label text-[10px] text-primary-glow">▸ New • AI Trainer v2</p>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black glow-text leading-[0.95]">
            Track your fitness.<br />
            <span className="text-primary-glow">Transform</span> your body.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
            XuchTrack is an AI-powered fitness companion that turns workouts, nutrition, and
            daily habits into measurable progress — all in one beautifully simple dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-glow px-6 py-3 rounded-md font-semibold tracking-wider inline-flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="px-6 py-3 rounded-md border border-primary/40 hover:bg-secondary/40 transition-colors">
              See how it works
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
            {[
              { n: "120K+", l: "Active Users" },
              { n: "4.9★", l: "App Rating" },
              { n: "AI", l: "Smart Coach" },
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
              alt="XuchTrack AI Coach preview"
              className="w-full h-auto"
              width={768}
              height={1024}
            />
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background/70 to-transparent">
              <p className="system-label text-[10px] text-primary-glow">▸ AI Coach Online</p>
              <p className="text-2xl font-bold glow-text">XUCH.AI</p>
              <p className="text-sm text-muted-foreground">Your personal fitness strategist.</p>
            </div>
            <div className="absolute top-3 left-3 system-label text-[9px] text-primary-glow animate-flicker">
              [ LIVE • SYNCED ]
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="system-label text-[10px] text-primary-glow mb-3">▸ Core Features</p>
          <h2 className="text-3xl lg:text-5xl font-bold glow-text mb-4">
            Everything you need to win the day
          </h2>
          <p className="text-muted-foreground">
            Workouts, nutrition, recovery and motivation — unified in a single, focused experience.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { i: Dumbbell, t: "Workout Planning", d: "Custom routines tailored to your goals, experience and available equipment." },
            { i: Activity, t: "Calorie Tracking", d: "Log meals fast with smart suggestions and a growing nutrition database." },
            { i: BarChart3, t: "Progress Analytics", d: "Beautiful charts that reveal trends in strength, weight and consistency." },
            { i: Brain, t: "AI Smart Coach", d: "An adaptive trainer that adjusts your plan based on performance and recovery." },
            { i: Target, t: "Goal System", d: "Set weekly targets, track streaks and celebrate every milestone." },
            { i: HeartPulse, t: "Habits & Recovery", d: "Hydration, sleep and focus tracking to keep your body primed." },
          ].map((f) => (
            <div key={f.t} className="glass-panel frame-corner p-6 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 hex-cut bg-primary/15 border border-primary/50 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                <f.i className="w-5 h-5 text-primary-glow" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-wider">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App Preview */}
      <section id="preview" className="container mx-auto px-6 py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="system-label text-[10px] text-primary-glow mb-3">▸ Inside the App</p>
          <h2 className="text-3xl lg:text-5xl font-bold glow-text mb-4">
            A dashboard you'll actually open
          </h2>
          <p className="text-muted-foreground">
            Clean, focused, and built for the rhythm of a real training week.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -inset-12 bg-gradient-to-tr from-primary/20 via-accent/20 to-primary-glow/20 blur-3xl -z-10" />
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { t: "Today's Plan", v: "5 / 7", l: "tasks complete", icon: Target },
              { t: "Weekly Volume", v: "12,480 kg", l: "+8% vs last week", icon: BarChart3 },
              { t: "Streak", v: "23 days", l: "personal best", icon: Flame },
            ].map((c) => (
              <div key={c.t} className="glass-panel frame-corner p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="system-label text-[10px] text-muted-foreground">{c.t}</p>
                  <c.icon className="w-4 h-4 text-primary-glow" />
                </div>
                <p className="text-4xl font-bold glow-text">{c.v}</p>
                <p className="text-xs text-muted-foreground mt-2">{c.l}</p>
                <div className="xp-bar mt-5"><div style={{ width: "72%" }} /></div>
              </div>
            ))}
          </div>

          <div className="mt-6 glass-panel frame-corner p-6 lg:p-10">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="system-label text-[10px] text-primary-glow mb-3">▸ Live Session</p>
                <h3 className="text-2xl lg:text-3xl font-bold glow-text mb-3">Push Day · Upper Body</h3>
                <p className="text-muted-foreground mb-6">
                  Real-time set tracking, rest timers, and AI form tips as you go. Your coach
                  adapts the next session based on how today felt.
                </p>
                <div className="space-y-3">
                  {[
                    { n: "Bench Press", s: "4 × 8", k: "62 kg" },
                    { n: "Overhead Press", s: "3 × 10", k: "40 kg" },
                    { n: "Cable Fly", s: "3 × 12", k: "18 kg" },
                  ].map((e) => (
                    <div key={e.n} className="flex items-center justify-between py-2 border-b border-primary/15 last:border-0">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-primary-glow" />
                        <span className="text-sm">{e.n}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{e.s}</span>
                        <span className="text-primary-glow font-mono">{e.k}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl" />
                <img
                  src={aiAssistant}
                  alt="Workout dashboard preview"
                  className="relative w-full h-auto rounded-md hex-cut"
                  loading="lazy"
                  width={768}
                  height={1024}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="container mx-auto px-6 py-24 scroll-mt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ Why XuchTrack</p>
            <h2 className="text-3xl lg:text-5xl font-bold glow-text mb-6">
              Built for results.<br />Designed for life.
            </h2>
            <p className="text-muted-foreground mb-8">
              No bloat. No noise. Just the tools that actually move the needle, wrapped in
              an interface that feels effortless on every device.
            </p>
            <ul className="space-y-4">
              {[
                { i: Zap, t: "Effortless logging", d: "Track a full workout in under 30 seconds." },
                { i: Sparkles, t: "Motivation that sticks", d: "Streaks, badges, and gentle nudges that respect your time." },
                { i: Shield, t: "Private by default", d: "Your data is encrypted and never sold. Ever." },
                { i: Trophy, t: "Real measurable progress", d: "See exactly what's working — and what's not." },
              ].map((b) => (
                <li key={b.t} className="flex gap-4">
                  <div className="w-10 h-10 hex-cut bg-primary/15 border border-primary/50 flex items-center justify-center shrink-0">
                    <b.i className="w-4 h-4 text-primary-glow" />
                  </div>
                  <div>
                    <p className="font-semibold tracking-wide">{b.t}</p>
                    <p className="text-sm text-muted-foreground">{b.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "92%", l: "users hit weekly goals" },
              { n: "3×", l: "more consistent training" },
              { n: "−12%", l: "average body fat / 12 wk" },
              { n: "<30s", l: "to log a full workout" },
            ].map((s) => (
              <div key={s.l} className="glass-panel frame-corner p-6 text-center">
                <p className="text-4xl font-black glow-text">{s.n}</p>
                <p className="text-xs text-muted-foreground mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-24">
        <div className="relative glass-panel frame-corner p-10 lg:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-accent/10 to-primary-glow/15" />
          <Swords className="w-10 h-10 text-primary-glow mx-auto mb-5" />
          <h2 className="text-3xl lg:text-5xl font-bold glow-text mb-4">
            Start tracking. Start winning.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of athletes building stronger bodies and better habits with XuchTrack.
            Free to start, no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-glow px-8 py-4 rounded-md font-semibold tracking-wider inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-md border border-primary/40 hover:bg-secondary/40 transition-colors">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 mt-12">
        <div className="container mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 hex-cut btn-glow flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="font-bold tracking-[0.3em] glow-text">XuchTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Modern fitness tracking for people who want real results.
            </p>
          </div>
          <div>
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ Product</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary-glow transition-colors">Features</a></li>
              <li><a href="#preview" className="hover:text-primary-glow transition-colors">Preview</a></li>
              <li><a href="#benefits" className="hover:text-primary-glow transition-colors">Benefits</a></li>
            </ul>
          </div>
          <div>
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ Company</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>About</li>
              <li>Privacy</li>
              <li><a href="mailto:hello@xuchtrack.app" className="hover:text-primary-glow transition-colors inline-flex items-center gap-1"><Mail className="w-3 h-3" /> hello@xuchtrack.app</a></li>
            </ul>
          </div>
          <div>
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ Follow</p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Github].map((I, i) => (
                <a key={i} href="#" aria-label="social" className="w-9 h-9 hex-cut border border-primary/40 flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <I className="w-4 h-4 text-primary-glow" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-primary/15 py-5 text-center system-label text-[10px] text-muted-foreground">
          XuchTrack © {new Date().getFullYear()} — Train smarter, not harder.
        </div>
      </footer>
    </div>
  );
}
