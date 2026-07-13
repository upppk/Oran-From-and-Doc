"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import { ShirtRequestRow } from "./types";

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

interface FormState {
  request_date: string; to_person: string; from_name: string; from_position: string;
  subject: string; quantity: string; reason: string; project_note: string;
  approver_initials: string;
}

function toFormState(row: ShirtRequestRow | null, defaultName: string): FormState {
  if (!row) {
    return {
      request_date: todayStr(), to_person: "", from_name: defaultName, from_position: "",
      subject: "ขออนุมัติเบิกเสื้อช่างแขนยาว", quantity: "", reason: "", project_note: "",
      approver_initials: "",
    };
  }
  return {
    request_date: row.request_date, to_person: row.to_person ?? "", from_name: row.from_name ?? defaultName,
    from_position: row.from_position ?? "", subject: row.subject ?? "ขออนุมัติเบิกเสื้อช่างแขนยาว",
    quantity: row.quantity != null ? String(row.quantity) : "", reason: row.reason ?? "",
    project_note: row.project_note ?? "", approver_initials: row.approver_initials ?? "",
  };
}

interface Props {
  row: ShirtRequestRow | null;
  currentUserId: string;
  currentUserName: string;
  role: string;
  onClose: () => void;
  onSaved: (row: ShirtRequestRow) => void;
}

export default function ShirtRequestForm({ row, currentUserId, currentUserName, role, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(() => toFormState(row, currentUserName));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  const canEditRequest = !row || row.requester_id === currentUserId || role === "admin";
  const canApprove = role === "admin" || role === "marketing_manager";

  async function save(action: "save" | "approve" | "reject") {
    setSaving(true); setErr("");
    if (!form.from_name.trim()) { setErr("กรุณากรอกชื่อผู้ขอ"); setSaving(false); return; }

    const payload: Record<string, unknown> = {
      request_date: form.request_date, to_person: form.to_person || null,
      from_name: form.from_name.trim(), from_position: form.from_position || null,
      subject: form.subject || null, quantity: form.quantity ? parseInt(form.quantity) : null,
      reason: form.reason || null, project_note: form.project_note || null,
      approver_initials: form.approver_initials || null,
      updated_at: new Date().toISOString(),
    };
    if (action === "approve") {
      payload.status = "approved";
      payload.approved_by = currentUserId;
      payload.approved_at = new Date().toISOString();
    }
    if (action === "reject") {
      payload.status = "rejected";
      payload.rejected_by = currentUserId;
      payload.rejected_at = new Date().toISOString();
    }

    let resp;
    if (row) {
      resp = await supabase.from("shirt_requests").update(payload).eq("id", row.id).select("*").single();
    } else {
      resp = await supabase.from("shirt_requests").insert({ ...payload, requester_id: currentUserId, status: "pending" }).select("*").single();
    }
    setSaving(false);
    if (resp.error) { setErr(resp.error.message); return; }
    onSaved(resp.data as ShirtRequestRow);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{row ? "แก้ไขใบติดต่อภายใน" : "สร้างใบติดต่อภายใน"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{err}</div>}
          {row?.status === "rejected" && row.rejected_reason && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              <strong>เหตุผลที่ไม่อนุมัติ:</strong> {row.rejected_reason}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="เรียน (To)"><input disabled={!canEditRequest} className={inputCls} value={form.to_person} onChange={e => setField("to_person", e.target.value)} /></Field>
            <Field label="วันที่"><input disabled={!canEditRequest} type="date" className={inputCls} value={form.request_date} onChange={e => setField("request_date", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="จาก (From)"><input disabled={!canEditRequest} className={inputCls} value={form.from_name} onChange={e => setField("from_name", e.target.value)} /></Field>
            <Field label="ตำแหน่ง (ท้ายเอกสาร)"><input disabled={!canEditRequest} className={inputCls} value={form.from_position} onChange={e => setField("from_position", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Field label="เรื่อง"><input disabled={!canEditRequest} className={inputCls} value={form.subject} onChange={e => setField("subject", e.target.value)} /></Field>
            </div>
            <Field label="จำนวน (ตัว)"><input disabled={!canEditRequest} type="number" className={inputCls} value={form.quantity} onChange={e => setField("quantity", e.target.value)} /></Field>
          </div>

          <Field label="เนื่องจาก... (เหตุผลในการขออนุมัติ)">
            <textarea disabled={!canEditRequest} className={inputCls} rows={4} value={form.reason} onChange={e => setField("reason", e.target.value)} />
          </Field>

          <Field label="หมายเหตุ (โครงการ / ผู้ติดต่อ)"><input disabled={!canEditRequest} className={inputCls} value={form.project_note} onChange={e => setField("project_note", e.target.value)} /></Field>

          <div className="border-t border-gray-100 pt-3">
            <Field label="ลงชื่อย่อผู้อนุมัติ (Initials)">
              <input disabled={!canApprove} className={inputCls} value={form.approver_initials} onChange={e => setField("approver_initials", e.target.value)} placeholder={canApprove ? "กรอกชื่อย่อ" : "รอผู้มีสิทธิ์อนุมัติ"} />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-gray-100">
          {canEditRequest && (
            <button type="button" disabled={saving} onClick={() => save("save")}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          )}
          {canApprove && row?.status === "pending" && (
            <>
              <button type="button" disabled={saving} onClick={() => save("approve")}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
                {saving ? "กำลังบันทึก..." : "อนุมัติ"}
              </button>
              <button type="button" disabled={saving} onClick={() => save("reject")}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
                {saving ? "กำลังบันทึก..." : "ไม่อนุมัติ"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
