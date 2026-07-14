"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Plus, Trash2 } from "lucide-react";
import { PassItem, MaterialPassRow, parseItems, emptyItem } from "./types";

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

export const WAREHOUSES = ["คลังโคราช", "คลังราชบุรี", "คลังบางพลี", "คลังบางปะอินทร์"];

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
  book_no: string; pass_date: string; destination: string;
  vehicle_no: string; driver_name: string; issue_time: string;
  items: PassItem[];
  issuer_name: string; received_origin_name: string; received_dest_name: string;
  exit_no: string; exit_date: string; exit_time: string;
  warehouse_head_name: string; gate_guard_name: string;
}

function toFormState(row: MaterialPassRow | null, defaultName: string): FormState {
  if (!row) {
    return {
      book_no: "", pass_date: todayStr(), destination: "",
      vehicle_no: "", driver_name: "", issue_time: "",
      items: [emptyItem(), emptyItem(), emptyItem()],
      issuer_name: defaultName, received_origin_name: "", received_dest_name: "",
      exit_no: "", exit_date: "", exit_time: "",
      warehouse_head_name: "", gate_guard_name: "",
    };
  }
  const items = parseItems(row.items);
  return {
    book_no: row.book_no ?? "", pass_date: row.pass_date, destination: row.destination ?? "",
    vehicle_no: row.vehicle_no ?? "", driver_name: row.driver_name ?? "", issue_time: row.issue_time ?? "",
    items: items.length ? items : [emptyItem(), emptyItem(), emptyItem()],
    issuer_name: row.issuer_name ?? defaultName, received_origin_name: row.received_origin_name ?? "",
    received_dest_name: row.received_dest_name ?? "",
    exit_no: row.exit_no ?? "", exit_date: row.exit_date ?? "", exit_time: row.exit_time ?? "",
    warehouse_head_name: row.warehouse_head_name ?? "", gate_guard_name: row.gate_guard_name ?? "",
  };
}

interface Props {
  row: MaterialPassRow | null;
  currentUserId: string;
  currentUserName: string;
  role: string;
  onClose: () => void;
  onSaved: (row: MaterialPassRow) => void;
}

export default function MaterialPassForm({ row, currentUserId, currentUserName, role, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(() => toFormState(row, currentUserName));
  const [docNo, setDocNo] = useState(row?.doc_no ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }
  function changeItem(i: number, field: keyof PassItem, val: string) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  }
  function addItem() { setForm(f => ({ ...f, items: [...f.items, emptyItem()] })); }
  function removeItem(i: number) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })); }

  useEffect(() => {
    if (row) return;
    let cancelled = false;
    async function generateNo() {
      const { count } = await supabase
        .from("material_passes")
        .select("id", { count: "exact", head: true })
        .eq("pass_date", form.pass_date);
      if (cancelled) return;
      const [y, m, d] = form.pass_date.split("-");
      const seq = String((count ?? 0) + 1).padStart(3, "0");
      setDocNo(`${d}-${m}-${y}-${seq}`);
    }
    generateNo();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pass_date, row]);

  const canEditRequest = !row || row.requester_id === currentUserId || role === "admin";
  const canEditWarehouse = role === "warehouse" || role === "admin";

  async function save(action: "save" | "exit" | "reject") {
    setSaving(true); setErr("");
    if (!form.destination.trim()) { setErr("กรุณากรอกสถานที่ส่ง"); setSaving(false); return; }

    const items = form.items.filter(it => it.description.trim() || it.qty.trim());
    const payload: Record<string, unknown> = {
      doc_no: docNo || null, book_no: form.book_no || null, pass_date: form.pass_date,
      destination: form.destination.trim(), vehicle_no: form.vehicle_no || null,
      driver_name: form.driver_name || null, issue_time: form.issue_time || null,
      items,
      issuer_name: form.issuer_name || null, received_origin_name: form.received_origin_name || null,
      received_dest_name: form.received_dest_name || null,
      exit_no: form.exit_no || null, exit_date: form.exit_date || null, exit_time: form.exit_time || null,
      warehouse_head_name: form.warehouse_head_name || null, gate_guard_name: form.gate_guard_name || null,
      updated_at: new Date().toISOString(),
    };
    if (action === "exit") {
      payload.status = "exited";
      payload.exited_by = currentUserId;
      payload.exited_at = new Date().toISOString();
    }
    if (action === "reject") {
      payload.status = "rejected";
      payload.rejected_by = currentUserId;
      payload.rejected_at = new Date().toISOString();
    }

    let resp;
    if (row) {
      resp = await supabase.from("material_passes").update(payload).eq("id", row.id).select("*").single();
    } else {
      resp = await supabase.from("material_passes").insert({ ...payload, requester_id: currentUserId, status: "pending" }).select("*").single();
    }
    setSaving(false);
    if (resp.error) { setErr(resp.error.message); return; }
    onSaved(resp.data as MaterialPassRow);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{row ? "แก้ไขใบผ่านวัสดุออกนอกโรงงาน" : "สร้างใบผ่านวัสดุออกนอกโรงงาน"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{err}</div>}
          {row?.status === "rejected" && row.rejected_reason && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              <strong>เหตุผลที่ไม่อนุมัติ:</strong> {row.rejected_reason}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="เล่มที่ (ถ้ามี)"><input disabled={!canEditRequest} className={inputCls} value={form.book_no} onChange={e => setField("book_no", e.target.value)} /></Field>
            <Field label="เลขที่ (รันอัตโนมัติ)"><input disabled className={inputCls + " bg-gray-50 text-gray-500"} value={docNo} /></Field>
            <Field label="วันที่"><input disabled={!canEditRequest} type="date" className={inputCls} value={form.pass_date} onChange={e => setField("pass_date", e.target.value)} /></Field>
          </div>

          <Field label="สถานที่ส่ง (คลังปลายทาง) *">
            <select required disabled={!canEditRequest} className={inputCls} value={form.destination} onChange={e => setField("destination", e.target.value)}>
              <option value="">เลือกคลัง</option>
              {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="ทะเบียนรถที่บรรทุก"><input disabled={!canEditRequest} className={inputCls} value={form.vehicle_no} onChange={e => setField("vehicle_no", e.target.value)} /></Field>
            <Field label="ผู้ขับรถ"><input disabled={!canEditRequest} className={inputCls} value={form.driver_name} onChange={e => setField("driver_name", e.target.value)} /></Field>
            <Field label="เวลาออกใบผ่าน"><input disabled={!canEditRequest} className={inputCls} value={form.issue_time} onChange={e => setField("issue_time", e.target.value)} placeholder="เช่น 09.30 น." /></Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-gray-600">รายการวัสดุ</p>
              {canEditRequest && <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"><Plus className="w-3.5 h-3.5" /> เพิ่มรายการ</button>}
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input disabled={!canEditRequest} className={inputCls + " w-16 shrink-0"} placeholder="จำนวน" value={it.qty} onChange={e => changeItem(i, "qty", e.target.value)} />
                  <input disabled={!canEditRequest} className={inputCls + " w-16 shrink-0"} placeholder="หน่วย" value={it.unit} onChange={e => changeItem(i, "unit", e.target.value)} />
                  <input disabled={!canEditRequest} className={inputCls} placeholder="รายการ / ขนาด" value={it.description} onChange={e => changeItem(i, "description", e.target.value)} />
                  <input disabled={!canEditRequest} className={inputCls + " w-28 shrink-0"} placeholder="หมายเหตุ" value={it.remark} onChange={e => changeItem(i, "remark", e.target.value)} />
                  {canEditRequest && form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="ผู้ออกใบผ่าน"><input disabled={!canEditRequest} className={inputCls} value={form.issuer_name} onChange={e => setField("issuer_name", e.target.value)} /></Field>
            <Field label="ผู้รับต้นทาง"><input disabled={!canEditRequest} className={inputCls} value={form.received_origin_name} onChange={e => setField("received_origin_name", e.target.value)} /></Field>
            <Field label="ผู้รับปลายทาง"><input disabled={!canEditRequest} className={inputCls} value={form.received_dest_name} onChange={e => setField("received_dest_name", e.target.value)} /></Field>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs font-medium text-gray-600">ส่วนตรวจออกจากโรงงาน (ฝ่ายคลังสินค้า)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="เลขที่ผ่านออก"><input disabled={!canEditWarehouse} className={inputCls} value={form.exit_no} onChange={e => setField("exit_no", e.target.value)} /></Field>
              <Field label="วันที่ผ่านออก"><input disabled={!canEditWarehouse} type="date" className={inputCls} value={form.exit_date} onChange={e => setField("exit_date", e.target.value)} /></Field>
              <Field label="เวลาผ่านออก"><input disabled={!canEditWarehouse} className={inputCls} value={form.exit_time} onChange={e => setField("exit_time", e.target.value)} placeholder="เช่น 11.11 น." /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="หัวหน้าแผนกคลังสินค้า"><input disabled={!canEditWarehouse} className={inputCls} value={form.warehouse_head_name} onChange={e => setField("warehouse_head_name", e.target.value)} /></Field>
              <Field label="ผู้รักษาประตูโรงงาน"><input disabled={!canEditWarehouse} className={inputCls} value={form.gate_guard_name} onChange={e => setField("gate_guard_name", e.target.value)} /></Field>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-gray-100">
          {canEditRequest && (
            <button type="button" disabled={saving} onClick={() => save("save")}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          )}
          {canEditWarehouse && row?.status !== "exited" && (
            <>
              <button type="button" disabled={saving} onClick={() => save("exit")}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
                {saving ? "กำลังบันทึก..." : "บันทึก + ผ่านออก"}
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
