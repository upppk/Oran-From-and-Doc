import { createClient } from "@/lib/supabase/client";

const SITE_URL = "https://price-approval.vercel.app";

async function sendEmail(to: string[], subject: string, html: string) {
  if (to.length === 0) return;
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (e) {
    console.error("notify failed", e);
  }
}

async function emailsForRole(role: string): Promise<string[]> {
  const supabase = createClient();
  const { data: profs } = await supabase.from("user_profiles").select("id").eq("role", role);
  const ids = (profs ?? []).map(p => p.id);
  if (ids.length === 0) return [];
  const { data: emails } = await supabase.from("profiles").select("email").in("id", ids);
  return (emails ?? []).map(e => e.email).filter(Boolean) as string[];
}

async function emailForUser(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).single();
  return data?.email ? [data.email] : [];
}

function priceApprovalCard(docNo: string, customerName: string, amountLine: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1d29">
      <p><strong>เลขที่ใบปอ:</strong> ${docNo}</p>
      <p><strong>ลูกค้า:</strong> ${customerName}</p>
      <p>${amountLine}</p>
      <p style="margin-top:16px">
        <a href="${SITE_URL}/price-approval" style="background:#d97706;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">
          เปิดดูในระบบ
        </a>
      </p>
    </div>
  `;
}

export async function notifySubmittedForApproval(docNo: string, customerName: string, amountLine: string) {
  const to = await emailsForRole("area_head");
  await sendEmail(to, `[ใบขออนุมัติราคาพิเศษ] รออนุมัติ — ${docNo}`,
    `<p>มีใบขออนุมัติราคาพิเศษใหม่รอการอนุมัติจากคุณ</p>${priceApprovalCard(docNo, customerName, amountLine)}`);
}

export async function notifyPendingMarketing(docNo: string, customerName: string, amountLine: string) {
  const to = await emailsForRole("marketing_manager");
  await sendEmail(to, `[ใบขออนุมัติราคาพิเศษ] รออนุมัติขั้นสุดท้าย — ${docNo}`,
    `<p>ใบขออนุมัติราคาพิเศษผ่านการอนุมัติจากหัวหน้าภาคการขายแล้ว รอการอนุมัติขั้นสุดท้ายจากคุณ</p>${priceApprovalCard(docNo, customerName, amountLine)}`);
}

export async function notifyApproved(creatorId: string, docNo: string, customerName: string, amountLine: string) {
  const to = await emailForUser(creatorId);
  await sendEmail(to, `[ใบขออนุมัติราคาพิเศษ] อนุมัติแล้ว — ${docNo}`,
    `<p>ใบขออนุมัติราคาพิเศษของคุณได้รับการอนุมัติครบทุกขั้นตอนแล้ว</p>${priceApprovalCard(docNo, customerName, amountLine)}`);
}

export async function notifyRejected(creatorId: string, docNo: string, customerName: string, reason: string) {
  const to = await emailForUser(creatorId);
  await sendEmail(to, `[ใบขออนุมัติราคาพิเศษ] ไม่อนุมัติ — ${docNo}`,
    `<p>ใบขออนุมัติราคาพิเศษของคุณไม่ได้รับการอนุมัติ</p>${priceApprovalCard(docNo, customerName, `<strong>เหตุผล:</strong> ${reason || "-"}`)}`);
}
