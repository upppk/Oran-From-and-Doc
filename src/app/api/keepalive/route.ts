import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Pinged periodically by a Vercel Cron Job (see vercel.json) purely to keep the
// Supabase free-tier project counted as "active" so it doesn't auto-pause after
// a week of no API activity. Does the smallest possible real read.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.from("user_profiles").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() });
  } catch (e) {
    console.error("keepalive failed", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
