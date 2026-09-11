import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET/POST /api/activation — progreso persistente del checklist
 * crea → corre → publica → compite (tabla `activation_progress`).
 *
 * Sin sesión o sin tabla: GET responde { steps: null } y POST { ok: true,
 * server: false } para que el cliente use localStorage sin romper nada.
 */

const STEPS = ["crea", "corre", "publica", "compite"] as const;

type StepMap = Record<string, boolean>;

async function readSteps(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<StepMap | null> {
  try {
    const { data, error } = await supabase
      .from("activation_progress")
      .select("steps")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return error ? null : {};
    return (data.steps as StepMap) ?? {};
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ steps: null });
    const steps = await readSteps(supabase, user.id);
    return NextResponse.json({ steps });
  } catch {
    return NextResponse.json({ steps: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const step = body?.step;
    if (!STEPS.includes(step)) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true, server: false });

    const current = (await readSteps(supabase, user.id)) ?? null;
    if (current === null) return NextResponse.json({ ok: true, server: false });
    const next = { ...current, [step]: true };
    const { error } = await supabase
      .from("activation_progress")
      .upsert({ user_id: user.id, steps: next }, { onConflict: "user_id" });
    if (error) return NextResponse.json({ ok: true, server: false });
    return NextResponse.json({ ok: true, server: true, steps: next });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
