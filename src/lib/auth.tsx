"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "moderator" | "user";

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  xp_to_next: number;
  streak_days: number;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (r: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const loadingProfileRef = useRef<Promise<void> | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const loadProfileAndRoles = useCallback(async (uid: string) => {
    if (loadingProfileRef.current) {
      await loadingProfileRef.current;
      return;
    }

    loadingProfileRef.current = (async () => {
      const [{ data: p, error: profileError }, { data: r, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);

      if (profileError) {
        throw profileError;
      }

      if (rolesError) {
        throw rolesError;
      }

      setProfile((p as Profile) ?? null);
      setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
      lastLoadedUserIdRef.current = uid;
    })();

    try {
      await loadingProfileRef.current;
    } finally {
      loadingProfileRef.current = null;
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, sess) => {
      if (!initializedRef.current) return;

      setSession(sess);
      setUser(sess?.user ?? null);

      if (!sess?.user) {
        lastLoadedUserIdRef.current = null;
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      const shouldReloadProfile =
        evt === "SIGNED_IN" ||
        evt === "USER_UPDATED" ||
        lastLoadedUserIdRef.current !== sess.user.id;

      if (!shouldReloadProfile) {
        return;
      }

      setLoading(true);
      void loadProfileAndRoles(sess.user.id).finally(() => setLoading(false));
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      initializedRef.current = true;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadProfileAndRoles(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfileAndRoles]);

  const memoizedValue = useMemo(
    () => ({
      session,
      user,
      profile,
      roles,
      loading,
      isAuthenticated: !!session,
      hasRole: (r: AppRole) => roles.includes(r),
      refreshProfile: async () => {
        if (!user) return;
        lastLoadedUserIdRef.current = null;
        await loadProfileAndRoles(user.id);
      },
      signOut: async () => {
        setLoading(true);
        try {
          await supabase.auth.signOut();
        } catch (error) {
          setLoading(false);
          throw error;
        }
      },
    }),
    [loading, profile, roles, session, user],
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
