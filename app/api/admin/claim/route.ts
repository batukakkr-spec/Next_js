import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  setupCode: z.string().trim().min(1).max(255),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, setupCode } = Schema.parse(body);
    const normalizedEmail = email.toLowerCase();
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

    if (!bootstrapSecret) {
      throw new Error("Admin bootstrap is disabled. Set ADMIN_BOOTSTRAP_SECRET.");
    }

    if (setupCode !== bootstrapSecret) {
      return NextResponse.json({ error: "Invalid admin setup code." }, { status: 403 });
    }

    const { data: adminRoles, error: adminRolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);

    if (adminRolesError) {
      throw new Error(adminRolesError.message);
    }

    if ((adminRoles ?? []).length > 0) {
      throw new Error("An admin already exists");
    }

    let userId: string | null = null;
    const { data: listed, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (listErr) {
      throw new Error(listErr.message);
    }

    const existing = listed.users.find((user) => user.email?.toLowerCase() === normalizedEmail);

    if (existing) {
      userId = existing.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

      if (createError || !created.user) {
        throw new Error(createError?.message ?? "Failed to create user");
      }

      userId = created.user.id;
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (roleError) {
      throw new Error(roleError.message);
    }

    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message.includes("Missing Supabase server environment variables")
        ? "Server admin setup incomplete. Set SUPABASE_SERVICE_ROLE_KEY before claiming an admin account."
        : error instanceof Error
          ? error.message
          : "Failed to claim admin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
