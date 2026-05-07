"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/user-roles";
import { toast } from "sonner";

const GOOGLE_REGISTERED_KEY = "google_registered";

async function hasGoogleRegistration(userId: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user?.id === userId && user.user_metadata?.[GOOGLE_REGISTERED_KEY] === true;
}

async function ensureGoogleRegistration(userId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (user?.id !== userId) {
    throw new Error("Google registration user mismatch.");
  }

  if (user.user_metadata?.[GOOGLE_REGISTERED_KEY] === true) {
    return;
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      [GOOGLE_REGISTERED_KEY]: true,
    },
  });

  if (error) {
    throw error;
  }
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const params = searchParams ?? new URLSearchParams();
      const code = params.get("code");
      const error = params.get("error_description") ?? params.get("error");
      const next = params.get("next") || "/dashboard";
      const mode = params.get("mode") === "register" ? "register" : "login";

      if (error) {
        toast.error(error);
        router.replace(mode === "register" ? "/register" : "/login");
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          toast.error(exchangeError.message || "Google authentication failed.");
          router.replace(mode === "register" ? "/register" : "/login");
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError || !data.session) {
        toast.error(sessionError?.message || "Google authentication failed.");
        router.replace(mode === "register" ? "/register" : "/login");
        return;
      }

      if (mode === "register") {
        try {
          await ensureGoogleRegistration(data.session.user.id);
        } catch (registrationError) {
          await supabase.auth.signOut().catch(() => {});
          if (cancelled) return;

          const message =
            registrationError instanceof Error
              ? registrationError.message
              : "Google registration could not be completed.";
          toast.error(message);
          router.replace("/register");
          return;
        }

        await supabase.auth.signOut().catch(() => {});
        if (cancelled) return;

        toast.success("Google бүртгэл амжилттай. Одоо login хийгээрэй.");
        router.replace("/login");
        return;
      } else {
        const isAdmin = await isAdminUser(data.session.user.id);
        if (cancelled) return;

        if (isAdmin) {
          await supabase.auth.signOut().catch(() => {});
          toast.error("Admin account байна. Admin login хэсгээр нэвтэрнэ үү.");
          router.replace("/admin-login");
          return;
        }

        try {
          const isRegistered = await hasGoogleRegistration(data.session.user.id);
          if (cancelled) return;

          if (!isRegistered) {
            await supabase.auth.signOut().catch(() => {});
            toast.error("Google-ээр нэвтрэхийн өмнө Register дээрээс бүртгүүлнэ үү.");
            router.replace("/register");
            return;
          }
        } catch (registrationError) {
          await supabase.auth.signOut().catch(() => {});
          if (cancelled) return;

          const message =
            registrationError instanceof Error
              ? registrationError.message
              : "Google registration status could not be verified.";
          toast.error(message);
          router.replace("/login");
          return;
        }
      }

      toast.success("Google login амжилттай.");
      router.replace(next);
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel frame-corner p-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary-glow">Google Auth</p>
        <h1 className="mt-3 text-2xl font-bold glow-text">SYSTEM SYNCING</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Түр хүлээнэ үү. Таны Google session-ийг баталгаажуулж байна.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="glass-panel frame-corner p-6 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-primary-glow">Google Auth</p>
            <h1 className="mt-3 text-2xl font-bold glow-text">SYSTEM SYNCING</h1>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
