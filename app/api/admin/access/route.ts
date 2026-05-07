import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Schema = z.object({
  setupCode: z.string().trim().min(1).max(255),
});

function createRequestClient(authHeader: string) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { setupCode } = Schema.parse(await request.json());
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

    if (!bootstrapSecret) {
      return NextResponse.json(
        { error: "Admin bootstrap is disabled. Set ADMIN_BOOTSTRAP_SECRET." },
        { status: 400 },
      );
    }

    if (setupCode !== bootstrapSecret) {
      return NextResponse.json({ error: "Invalid admin setup code." }, { status: 403 });
    }

    const requestClient = createRequestClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await requestClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      throw new Error(rolesError.message);
    }

    const isAdmin = (roles ?? []).some((role) => role.role === "admin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify admin access.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
