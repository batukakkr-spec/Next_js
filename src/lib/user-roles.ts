"use client";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as { role: AppRole }[]).map((entry) => entry.role);
}

export async function isAdminUser(userId: string) {
  const roles = await getUserRoles(userId);
  return roles.includes("admin");
}
