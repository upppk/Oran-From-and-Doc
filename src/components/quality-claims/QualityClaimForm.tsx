"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Plus, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { ClaimItem, QualityClaimRow, parseItems, emptyItem } from "./types";
import type { SalesCustomer } from "@/components/price-approval/types";

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
  claim_no: string; claim_date: string; to_person: string;
  customer_code: string; shop_name: string; shop_phone: string; shop_address: string; department: string;
  items: ClaimItem[];
  roof_type: string; structure: string; damage_desc: string; damage_qty: string; purpose: string;
  factory_comment: string;
  submitted_by_name: string; print_date: string;
}

function toFormState(row: QualityClaimRow | null, defaultName: string): FormState {
  if (!row) {
    return {
      claim_no: "", claim_date: todayStr(), to_person: "ผู้จัดการโรงงาน",
      customer_code: "", shop_name: "", shop_phone: "", shop_address: "", department: "",
      items: [emptyItem(), emptyItem(), emptyItem()],
      roof_type: "", structure: "", damage_desc: "", damage_qty: "", purpose: "",
      factory_comment: "", submitted_by_name: defaultName, print_date: todayStr(),
    };
  }
  const items = parseItems(row.items);
  return {
    claim_no: row.claim_no ?? "", claim_date: row.claim_date, to_person: row.to_person ?? "ผู้จัดการโรงงาน",
    customer_code: row.customer_code ?? "",
    shop_name: row.shop_name ?? "", shop_phone: row.shop_phone ?? "", shop_address: row.shop_address ?? "", department: row.department ?? "",
    items: items.length ? items : [emptyItem(), emptyItem(), emptyItem()],
    roof_type: row.roof_type ?? "", structure: row.structure ?? "", damage_desc: row.damage_desc ?? "", damage_qty: row.damage_qty ?? "", purpose: row.purpose ?? "",
    factory_comment: row.factory_comment ?? "", submitted_by_name: row.submitted_by_name ?? defaultName, print_date: row.print_date ?? todayStr(),
  };
}

interface Props {
  row: QualityClaimRow | null;
  customers: SalesCustomer[];
  currentUserId: string;
  currentUserName: string;
  role: string;
  onClose: () => void;
  onSaved: (row: QualityClaimRow) => void;
}

export default function QualityClaimForm({ row, customers, currentUserId, currentUserName, role, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(() => toFormState(row, currentUserName));
  const [photoUrls, setPhotoUrls] = useState<string[]>(row?.photo_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [custSuggest, setCustSuggest] = useState(false);

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }
  function pickCustomer(c: SalesCustomer) {
    setForm(f => ({ ...f, customer_code: c.code, shop_name: c.name }));
    setCustSuggest(false);
  }
  function changeItem(i: number, field: keyof ClaimItem, val: string) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  }
  function addItem() { setForm(f => ({ ...f, items: [...f.items, emptyItem()] })); }
  function removeItem(i: number) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })); }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true); setErr("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${currentUserId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("quality-claim-photos").upload(path, file);
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from("quality-claim-photos").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setPhotoUrls(prev => [...prev, ...uploaded]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    }
    setUploading(false);
  }
  function removePhoto(url: string) {
    setPhotoUrls(prev => prev.filter(u => u !== url));
  }

  const canEditRequest = !row || row.submitted_by === currentUserId || role === "admin";
  const canEditFactory = role === "factory" || role === "admin";

  const custMatches = custSuggest
    ? (form.shop_name
        ? customers.filter(c => c.code.toLowerCase().includes(form.shop_name.toLowerCase()) || c.name.toLowerCase().includes(form.shop_name.toLowerCase())).slice(0, 30)
        : customers.slice(0, 30))
    : [];

  async function save(markResolved: boolean) {
    setSaving(true); setErr("");
    if (!form.shop_name.trim()) { setErr("กรุณากรอกชื่อร้าน"); setSaving(false); return; }

    const items = form.items.filter(it => it.product_name.trim() || it.qty.trim());
    const payload: Record<string, unknown> = {
      claim_no: form.claim_no || null, claim_date: form.claim_date, to_person: form.to_person || null,
      customer_code: form.customer_code || null,
      shop_name: form.shop_name.trim(), shop_phone: form.shop_phone || null, shop_address: form.shop_address || null, department: form.department || null,
      items,
      roof_type: form.roof_type || null, structure: form.structure || null, damage_desc: form.damage_desc || null,
      damage_qty: form.damage_qty || null, purpose: form.purpose || null,
      factory_comment: form.factory_comment || null,
      submitted_by_name: form.submitted_by_name || null, print_date: form.print_date || null,
      photo_urls: photoUrls,
      updated_at: new Date().toISOString(),
    };
    if (markResolved) {
      payload.status = "resolved";
      payload.resolved_by = currentUserId;
      payload.resolved_at = new Date().toISOString();
    }

    let resp;
    if (row) {
      resp = await supabase.from("quality_claims").update(payload).eq("id", row.id).select("*").single();
    } else {
      resp = await supabase.from("quality_claims").insert({ ...payload, submitted_by: currentUserId, status: "pending" }).select("*").single();
    }
    setSaving(false);
    if (resp.error) { setErr(resp.error.message); return; }
    onSaved(resp.data as QualityClaimRow);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{row ? "แก้ไขใบเคลมคุณภาพ" : "สร้างใบเคลมคุณภาพ"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{err}</div>}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="เลขที่ (ถ้ามี)"><input disabled={!canEditRequest} className={inputCls} value={form.claim_no} onChange={e => setField("claim_no", e.target.value)} /></Field>
            <Field label="วันที่"><input disabled={!canEditRequest} type="date" className={inputCls} value={form.claim_date} onChange={e => setField("claim_date", e.target.value)} /></Field>
            <Field label="เรียน"><input disabled={!canEditRequest} className={inputCls} value={form.to_person} onChange={e => setField("to_person", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
            <Field label="สถานที่พบ (ชื่อร้าน) — พิมพ์ค้นหารหัส/ชื่อลูกค้า หรือกรอกเอง *">
              <input required disabled={!canEditRequest} className={inputCls} value={form.shop_name}
                onChange={e => { setField("shop_name", e.target.value); setField("customer_code", ""); setCustSuggest(true); }}
                onFocus={() => setCustSuggest(true)}
                onBlur={() => setTimeout(() => setCustSuggest(false), 150)} />
              {custMatches.length > 0 && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto">
                  {custMatches.map(c => (
                    <button type="button" key={c.id} onMouseDown={() => pickCustomer(c)}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                      <span className="font-mono font-medium">{c.code}</span> — {c.name}
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="โทร"><input disabled={!canEditRequest} className={inputCls} value={form.shop_phone} onChange={e => setField("shop_phone", e.target.value)} /></Field>
          </div>
          <Field label="ที่อยู่"><input disabled={!canEditRequest} className={inputCls} value={form.shop_address} onChange={e => setField("shop_address", e.target.value)} /></Field>
          <Field label="หน่วยงาน"><input disabled={!canEditRequest} className={inputCls} value={form.department} onChange={e => setField("department", e.target.value)} /></Field>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-gray-600">กระเบื้องที่ใช้</p>
              {canEditRequest && <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"><Plus className="w-3.5 h-3.5" /> เพิ่มรายการ</button>}
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input disabled={!canEditRequest} className={inputCls} placeholder="ชื่อกระเบื้อง / รุ่น / สี" value={it.product_name} onChange={e => changeItem(i, "product_name", e.target.value)} />
                  <input disabled={!canEditRequest} className={inputCls + " w-28 text-right"} placeholder="จำนวน" value={it.qty} onChange={e => changeItem(i, "qty", e.target.value)} />
                  {canEditRequest && form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-gray-600">รูปภาพประกอบ (ถ้ามี)</p>
              {(canEditRequest || canEditFactory) && (
                <label className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium cursor-pointer">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  {uploading ? "กำลังอัปโหลด..." : "เพิ่มรูป"}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading}
                    onChange={e => { handlePhotoUpload(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
            {photoUrls.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {photoUrls.map(url => (
                  <div key={url} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    {(canEditRequest || canEditFactory) && (
                      <button type="button" onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">ยังไม่มีรูปภาพ</p>
            )}
          </div>

          <p className="text-sm font-semibold text-gray-700 pt-2">ข้อมูลเบื้องต้น</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="ลักษณะการมุง"><input disabled={!canEditRequest} className={inputCls} value={form.roof_type} onChange={e => setField("roof_type", e.target.value)} /></Field>
            <Field label="โครงสร้าง"><input disabled={!canEditRequest} className={inputCls} value={form.structure} onChange={e => setField("structure", e.target.value)} /></Field>
            <Field label="ลักษณะความเสียหาย"><input disabled={!canEditRequest} className={inputCls} value={form.damage_desc} onChange={e => setField("damage_desc", e.target.value)} /></Field>
            <Field label="จำนวนเสียหาย"><input disabled={!canEditRequest} className={inputCls} value={form.damage_qty} onChange={e => setField("damage_qty", e.target.value)} /></Field>
          </div>
          <Field label="วัตถุประสงค์"><textarea disabled={!canEditRequest} className={inputCls} rows={2} value={form.purpose} onChange={e => setField("purpose", e.target.value)} /></Field>
          <Field label="ลงชื่อ (ผู้แจ้ง)"><input disabled={!canEditRequest} className={inputCls} value={form.submitted_by_name} onChange={e => setField("submitted_by_name", e.target.value)} /></Field>

          <div className="border-t border-gray-100 pt-3">
            <Field label="ความเห็นของโรงงาน (หลังการตรวจสอบ)">
              <textarea disabled={!canEditFactory} className={inputCls} rows={5} value={form.factory_comment}
                placeholder={canEditFactory ? "กรอกผลตรวจสอบ..." : "รอฝ่ายโรงงาน/QC ตรวจสอบ"}
                onChange={e => setField("factory_comment", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-gray-100">
          {canEditRequest && (
            <button type="button" disabled={saving} onClick={() => save(false)}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          )}
          {canEditFactory && row?.status !== "resolved" && (
            <button type="button" disabled={saving} onClick={() => save(true)}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึก + ปิดงาน (ตรวจสอบแล้ว)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
