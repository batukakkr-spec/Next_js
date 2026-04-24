import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const Schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

// Promote (or create) an admin account.
// 1) Try sign-in. If user exists & password matches → ensure admin role.
// 2) If user doesn't exist → create with email_confirm=true → assign admin role.
export const claimAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const { email, password } = data;

    // Try to find existing user by email via listUsers (paginated search).
    let userId: string | null = null;
    const { data: listed, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);
    const existing = listed.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Reset/sync password to provided one so they can log in.
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updErr) throw new Error(updErr.message);
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create user");
      userId = created.user.id;
    }

    // Ensure admin role exists in public.user_roles
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const hasAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!hasAdmin) {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (roleErr) throw new Error(roleErr.message);
    }

    return { ok: true, userId };
  });
