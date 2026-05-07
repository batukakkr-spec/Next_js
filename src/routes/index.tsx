"use client";

import Image from "next/image";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import heroBg from "@/assets/hero-bg.jpg";
import heroCharacter from "@/assets/xuchtrack-hero-character.png";
import appIcon from "@/assets/xuchtrack-app-icon.png";
import xHudImage from "@/assets/SDSAD.png";
import shadowCoachMascot from "@/assets/DASDADS.png";
import {
  Dumbbell,
  Trophy,
  Brain,
  Swords,
  HeartPulse,
  Flame,
  Activity,
  BarChart3,
  Target,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Github,
  Twitter,
  Instagram,
  Mail,
  Users,
  TrendingUp,
  Headphones,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const RANK_CLASSES: Record<string, string> = {
  SS: "rank-badge-ss",
  S: "rank-badge-s",
  A: "rank-badge-a",
  B: "rank-badge-b",
  C: "rank-badge-c",
  D: "rank-badge-d",
  E: "rank-badge-e",
};

const HERO_PARTICLES = [
  { x: "7%", y: "14%", s: 3, d: 0.0, dur: 3.4, p: false },
  { x: "88%", y: "9%", s: 2, d: 0.7, dur: 2.8, p: true },
  { x: "22%", y: "72%", s: 2, d: 1.5, dur: 3.7, p: false },
  { x: "76%", y: "66%", s: 3, d: 0.3, dur: 2.6, p: true },
  { x: "51%", y: "4%", s: 2, d: 1.1, dur: 3.2, p: false },
  { x: "4%", y: "52%", s: 2, d: 2.0, dur: 3.0, p: true },
  { x: "94%", y: "38%", s: 3, d: 0.5, dur: 2.9, p: false },
  { x: "37%", y: "89%", s: 2, d: 1.9, dur: 3.5, p: true },
  { x: "63%", y: "27%", s: 2, d: 2.3, dur: 2.7, p: false },
  { x: "17%", y: "36%", s: 3, d: 0.1, dur: 3.3, p: true },
  { x: "47%", y: "56%", s: 2, d: 1.4, dur: 3.8, p: false },
  { x: "83%", y: "80%", s: 2, d: 0.9, dur: 2.5, p: true },
] as const;

function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("reveal-shown");
          observer.unobserve(e.target);
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal-hidden").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden scroll-smooth">
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Image
          src={heroBg}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="w-full h-[90vh] object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/82 to-background" />
        <div className="absolute inset-0 scanline opacity-20" />
        <div className="absolute top-[8%] -left-40 h-[40rem] w-[40rem] rounded-full bg-primary/18 blur-[150px] animate-pulse-glow" />
        {/* Purple blob — right side matching X logo */}
        <div
          className="absolute top-[30%] -right-36 w-[44rem] h-[44rem] rounded-full blur-[160px] animate-pulse-glow"
          style={{ background: "oklch(0.46 0.20 296 / 0.20)", animationDelay: "1.6s" }}
        />
        <div
          className="absolute bottom-[5%] left-[28%] w-[30rem] h-[30rem] rounded-full bg-primary-glow/14 blur-[130px] animate-pulse-glow"
          style={{ animationDelay: "3.2s" }}
        />
        {/* Floating hero particles */}
        {HERO_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: `${p.s}px`,
              height: `${p.s}px`,
              background: p.p ? "oklch(0.72 0.20 302)" : "oklch(0.82 0.18 304)",
              boxShadow: p.p
                ? "0 0 10px oklch(0.72 0.20 302 / 0.85), 0 0 20px oklch(0.46 0.20 296 / 0.42)"
                : "0 0 10px oklch(0.82 0.18 304 / 0.82), 0 0 20px oklch(0.62 0.18 300 / 0.42)",
              animation: `particle-float ${p.dur}s ease-in-out ${p.d}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ── System Alert Banner ── */}
      <div className="relative z-20 border-b border-primary/20 bg-background/85 backdrop-blur-sm animate-system-scan overflow-hidden">
        <div className="container mx-auto px-6 py-2 flex items-center justify-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-pulse shrink-0 animate-flicker" />
          <p className="system-label text-[10px] text-primary-glow/90">
            ▸ [ SYSTEM ] AWAKENING EVENT DETECTED — SHADOW COACH v2.0 ONLINE — GATE STATUS:{" "}
            <span className="text-primary-glow animate-flicker">OPEN</span>
          </p>
          <Link
            to="/register"
            className="hidden sm:inline-flex items-center gap-1 system-label text-[10px] text-primary-glow underline underline-offset-2 hover:text-foreground transition-colors shrink-0"
          >
            Arise <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Nav ── */}
      <header className="container mx-auto flex items-center justify-between px-6 py-5 relative z-10">
        <BrandLogo size="md" className="max-w-full" />
        <nav className="flex items-center gap-6 lg:gap-8">
          <a
            href="#features"
            className="hidden md:inline text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary-glow transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hidden md:inline text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary-glow transition-colors"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="hidden md:inline text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary-glow transition-colors"
          >
            Pricing
          </a>
          <a
            href="#about"
            className="hidden md:inline text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary-glow transition-colors"
          >
            About
          </a>
          <Link
            to="/login"
            className="hidden md:inline text-xs uppercase tracking-[0.3em] text-foreground border-b-2 border-primary-glow pb-1 hover:text-primary-glow transition-colors"
          >
            Log In
          </Link>
          <span className="hidden md:inline h-6 w-px bg-primary/30" />
          <Link
            to="/register"
            className="px-5 py-2.5 text-xs uppercase tracking-[0.3em] hex-cut btn-glow font-bold"
          >
            Start Free Trial
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-7.5rem)] container mx-auto px-6 pt-6 lg:pt-8 pb-20 grid lg:grid-cols-[0.92fr_1.08fr] gap-10 lg:gap-4 items-center">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.52 0.16 294) 1px, transparent 1px), linear-gradient(90deg, oklch(0.52 0.16 294) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Left content */}
        <div className="animate-float-up relative z-10 space-y-8 lg:pr-6">
          {/* Hero badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-panel/85 px-4 py-2 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-primary-glow animate-pulse" />
            <p className="system-label text-[10px] text-primary-glow/90">
              AI-Powered Fitness Coach
            </p>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl xl:text-8xl font-black leading-[0.92] tracking-tight">
            <span className="block text-foreground/90">Train smarter.</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, oklch(0.88 0.18 304) 0%, oklch(0.70 0.18 300) 45%, oklch(0.50 0.22 296) 100%)",
                filter: "drop-shadow(0 0 48px oklch(0.52 0.18 294 / 0.62))",
              }}
            >
              Track every rep.
            </span>
            <span
              className="block glitch"
              data-text="Transform your body."
              style={{ color: "oklch(0.97 0.02 220)" }}
            >
              Transform your body.
            </span>
          </h1>

          <p className="text-base lg:text-lg text-muted-foreground max-w-xl leading-relaxed">
            XuchTrack uses AI to create personalized workout plans, track your progress, and help
            you build unbreakable discipline every day.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="btn-glow px-7 py-3.5 text-sm uppercase tracking-[0.2em] hex-cut font-bold inline-flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#system"
              className="px-7 py-3.5 text-sm uppercase tracking-[0.2em] hex-cut border border-primary/40 hover:bg-secondary/40 transition-colors inline-flex items-center gap-2"
            >
              View Demo <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-x-5 gap-y-3 pt-1 mb-6">
            {[
              { i: Brain, l: "AI Coach" },
              { i: Dumbbell, l: "Workout Tracking" },
              { i: BarChart3, l: "Progress Analytics" },
              { i: HeartPulse, l: "Nutrition Tracker" },
              { i: Target, l: "Discipline System" },
            ].map((c) => (
              <div key={c.l} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-6 h-6 hex-cut border border-primary/40 bg-primary/10 flex items-center justify-center">
                  <c.i className="w-3 h-3 text-primary-glow" />
                </div>
                <span>{c.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Warrior */}
        <div
          className="relative animate-float-up flex items-center justify-center lg:justify-end lg:scale-[1.04]"
          style={{ animationDelay: "160ms" }}
        >
          {/* Aura — blue core, purple outer edge (matches X logo + mascot) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[150%] h-[150%] rounded-full blur-3xl animate-pulse-glow"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.7 0.25 230 / 0.55) 0%, oklch(0.65 0.28 270 / 0.28) 34%, oklch(0.58 0.28 290 / 0.16) 56%, transparent 74%)",
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="hero-gate" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="energy-beam absolute left-[18%] top-[14%] h-[42%] w-px" />
            <div
              className="energy-beam absolute right-[18%] top-[10%] h-[50%] w-px"
              style={{ animationDelay: "1.2s" }}
            />
            <div
              className="energy-beam absolute right-[30%] bottom-[8%] h-[38%] w-px"
              style={{ animationDelay: "2.1s" }}
            />
          </div>
          {/* Tech rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[90%] aspect-square rounded-full border border-primary/14 animate-[spin_75s_linear_infinite]" />
            <div
              className="absolute w-[70%] aspect-square rounded-full"
              style={{ border: "1px solid oklch(0.85 0.22 215 / 0.20)" }}
            />
            <div
              className="absolute w-[52%] aspect-square rounded-full animate-[spin_45s_linear_infinite_reverse]"
              style={{ border: "1px solid oklch(0.70 0.28 290 / 0.28)" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="orbital orbital-a" />
            <div className="orbital orbital-b" />
          </div>
          <div className="absolute top-[14%] left-[2%] glass-panel frame-corner px-3 py-3 z-10 hidden sm:flex items-center gap-3 animate-float-gentle">
            <div>
              <p className="system-label text-[8px] text-muted-foreground mb-1">Hunter Class</p>
              <BrandLogo size="sm" className="scale-[0.95] origin-left" />
            </div>
          </div>
          {/* Floating rank card */}
          <div
            className="absolute top-[8%] right-[4%] glass-panel frame-corner px-3 py-2.5 z-10 animate-float-gentle"
            style={{ animationDelay: "1.1s" }}
          >
            <p className="system-label text-[9px] text-muted-foreground mb-1.5">HUNTER RANK</p>
            <p
              className="text-2xl font-black rank-badge-ss"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              SS
            </p>
          </div>
          {/* Floating XP card */}
          <div
            className="absolute bottom-[16%] left-[2%] z-10 min-w-[188px] animate-float-gentle overflow-visible"
            style={{ animationDelay: "2.4s" }}
          >
            <div className="level-tile relative overflow-visible">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="system-label text-[8px] text-muted-foreground mb-1">
                    Current Level
                  </p>
                  <p className="text-[13px] font-semibold text-white tracking-[0.18em] uppercase">
                    LVL <span className="text-primary-glow text-lg font-black">99</span>
                  </p>
                </div>
                <span className="level-orb" />
              </div>
              <span
                className="animate-level-rise absolute top-1 right-0 pointer-events-none system-label text-[8px]"
                style={{ color: "oklch(0.88 0.22 215)" }}
              >
                +1 LVL
              </span>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>47,820 XP</span>
                <span className="text-primary-glow">Rank Up</span>
              </div>
              <div className="xp-bar mt-2">
                <div style={{ width: "78%" }} />
              </div>
            </div>
          </div>
          {/* App icon floating badge */}
          <div
            className="absolute bottom-[14%] right-[4%] z-10 flex flex-col items-center gap-1.5 animate-float-gentle"
            style={{ animationDelay: "1.8s" }}
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl blur-md"
                style={{ background: "oklch(0.58 0.28 290 / 0.55)" }}
              />
              <Image
                src={appIcon}
                alt="XuchTrack App"
                width={56}
                height={56}
                sizes="56px"
                className="relative w-14 h-14 object-cover rounded-2xl"
                style={{
                  boxShadow:
                    "0 0 20px oklch(0.58 0.28 290 / 0.7), 0 0 40px oklch(0.70 0.28 290 / 0.3)",
                }}
              />
            </div>
            <p className="system-label text-[8px] text-primary-glow/70">APP ICON</p>
          </div>
          {/* X HUD portal — ambient glow layer behind warrior */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image
              src={xHudImage}
              alt=""
              aria-hidden="true"
              width={950}
              height={950}
              sizes="(max-width: 1024px) 100vw, 950px"
              loading="lazy"
              className="hero-board-backdrop w-[100%] max-w-[950px] h-auto animate-pulse-glow"
              style={{ animationDelay: "0.8s" }}
            />
          </div>
          <Image
            src={heroCharacter}
            alt="XuchTrack neon hunter warrior"
            priority
            sizes="(max-width: 1024px) 100vw, 940px"
            className="hero-character relative w-full max-w-[860px] lg:max-w-[940px] h-auto"
            width={1024}
            height={1024}
          />
        </div>

        {/* Stats bar */}
        <div className="lg:col-span-2 relative z-10 mt-4 lg:mt-0 lg:absolute lg:bottom-6 lg:left-6 lg:right-6">
          <div className="glass-panel frame-corner grid grid-cols-2 md:grid-cols-4 gap-3 p-5 lg:p-6 backdrop-blur-xl bg-background/60 border border-primary/25">
            {[
              { i: Dumbbell, n: "10M+", l: "Workouts Logged" },
              { i: Users, n: "500K+", l: "Active Hunters" },
              { i: TrendingUp, n: "95%", l: "Goal Success Rate" },
              { i: Headphones, n: "24/7", l: "AI Coach Online" },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`flex items-center gap-4 px-3 ${i > 0 ? "md:border-l md:border-primary/20" : ""}`}
              >
                <s.i className="w-6 h-6 text-primary-glow shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-2xl lg:text-3xl font-black glow-text leading-none">{s.n}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
                    {s.l}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shadow Coach ── */}
      <section className="container mx-auto px-6 py-20 defer-section">
        <div className="relative glass-panel frame-corner overflow-hidden">
          {/* ai-assistant.jpg as ambient background */}
          <div className="absolute inset-0 -z-10">
            <Image
              src={heroBg}
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              className="w-full h-full object-cover opacity-[0.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center p-8 lg:p-14">
            {/* Mascot */}
            <div className="relative flex items-center justify-center order-last lg:order-first py-6">
              {/* Purple aura - Shadow Coach signature */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[75%] h-[75%] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.28_290/0.55)_0%,oklch(0.55_0.22_260/0.25)_45%,transparent_70%)] blur-2xl animate-pulse-glow" />
              </div>
              {/* Outer ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[60%] aspect-square rounded-full border border-accent/30 animate-[spin_50s_linear_infinite]" />
                <div className="absolute w-[45%] aspect-square rounded-full border border-accent/20" />
              </div>
              <Image
                src={appIcon}
                alt="Shadow Coach — AI Fitness Companion"
                width={512}
                height={512}
                sizes="(max-width: 1024px) 80vw, 380px"
                className="relative w-full max-w-[380px] h-auto rounded-[2rem] drop-shadow-[0_0_80px_oklch(0.55_0.28_290/0.85)]"
                loading="lazy"
              />
            </div>

            {/* Content */}
            <div className="reveal-hidden space-y-6">
              <div>
                <p className="system-label text-[10px] text-primary-glow mb-3">
                  ▸ Meet Your AI Companion
                </p>
                <h2 className="text-3xl lg:text-5xl font-bold mb-2">
                  <span className="text-foreground">Shadow</span>{" "}
                  <span className="bg-gradient-to-r from-accent via-primary to-primary-glow bg-clip-text text-transparent drop-shadow-[0_0_30px_oklch(0.6_0.22_260/0.6)]">
                    Coach
                  </span>
                </h2>
                <p className="system-label text-[10px] text-accent/80 tracking-[0.3em]">
                  AI FITNESS COMPANION
                </p>
              </div>

              <blockquote className="border-l-2 border-accent/60 pl-5 space-y-0.5">
                <p className="text-lg text-foreground/90 italic leading-snug">
                  "I'm not just your coach.
                </p>
                <p className="text-lg text-foreground/90 italic leading-snug">I'm your shadow.</p>
                <p className="text-lg text-primary-glow italic leading-snug font-semibold">
                  I push you when you want to quit."
                </p>
              </blockquote>

              {/* Personality tags */}
              <div className="flex flex-wrap gap-2">
                {["Focused", "Loyal", "Relentless", "Supportive", "Calm", "Determined"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 hex-cut border border-accent/35 bg-accent/8 system-label text-[9px] text-accent/90 tracking-[0.2em]"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>

              {/* Role list */}
              <ul className="space-y-3 pt-1">
                {[
                  {
                    i: Brain,
                    t: "AI Fitness Coach",
                    d: "Analyzes every set, every meal, every night of sleep — then adapts.",
                  },
                  {
                    i: Shield,
                    t: "Guardian of Progress",
                    d: "Celebrates your milestones. Catches burnout before it catches you.",
                  },
                  {
                    i: Swords,
                    t: "Symbol of Discipline",
                    d: "Your shadow. Always watching. Always pushing. Never quitting.",
                  },
                ].map((item) => (
                  <li key={item.t} className="flex gap-3 items-start">
                    <div className="w-8 h-8 hex-cut bg-accent/12 border border-accent/40 flex items-center justify-center shrink-0 mt-0.5">
                      <item.i className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-wide">{item.t}</p>
                      <p className="text-xs text-muted-foreground">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 btn-glow px-6 py-3 text-sm uppercase tracking-[0.2em] hex-cut font-bold"
              >
                Meet Your Coach <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Skills / Features ── */}
      <section id="skills" className="container mx-auto px-6 py-28 scroll-mt-20 defer-section">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal-hidden">
          <p className="system-label text-[10px] text-primary-glow mb-3">▸ Hunter Skill Tree</p>
          <h2 className="text-3xl lg:text-5xl font-bold glow-text mb-4">Your Arsenal of Victory</h2>
          <p className="text-muted-foreground">
            Six core abilities unlocked at registration. Master them all and climb the global
            leaderboard.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              i: Brain,
              t: "AI Smart Coach",
              d: "An adaptive trainer that adjusts your program based on performance, recovery, and fatigue in real time.",
              rank: "S",
              rankClass: "rank-badge-s",
            },
            {
              i: BarChart3,
              t: "Progress Analytics",
              d: "Detailed charts that expose strength, body-weight, and consistency trends across any time window.",
              rank: "A",
              rankClass: "rank-badge-a",
            },
            {
              i: Dumbbell,
              t: "Workout Planning",
              d: "Custom routines built to your goals, experience level, and available equipment — updated as you grow.",
              rank: "A",
              rankClass: "rank-badge-a",
            },
            {
              i: Activity,
              t: "Calorie Tracking",
              d: "Log meals in seconds with smart autocomplete and a 2M+ item nutrition database.",
              rank: "B",
              rankClass: "rank-badge-b",
            },
            {
              i: Target,
              t: "Quest System",
              d: "Daily and weekly challenges that sustain momentum, build streaks, and unlock rank rewards.",
              rank: "B",
              rankClass: "rank-badge-b",
            },
            {
              i: HeartPulse,
              t: "Recovery & Habits",
              d: "Hydration, sleep, and focus tracking to keep your hunter status primed and injury-free.",
              rank: "B",
              rankClass: "rank-badge-b",
            },
          ].map((f, i) => (
            <div
              key={f.t}
              className="glass-panel frame-corner p-6 group hover:-translate-y-1.5 transition-transform duration-300 reveal-hidden"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 hex-cut bg-primary/12 border border-primary/45 flex items-center justify-center group-hover:bg-primary/22 transition-colors">
                  <f.i className="w-5 h-5 text-primary-glow" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="system-label text-[9px] text-muted-foreground">RANK</span>
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 hex-cut border text-[11px] font-black ${f.rankClass}`}
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    {f.rank}
                  </span>
                </div>
              </div>
              <h3 className="text-base font-bold mb-2 tracking-wider">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              <div className="mt-4 flex items-center gap-2 system-label text-[9px] text-primary-glow/60">
                <CheckCircle2 className="w-3 h-3" />
                SKILL UNLOCKED ON REGISTRATION
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hunter Rank Progression ── */}
      <section id="ranks" className="container mx-auto px-6 py-20 scroll-mt-20 defer-section">
        <div className="relative glass-panel frame-corner p-10 lg:p-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/8 via-accent/5 to-primary-glow/8" />
          <div className="absolute inset-0 scanline opacity-10 -z-10" />

          <div className="text-center mb-12 reveal-hidden">
            <p className="system-label text-[10px] text-primary-glow mb-3">
              ▸ Rank Progression System
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold glow-text mb-3">
              Every Hunter Starts at E-Rank
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The System records every rep, every meal, every night of sleep. Consistent effort is
              the only path to the top.
            </p>
          </div>

          {/* Rank ladder */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 lg:gap-0 reveal-hidden"
            style={{ transitionDelay: "140ms" }}
          >
            {[
              { r: "E", label: "Beginner", cls: "rank-badge-e", active: false },
              { r: "D", label: "Novice", cls: "rank-badge-d", active: false },
              { r: "C", label: "Trainee", cls: "rank-badge-c", active: false },
              { r: "B", label: "Warrior", cls: "rank-badge-b", active: false },
              { r: "A", label: "Elite", cls: "rank-badge-a", active: false },
              { r: "S", label: "Hunter", cls: "rank-badge-s", active: false },
              { r: "SS", label: "Shadow", cls: "rank-badge-ss", active: true },
            ].map((item, i) => (
              <div key={item.r} className="flex items-center">
                <div
                  className={`flex flex-col items-center gap-2 px-4 lg:px-6 py-3 transition-all duration-300 ${
                    item.active ? "scale-110" : "opacity-55 hover:opacity-85 hover:scale-105"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-12 h-12 hex-cut border-2 text-sm font-black ${item.cls}`}
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    {item.r}
                  </span>
                  <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
                    {item.label}
                  </span>
                </div>
                {i < 6 && (
                  <ChevronRight className="w-4 h-4 text-primary/35 shrink-0 hidden lg:block" />
                )}
              </div>
            ))}
          </div>

          {/* Steps */}
          <div
            className="mt-12 grid md:grid-cols-3 gap-5 reveal-hidden"
            style={{ transitionDelay: "260ms" }}
          >
            {[
              {
                n: "Train consistently",
                d: "Every logged workout earns XP and pushes your rank forward.",
              },
              {
                n: "Complete daily quests",
                d: "Bonus XP from nutrition goals, streak milestones and recovery logs.",
              },
              {
                n: "Reach the apex",
                d: "SS-Rank hunters sit atop the global leaderboard. Are you worthy?",
              },
            ].map((tip, i) => (
              <div
                key={tip.n}
                className="flex gap-3 p-4 hex-cut border border-primary/20 bg-primary/5"
              >
                <span
                  className="w-6 h-6 hex-cut bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0 text-[11px] font-black text-primary-glow"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold mb-1">{tip.n}</p>
                  <p className="text-xs text-muted-foreground">{tip.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Preview / System ── */}
      <section id="system" className="container mx-auto px-6 py-24 scroll-mt-20 defer-section">
        <div className="text-center max-w-2xl mx-auto mb-14 reveal-hidden">
          <p className="system-label text-[10px] text-primary-glow mb-3">▸ Hunter Status System</p>
          <h2 className="text-3xl lg:text-5xl font-bold glow-text mb-4">Your Command Center</h2>
          <p className="text-muted-foreground">
            Every stat, every quest, every milestone — displayed in your personal Hunter dashboard.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -inset-16 bg-gradient-to-tr from-primary/15 via-accent/15 to-primary-glow/15 blur-3xl -z-10" />
          <div className="grid lg:grid-cols-3 gap-5">
            {[
              { t: "Today's Quests", v: "5 / 7", l: "tasks complete", icon: Target, bar: 71 },
              {
                t: "Weekly Volume",
                v: "12,480 kg",
                l: "+8% vs last week",
                icon: BarChart3,
                bar: 80,
              },
              { t: "Hunter Streak", v: "23 days", l: "personal best", icon: Flame, bar: 65 },
            ].map((c, i) => (
              <div
                key={c.t}
                className="glass-panel frame-corner p-6 reveal-hidden"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="system-label text-[9px] text-muted-foreground">{c.t}</p>
                  <c.icon className="w-4 h-4 text-primary-glow" />
                </div>
                <p className="text-4xl font-bold glow-text">{c.v}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{c.l}</p>
                <div className="xp-bar mt-4">
                  <div style={{ width: `${c.bar}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-5 glass-panel frame-corner p-6 lg:p-10 reveal-hidden"
            style={{ transitionDelay: "200ms" }}
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="system-label text-[10px] text-primary-glow mb-3">▸ Active Quest</p>
                <h3 className="text-2xl lg:text-3xl font-bold glow-text mb-3">
                  Push Day · Upper Body
                </h3>
                <p className="text-muted-foreground mb-6">
                  Real-time set tracking, rest timers, and AI form tips as you go. Your coach adapts
                  the next session based on today's performance data.
                </p>
                <div className="space-y-3">
                  {[
                    { n: "Bench Press", s: "4 × 8", k: "62 kg", done: true },
                    { n: "Overhead Press", s: "3 × 10", k: "40 kg", done: true },
                    { n: "Cable Fly", s: "3 × 12", k: "18 kg", done: false },
                  ].map((e) => (
                    <div
                      key={e.n}
                      className="flex items-center justify-between py-2 border-b border-primary/15 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className={`w-4 h-4 ${e.done ? "text-primary-glow" : "text-primary/25"}`}
                        />
                        <span className={`text-sm ${e.done ? "" : "text-muted-foreground"}`}>
                          {e.n}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{e.s}</span>
                        <span className="text-primary-glow font-mono">{e.k}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative flex items-center justify-center py-3 lg:py-1">
                {/* Blue core aura */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-full h-full rounded-3xl blur-2xl animate-pulse-glow"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 55%, oklch(0.55 0.24 248 / 0.50) 0%, oklch(0.70 0.22 215 / 0.18) 45%, transparent 70%)",
                    }}
                  />
                </div>
                <Image
                  src={shadowCoachMascot}
                  alt="XuchTrack quest portal"
                  width={460}
                  height={460}
                  sizes="(max-width: 1024px) 90vw, 460px"
                  className="quest-preview-image relative w-full max-w-[460px] h-auto"
                  loading="lazy"
                />
                {/* AI status badge */}
                <div className="absolute bottom-3 right-3 glass-panel frame-corner px-3 py-2 z-10">
                  <p className="system-label text-[8px] text-muted-foreground mb-1">AI COACH</p>
                  <p className="text-sm font-black glow-text">ONLINE</p>
                  <p className="system-label text-[8px] text-primary-glow/70 mt-0.5">
                    ▸ ACTIVE QUEST
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hunter Field Reports (Testimonials) ── */}
      <section className="container mx-auto px-6 py-24 defer-section">
        <div className="text-center max-w-2xl mx-auto mb-14 reveal-hidden">
          <p className="system-label text-[10px] text-primary-glow mb-3">▸ Hunter Field Reports</p>
          <h2 className="text-3xl lg:text-4xl font-bold glow-text mb-4">Hunters Who Ascended</h2>
          <p className="text-muted-foreground">
            Verified results from the XuchTrack Hunter Registry.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              id: "HNT-4821",
              rank: "A",
              rankClass: "rank-badge-a",
              name: "Marcus K.",
              achievement: "+18 kg bench press in 10 weeks",
              quote:
                "The AI coach adjusted my program every single week. I went from plateauing to hitting PRs I never thought possible.",
              stats: [
                { l: "Streak", v: "47 days" },
                { l: "Vol/wk", v: "14.2 t" },
              ],
            },
            {
              id: "HNT-2934",
              rank: "S",
              rankClass: "rank-badge-s",
              name: "Aisha T.",
              achievement: "−12% body fat in 3 months",
              quote:
                "Calorie tracking finally clicked when the app gave real feedback instead of just numbers. Absolute game changer.",
              stats: [
                { l: "Streak", v: "89 days" },
                { l: "Quests", v: "312" },
              ],
            },
            {
              id: "HNT-7156",
              rank: "A",
              rankClass: "rank-badge-a",
              name: "Dmitri L.",
              achievement: "First marathon completed",
              quote:
                "Set the goal, followed the plan, hit the mission. The quest system kept me consistent even when motivation dropped.",
              stats: [
                { l: "Streak", v: "62 days" },
                { l: "XP", v: "42,800" },
              ],
            },
          ].map((t, i) => (
            <div
              key={t.id}
              className="glass-panel frame-corner p-6 flex flex-col gap-4 reveal-hidden hover:-translate-y-1.5 transition-transform duration-300"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="system-label text-[9px] text-muted-foreground">HUNTER ID: {t.id}</p>
                  <p className="font-semibold tracking-wide mt-0.5">{t.name}</p>
                </div>
                <span
                  className={`inline-flex items-center justify-center w-9 h-9 hex-cut border-2 text-sm font-black ${t.rankClass}`}
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {t.rank}
                </span>
              </div>
              <div className="px-3 py-2 hex-cut border border-primary/20 bg-primary/8">
                <p className="system-label text-[10px] text-primary-glow">▸ {t.achievement}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex gap-5 pt-2 border-t border-primary/15">
                {t.stats.map((s) => (
                  <div key={s.l}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {s.l}
                    </p>
                    <p className="text-sm font-bold glow-text">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="benefits" className="container mx-auto px-6 py-24 scroll-mt-20 defer-section">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal-hidden">
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ System Advantages</p>
            <h2 className="text-3xl lg:text-5xl font-bold glow-text mb-6">
              Built for results.
              <br />
              Designed for Hunters.
            </h2>
            <p className="text-muted-foreground mb-8">
              No bloat. No noise. Just the tools that move the needle — wrapped in an interface that
              feels effortless on every device.
            </p>
            <ul className="space-y-4">
              {[
                {
                  i: Zap,
                  t: "Instant logging",
                  d: "Track a full workout session in under 30 seconds.",
                },
                {
                  i: Sparkles,
                  t: "Motivation engine",
                  d: "Streaks, rank badges, and quest rewards that keep you moving.",
                },
                {
                  i: Shield,
                  t: "Private by default",
                  d: "Your data is end-to-end encrypted and never sold. Ever.",
                },
                {
                  i: Trophy,
                  t: "Measurable progress",
                  d: "See exactly what's working — and cut what isn't.",
                },
              ].map((b) => (
                <li key={b.t} className="flex gap-4">
                  <div className="w-10 h-10 hex-cut bg-primary/12 border border-primary/45 flex items-center justify-center shrink-0">
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
          <div
            className="grid grid-cols-2 gap-4 reveal-hidden"
            style={{ transitionDelay: "150ms" }}
          >
            {[
              { n: "92%", l: "hit weekly quests" },
              { n: "3×", l: "more consistent training" },
              { n: "−12%", l: "avg body fat / 12 wk" },
              { n: "<30s", l: "to log a full session" },
            ].map((s) => (
              <div
                key={s.l}
                className="glass-panel frame-corner p-6 text-center hover:scale-[1.03] transition-transform duration-200"
              >
                <p className="text-4xl font-black glow-text">{s.n}</p>
                <p className="text-xs text-muted-foreground mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="container mx-auto px-6 py-24 defer-section">
        <div className="relative glass-panel frame-corner p-10 lg:p-20 text-center overflow-hidden animate-gate-pulse reveal-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/12 via-accent/8 to-primary-glow/12" />
          <div className="absolute inset-0 scanline opacity-12 -z-10" />
          {/* Portal rings */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-primary/8 animate-[spin_90s_linear_infinite] -z-10 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-primary/6 -z-10 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 hex-cut border border-primary/40 bg-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary-glow animate-pulse" />
              <p className="system-label text-[11px] text-primary-glow">
                [ SYSTEM ] THE GATE IS NOW OPEN
              </p>
            </div>
            <Swords className="w-12 h-12 text-primary-glow mx-auto mb-5 drop-shadow-[0_0_24px_oklch(0.85_0.22_215/0.8)]" />
            <h2 className="text-3xl lg:text-6xl font-bold glow-text mb-4">
              Your Awakening
              <br />
              Awaits.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
              Thousands of Hunters have already answered the call. Free to start — no credit card
              required. No excuses.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="btn-glow px-10 py-4 text-sm uppercase tracking-[0.25em] hex-cut font-bold inline-flex items-center gap-2"
              >
                Arise & Register <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 text-sm uppercase tracking-[0.2em] hex-cut border border-primary/40 hover:bg-secondary/40 transition-colors"
              >
                Already a Hunter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-primary/15 mt-8">
        <div className="container mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <BrandLogo size="sm" className="mb-3" />
            <p className="text-sm text-muted-foreground">
              The Hunter System for those who refuse to stay at E-Rank.
            </p>
            <p className="system-label text-[9px] text-primary-glow/50 mt-2">HUNTER SYSTEM v2.0</p>
          </div>
          <div>
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ System</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#skills" className="hover:text-primary-glow transition-colors">
                  Skills
                </a>
              </li>
              <li>
                <a href="#ranks" className="hover:text-primary-glow transition-colors">
                  Rank Progression
                </a>
              </li>
              <li>
                <a href="#system" className="hover:text-primary-glow transition-colors">
                  Dashboard Preview
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ Guild</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>About</li>
              <li>Privacy Policy</li>
              <li>
                <a
                  href="mailto:hello@xuchtrack.app"
                  className="hover:text-primary-glow transition-colors inline-flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> hello@xuchtrack.app
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="system-label text-[10px] text-primary-glow mb-3">▸ Follow</p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="social"
                  className="w-9 h-9 hex-cut border border-primary/35 flex items-center justify-center hover:bg-primary/10 hover:border-primary/60 transition-all duration-200"
                >
                  <Icon className="w-4 h-4 text-primary-glow" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-primary/10 py-5 text-center">
          <p className="system-label text-[10px] text-muted-foreground">
            XuchTrack © {new Date().getFullYear()} —{" "}
            <span className="text-primary-glow/70">Arise. Train. Dominate.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
