import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Require a logged-in session so this endpoint can't be used as an open relay.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { to, subject, html } = await request.json() as { to: string[]; subject: string; html: string };
  const recipients = (to ?? []).filter(Boolean);
  if (recipients.length === 0) return NextResponse.json({ skipped: true });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    console.error("GMAIL_USER / GMAIL_APP_PASSWORD not configured");
    return NextResponse.json({ error: "email not configured" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `แบบฟอร์มต่างๆ Oranit <${gmailUser}>`,
      to: recipients,
      subject,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notify send failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "send failed" }, { status: 500 });
  }
}
