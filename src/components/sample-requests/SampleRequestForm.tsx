"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Plus, Trash2 } from "lucide-react";
import { SampleItem, SampleRequestRow, parseItems, emptyItem } from "./types";
import type { SalesProduct } from "@/components/price-approval/types";

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
  request_no: string; request_date: string; to_person: string;
  employee_name: string; zone_province: string;
  items: SampleItem[];
  reason: string;
  requester_name: string;
  checked_by_name: string;
  approved_by_name: string;
}

function toFormState(row: SampleRequestRow | null, defaultName: string): FormState {
  if (!row) {
    return {
      request_no: "", request_date: todayStr(), to_person: "หัวหน้าคลังสินค้า",
      employee_name: defaultName, zone_province: "",
      items: [emptyItem(), emptyItem(), emptyItem()],
      reason: "", requester_name: defaultName, checked_by_name: "", approved_by_name: "",
    };
  }
  const items = parseItems(row.items);
  return {
    request_no: row.request_no ?? "", request_date: row.request_date, to_person: row.to_person ?? "หัวหน้าคลังสินค้า",
    employee_name: row.employee_name ?? defaultName, zone_province: row.zone_province ?? "",
    items: items.length ? items : [emptyItem(), emptyItem(), emptyItem()],
    reason: row.reason ?? "", requester_name: row.requester_name ?? defaultName,
    checked_by_name: row.checked_by_name ?? "", approved_by_name: row.approved_by_name ?? "",
  };
}

interface Props {
  row: SampleRequestRow | null;
  products: SalesProduct[];
  currentUserId: string;
  currentUserName: string;
  role: string;
  onClose: () => void;
  onSaved: (row: SampleRequestRow) => void;
}

export default function SampleRequestForm({ row, products, currentUserId, currentUserName, role, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(() => toFormState(row, currentUserName));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [productSuggestFor, setProductSuggestFor] = useState<number | null>(null);

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }
  function changeItem(i: number, field: keyof SampleItem, val: string) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  }
  function addItem() { setForm(f => ({ ...f, items: [...f.items, emptyItem()] })); }
  function removeItem(i: number) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })); }

  const canEditRequest = !row || row.requester_id === currentUserId || role === "admin";
  const canEditWarehouse = role === "warehouse" || role === "admin";

  async function save(action: "save" | "check" | "approve") {
    setSaving(true); setErr("");
    if (!form.employee_name.trim()) { setErr("กรุณากรอกชื่อพนักงาน"); setSaving(false); return; }

    const items = form.items.filter(it => it.product_name.trim() || it.qty.trim());
    const payload: Record<string, unknown> = {
      request_no: form.request_no || null, request_date: form.request_date, to_person: form.to_person || null,
      employee_name: form.employee_name.trim(), zone_province: form.zone_province || null,
      items,
      reason: form.reason || null,
      requester_name: form.requester_name || null,
      checked_by_name: form.checked_by_name || null,
      approved_by_name: form.approved_by_name || null,
      updated_at: new Date().toISOString(),
    };
    if (action === "check") {
      payload.status = "checked";
      payload.checked_by = currentUserId;
      payload.checked_at = new Date().toISOString();
      if (!form.checked_by_name.trim()) payload.checked_by_name = currentUserName;
    }
    if (action === "approve") {
      payload.status = "approved";
      payload.approved_by = currentUserId;
      payload.approved_at = new Date().toISOString();
      if (!form.approved_by_name.trim()) payload.approved_by_name = currentUserName;
    }

    let resp;
    if (row) {
      resp = await supabase.from("sample_requests").update(payload).eq("id", row.id).select("*").single();
    } else {
      resp = await supabase.from("sample_requests").insert({ ...payload, requester_id: currentUserId, status: "pending" }).select("*").single();
    }
    setSaving(false);
    if (resp.error) { setErr(resp.error.message); return; }
    onSaved(resp.data as SampleRequestRow);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{row ? "แก้ไขใบขอสินค้าตัวอย่าง" : "สร้างใบขอสินค้าตัวอย่าง"}</h2>
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
            <Field label="เลขที่ (ถ้ามี)"><input disabled={!canEditRequest} className={inputCls} value={form.request_no} onChange={e => setField("request_no", e.target.value)} /></Field>
            <Field label="วันที่"><input disabled={!canEditRequest} type="date" className={inputCls} value={form.request_date} onChange={e => setField("request_date", e.target.value)} /></Field>
            <Field label="ถึง (หัวหน้าคลังสินค้า)"><input disabled={!canEditRequest} className={inputCls} value={form.to_person} onChange={e => setField("to_person", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="ชื่อพนักงาน *"><input required disabled={!canEditRequest} className={inputCls} value={form.employee_name} onChange={e => setField("employee_name", e.target.value)} /></Field>
            <Field label="เขต"><input disabled={!canEditRequest} className={inputCls} value={form.zone_province} onChange={e => setField("zone_province", e.target.value)} /></Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-gray-600">รายการสินค้า</p>
              {canEditRequest && <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"><Plus className="w-3.5 h-3.5" /> เพิ่มรายการ</button>}
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => {
                const productMatches = productSuggestFor === i
                  ? (it.product_name
                      ? products.filter(p => p.code.toLowerCase().includes(it.product_name.toLowerCase()) || p.name.toLowerCase().includes(it.product_name.toLowerCase())).slice(0, 30)
                      : products.slice(0, 30))
                  : [];
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="flex-1 min-w-0 relative">
                      <input disabled={!canEditRequest} className={inputCls} placeholder="พิมพ์ค้นหารหัส/ชื่อสินค้า หรือกรอกเอง" value={it.product_name}
                        onChange={e => { changeItem(i, "product_name", e.target.value); setProductSuggestFor(i); }}
                        onFocus={() => setProductSuggestFor(i)}
                        onBlur={() => setTimeout(() => setProductSuggestFor(s => s === i ? null : s), 150)} />
                      {productMatches.length > 0 && (
                        <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto">
                          {productMatches.map(p => (
                            <button type="button" key={p.id} onMouseDown={() => { changeItem(i, "product_name", p.name); setProductSuggestFor(null); }}
                              className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                              <span className="font-mono font-medium">{p.code}</span> — {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input disabled={!canEditRequest} className={inputCls + " w-20 md:w-28 text-right shrink-0"} placeholder="จำนวนแผ่น" value={it.qty} onChange={e => changeItem(i, "qty", e.target.value)} />
                    {canEditRequest && form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="เหตุผลในการขออนุมัติ"><textarea disabled={!canEditRequest} className={inputCls} rows={2} value={form.reason} onChange={e => setField("reason", e.target.value)} /></Field>
          <Field label="ผู้ขอ"><input disabled={!canEditRequest} className={inputCls} value={form.requester_name} onChange={e => setField("requester_name", e.target.value)} /></Field>

          <div className="border-t border-gray-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="ผู้ตรวจ (ฝ่ายคลังสินค้า)"><input disabled={!canEditWarehouse} className={inputCls} value={form.checked_by_name} onChange={e => setField("checked_by_name", e.target.value)} /></Field>
            <Field label="ผู้อนุมัติ (ฝ่ายคลังสินค้า)"><input disabled={!canEditWarehouse} className={inputCls} value={form.approved_by_name} onChange={e => setField("approved_by_name", e.target.value)} /></Field>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-gray-100">
          {canEditRequest && (
            <button type="button" disabled={saving} onClick={() => save("save")}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          )}
          {canEditWarehouse && row?.status !== "approved" && (
            <>
              <button type="button" disabled={saving} onClick={() => save("check")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
                {saving ? "กำลังบันทึก..." : "บันทึก + ตรวจแล้ว"}
              </button>
              <button type="button" disabled={saving} onClick={() => save("approve")}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
                {saving ? "กำลังบันทึก..." : "บันทึก + อนุมัติ"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
