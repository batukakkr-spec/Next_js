import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Eye, EyeOff, Sword, Shield, Trophy, Zap } from "lucide-react";

async function googleSignIn() {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}/dashboard`,
  });
  if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function getLoginErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (!message) return "Login failed. Please try again.";
  if (normalized.includes("invalid login credentials")) {
    return "Email эсвэл нууц үг буруу байна. Хэрэв шинэ хэрэглэгч бол эхлээд бүртгүүлнэ үү.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email хаяг баталгаажаагүй байна. Баталгаажуулсны дараа дахин нэвтэрнэ үү.";
  }
  if (normalized.includes("too many requests")) {
    return "Хэт олон оролдлого хийсэн байна. Түр хүлээгээд дахин оролдоно уу.";
  }

  return message;
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const message = parsed.error.issues[0].message;
      setErrorText(message);
      toast.error(message);
      return;
    }

    setErrorText(null);
    setLoading(true);

    try {
      const credentials = {
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
      };
      const { data: auth, error } = await supabase.auth.signInWithPassword(credentials);
      if (error || !auth.user) {
        const message = getLoginErrorMessage(error?.message);
        setErrorText(message);
        toast.error(message);
        return;
      }

      toast.success("Welcome back, Hunter.");
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT — Brand / Hero panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-border bg-[radial-gradient(circle_at_20%_20%,oklch(0.7_0.18_240/0.18),transparent_60%),radial-gradient(circle_at_80%_80%,oklch(0.65_0.2_280/0.15),transparent_55%)]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(to_right,oklch(0.7_0.18_240)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.7_0.18_240)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <Link to="/" className="relative flex items-center gap-2">
            <Sword className="w-7 h-7 text-primary-glow" />
            <span className="text-xl font-bold tracking-[0.3em] glow-text">XuchTrack</span>
          </Link>

          <div className="relative space-y-6 max-w-md">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Hunter System</p>
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight glow-text">
              Level up your real life — one quest at a time.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Track quests, gain XP, climb the leaderboard, and unlock achievements as you become a stronger version of yourself.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-md border border-primary/40 bg-accent/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-glow" />
                </div>
                <span className="text-muted-foreground">Daily quests &amp; streaks</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-md border border-primary/40 bg-accent/30 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-primary-glow" />
                </div>
                <span className="text-muted-foreground">Achievements &amp; ranks</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-md border border-primary/40 bg-accent/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-glow" />
                </div>
                <span className="text-muted-foreground">AI-powered smart planner</span>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-muted-foreground tracking-widest">
            © {new Date().getFullYear()} XUCHTRACK SYSTEM
          </p>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
        <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
          <Sword className="w-6 h-6 text-primary-glow" />
          <span className="font-bold tracking-widest glow-text">XuchTrack</span>
        </Link>
        <div className="glass-panel frame-corner p-8 animate-float-up">
          <p className="text-xs uppercase tracking-[0.4em] text-primary-glow mb-2">▸ System Login</p>
          <h1 className="text-2xl font-bold glow-text mb-6">RE-ENTER THE GATE</h1>

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</label>
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
                className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorText) setErrorText(null);
                  }}
                  required
                  autoComplete="current-password"
                  aria-invalid={!!errorText}
                  className="w-full bg-input/60 border border-border rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary-glow transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              className="w-full btn-glow py-3 rounded-md font-semibold tracking-wider disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "⚔ LOG IN"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={googleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-md border border-border bg-input/40 hover:bg-input/60 transition text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-1.9 1.4-4.3 2.2-7 2.2-5.3 0-9.7-3-11.4-7.3l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5.1c-.4.4 6.5-4.7 6.5-14.8 0-1.2-.1-2.3-.4-3.5z"/></svg>
            Continue with Google
          </button>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Not a Hunter yet?{" "}
            <Link to="/register" className="text-primary-glow hover:underline">Awaken now</Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
