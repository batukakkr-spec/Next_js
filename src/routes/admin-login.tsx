"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function getAdminLoginErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (!message) return "Admin login failed. Please try again.";
  if (normalized.includes("invalid login credentials")) {
    return "Admin email эсвэл нууц үг буруу байна.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Admin email баталгаажаагүй байна.";
  }
  if (normalized.includes("missing supabase server environment variables")) {
    return "Server admin тохиргоо дутуу байна. SUPABASE_SERVICE_ROLE_KEY нэмэх хэрэгтэй.";
  }
  if (normalized.includes("still a placeholder")) {
    return "SUPABASE_SERVICE_ROLE_KEY дээр placeholder байна. Supabase Dashboard-оос жинхэнэ service_role key хий.";
  }
  if (normalized.includes("publishable key")) {
    return "SUPABASE_SERVICE_ROLE_KEY дээр буруу key тавигдсан байна. service_role key хийх хэрэгтэй.";
  }
  if (normalized.includes("invalid api key")) {
    return "SUPABASE_SERVICE_ROLE_KEY буруу байна. Supabase Dashboard-оос service_role key-гээ дахин хуулж хийнэ үү.";
  }
  if (normalized.includes("service_role")) {
    return "Server admin key буруу эсвэл дутуу байна.";
  }
  if (normalized.includes("an admin already exists")) {
    return "Admin аль хэдийн үүссэн байна. Шинэ admin нэмэх бол одоогийн admin panel-аас эрх олгоно.";
  }
  if (normalized.includes("admin bootstrap is disabled")) {
    return "Claim First Admin идэвхгүй байна. `.env` файл дээр `ADMIN_BOOTSTRAP_SECRET` тохируулна уу.";
  }
  if (normalized.includes("invalid admin setup code")) {
    return "Admin setup code буруу байна.";
  }
  if (normalized.includes("authentication required")) {
    return "Эхлээд нэвтэрсэн session хэрэгтэй байна.";
  }

  return message;
}

async function hasAdminRole(userId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    if ((roles ?? []).some((role) => role.role === "admin")) {
      return true;
    }

    if (attempt < 2) {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
  }

  return false;
}

async function signInWithAdminCredentials(credentials: { email: string; password: string }) {
  const { data: auth, error } = await supabase.auth.signInWithPassword(credentials);
  if (error || !auth.user) {
    throw new Error(getAdminLoginErrorMessage(error?.message ?? "Sign-in failed"));
  }
  return auth.user;
}

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const message = parsed.error.issues[0].message;
      setErrorText(message);
      toast.error(message);
      return;
    }

    const credentials = {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
    };

    setErrorText(null);
    setLoading(true);
    try {
      await supabase.auth.signOut().catch(() => {});
      const user = await signInWithAdminCredentials(credentials);
      const isAdmin = await hasAdminRole(user.id);

      if (!isAdmin) {
        await supabase.auth.signOut().catch(() => {});
        const message = "Энэ account admin эрхгүй байна.";
        setErrorText(message);
        toast.error(message);
        return;
      }

      toast.success("Welcome, Administrator.");
      window.location.href = "/admin";
    } catch (e) {
      await supabase.auth.signOut().catch(() => {});
      const message =
        e instanceof Error ? getAdminLoginErrorMessage(e.message) : "Admin login failed.";
      setErrorText(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[radial-gradient(circle_at_18%_12%,oklch(0.7_0.18_240/0.14),transparent_38%),radial-gradient(circle_at_82%_22%,oklch(0.58_0.28_290/0.12),transparent_35%),linear-gradient(to_bottom,oklch(0.18_0.03_260),oklch(0.14_0.02_260))]">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border p-12 bg-[radial-gradient(circle_at_18%_18%,oklch(0.7_0.18_240/0.18),transparent_50%),radial-gradient(circle_at_82%_82%,oklch(0.65_0.2_280/0.16),transparent_48%)]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(to_right,oklch(0.7_0.18_240)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.7_0.18_240)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative">
          <BrandLogo size="md" />
        </div>

        <div className="relative max-w-xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-panel/80 px-4 py-2 backdrop-blur-md">
            <Shield className="h-4 w-4 text-primary-glow" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-primary-glow">
              Restricted Access
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black leading-[0.95] glow-text">
              ADMIN
              <br />
              COMMAND
              <br />
              GATE
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              Manage quests, review hunter progress, and control system access from the secure
              administrator console.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-panel frame-corner p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary-glow">Security</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Admin users are validated before console access is unlocked.
              </p>
            </div>
            <div className="glass-panel frame-corner p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary-glow">Control</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create quests, manage roles, and operate the hunter system from one place.
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-xs tracking-[0.3em] text-muted-foreground">
          ADMINISTRATOR NODE • XUCHTRACK SYSTEM
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo size="sm" />
          </div>

          <div className="glass-panel frame-corner animate-float-up p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary-glow" />
              <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">
                ▸ Restricted Access
              </p>
            </div>
            <h1 className="mb-2 text-3xl font-bold glow-text lg:text-4xl">ADMIN CONSOLE LOGIN</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Admin эрхтэй хэрэглэгч нэвтрэх эсвэл шинэ admin account үүсгэнэ.
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Admin Email
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
                    autoComplete="current-password"
                    aria-invalid={!!errorText}
                    className="w-full rounded-md border border-border bg-input/60 px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
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
                {loading ? "VERIFYING..." : "🛡 ENTER ADMIN ZONE"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Standard Hunter?{" "}
              <Link to="/login" className="text-primary-glow hover:underline">
                User login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
