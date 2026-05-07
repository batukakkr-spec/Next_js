"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/google-auth";
import { toast } from "sonner";

async function googleSignUp() {
  const { error } = await signInWithGoogle("register");
  if (error) toast.error(error.message ?? "Google sign-up failed");
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ - only"),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});

function getRegisterErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (!message) return "Registration failed. Please try again.";
  if (normalized.includes("user already registered")) {
    return "Энэ email-ээр бүртгэлтэй account байна. Login хэсгээр нэвтэрнэ үү.";
  }
  if (normalized.includes("password should be at least")) {
    return "Нууц үг шаардлага хангахгүй байна. Илүү хүчтэй password оруулна уу.";
  }

  return message;
}

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ username, email, password });
    if (!parsed.success) {
      const message = parsed.error.issues[0].message;
      setErrorText(message);
      toast.error(message);
      return;
    }

    setErrorText(null);
    setLoading(true);

    try {
      const normalizedEmail = parsed.data.email.toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { username: parsed.data.username, display_name: parsed.data.username },
        },
      });

      if (error) {
        const message = getRegisterErrorMessage(error.message);
        setErrorText(message);
        toast.error(message);
        return;
      }

      if (data.session) {
        await supabase.auth.signOut().catch(() => {});
      }

      toast.success("Бүртгэл амжилттай. Одоо login хуудас руу шилжлээ.");
      window.location.href = `/login?email=${encodeURIComponent(normalizedEmail)}`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border p-12 bg-[radial-gradient(circle_at_18%_18%,oklch(0.7_0.18_240/0.18),transparent_50%),radial-gradient(circle_at_82%_82%,oklch(0.65_0.2_280/0.16),transparent_48%)]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(to_right,oklch(0.7_0.18_240)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.7_0.18_240)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative">
          <BrandLogo size="md" />
        </div>

        <div className="relative max-w-xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-panel/80 px-4 py-2 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-primary-glow animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-primary-glow">
              Awakening Ritual
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl xl:text-6xl font-black leading-[0.94] glow-text">
              ENTER THE
              <br />
              HUNTER
              <br />
              SYSTEM
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              Create your hunter identity, start your quest streak, and unlock the full XuchTrack
              progression system from day one.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-panel frame-corner p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary-glow">
                Daily Quests
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Earn XP every day through quests, streaks, and mission-based goals.
              </p>
            </div>
            <div className="glass-panel frame-corner p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary-glow">
                Smart Progress
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Track your growth with levels, achievements, ranks, and AI-assisted planning.
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-xs tracking-[0.3em] text-muted-foreground">
          HUNTER REGISTRY • XUCHTRACK SYSTEM
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-xl">
          <Link to="/" className="mb-8 flex justify-center lg:hidden">
            <BrandLogo size="sm" />
          </Link>
          <div className="glass-panel frame-corner animate-float-up p-8 lg:p-10">
            <p className="mb-2 text-xs uppercase tracking-[0.4em] text-primary-glow">
              ▸ Awakening Ritual
            </p>
            <h1 className="mb-2 text-3xl font-bold glow-text lg:text-4xl">JOIN THE HUNTERS</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Хэрэглэгчийн бүртгэл үүсгээд system рүү нэвтрэх хаалгаа нээ.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Hunter name
                </label>
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorText) setErrorText(null);
                  }}
                  required
                  autoComplete="username"
                  className="w-full rounded-md border border-border bg-input/60 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorText) setErrorText(null);
                  }}
                  required
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={!!errorText}
                  className="w-full rounded-md border border-border bg-input/60 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorText) setErrorText(null);
                    }}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!errorText}
                    className="w-full rounded-md border border-border bg-input/60 px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary-glow"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {errorText ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorText}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md py-3 font-semibold tracking-wider btn-glow disabled:opacity-50"
              >
                {loading ? "AWAKENING..." : "✨ AWAKEN"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={googleSignUp}
              className="w-full rounded-md border border-border bg-input/40 py-3 text-sm font-medium transition hover:bg-input/60 flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-1.9 1.4-4.3 2.2-7 2.2-5.3 0-9.7-3-11.4-7.3l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5.1c-.4.4 6.5-4.7 6.5-14.8 0-1.2-.1-2.3-.4-3.5z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already a Hunter?{" "}
              <Link to="/login" className="text-primary-glow hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
