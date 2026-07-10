"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Plus } from "lucide-react";
import LineItemGroup from "./LineItemGroup";
import {
  LineItemForm, SalesProduct, SalesCustomer, PriceApprovalRow,
  computeTotals, emptyLine,
} from "./types";

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
  doc_no: string; request_date: string; salesperson_name: string;
  effective_date: string; expiry_date: string;
  customer_code: string; customer_name: string; zone_province: string;
  credit_days: string; freight_rate_baht_per_ton: string;
  delivery_condition: string; freight_support_baht_per_ton: string;
  claim_percent: string; quarterly_percent: string; memo: string;
  groups: { category_code: string; category_label: string; lines: LineItemForm[] }[];
}

function toFormState(row: PriceApprovalRow | null, defaultSalespersonName: string): FormState {
  if (!row) {
    return {
      doc_no: "", request_date: todayStr(), salesperson_name: defaultSalespersonName,
      effective_date: todayStr(), expiry_date: "",
      customer_code: "", customer_name: "", zone_province: "",
      credit_days: "0", freight_rate_baht_per_ton: "",
      delivery_condition: "company_deliver", freight_support_baht_per_ton: "0",
      claim_percent: "", quarterly_percent: "0", memo: "",
      groups: [{ category_code: "A", category_label: "", lines: [emptyLine("A", "")] }],
    };
  }
  const lines = Array.isArray(row.lines) ? row.lines as LineItemForm[] : [];
  const groupMap = new Map<string, { category_code: string; category_label: string; lines: LineItemForm[] }>();
  for (const l of lines) {
    const key = l.category_code || "-";
    if (!groupMap.has(key)) groupMap.set(key, { category_code: l.category_code, category_label: l.category_label, lines: [] });
    groupMap.get(key)!.lines.push(l);
  }
  return {
    doc_no: row.doc_no, request_date: row.request_date, salesperson_name: row.salesperson_name,
    effective_date: row.effective_date ?? "", expiry_date: row.expiry_date ?? "",
    customer_code: row.customer_code ?? "", customer_name: row.customer_name, zone_province: row.zone_province ?? "",
    credit_days: String(row.credit_days ?? 0), freight_rate_baht_per_ton: row.freight_rate_baht_per_ton != null ? String(row.freight_rate_baht_per_ton) : "",
    delivery_condition: row.delivery_condition ?? "company_deliver", freight_support_baht_per_ton: String(row.freight_support_baht_per_ton ?? 0),
    claim_percent: row.claim_percent ?? "", quarterly_percent: String(row.quarterly_percent ?? 0), memo: row.memo ?? "",
    groups: groupMap.size ? Array.from(groupMap.values()) : [{ category_code: "A", category_label: "", lines: [emptyLine("A", "")] }],
  };
}

interface Props {
  row: PriceApprovalRow | null;
  products: SalesProduct[];
  customers: SalesCustomer[];
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onSaved: (row: PriceApprovalRow) => void;
}

export default function PriceApprovalForm({ row, products, customers, currentUserId, currentUserName, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(() => toFormState(row, currentUserName));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [custSuggest, setCustSuggest] = useState(false);

  const allLines = form.groups.flatMap(g => g.lines);
  const totals = computeTotals(allLines);

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function pickCustomer(c: SalesCustomer) {
    setForm(f => ({
      ...f, customer_code: c.code, customer_name: c.name,
      zone_province: c.zone_province ?? f.zone_province,
      credit_days: c.credit_days != null ? String(c.credit_days) : f.credit_days,
      freight_rate_baht_per_ton: c.freight_baht_per_ton != null ? String(c.freight_baht_per_ton) : f.freight_rate_baht_per_ton,
    }));
    setCustSuggest(false);
  }

  function changeLine(gi: number, li: number, field: keyof LineItemForm, val: string) {
    setForm(f => {
      const groups = [...f.groups];
      const lines = [...groups[gi].lines];
      lines[li] = { ...lines[li], [field]: val };
      groups[gi] = { ...groups[gi], lines };
      return { ...f, groups };
    });
  }
  function addLine(gi: number) {
    setForm(f => {
      const groups = [...f.groups];
      groups[gi] = { ...groups[gi], lines: [...groups[gi].lines, emptyLine(groups[gi].category_code, groups[gi].category_label)] };
      return { ...f, groups };
    });
  }
  function removeLine(gi: number, li: number) {
    setForm(f => {
      const groups = [...f.groups];
      groups[gi] = { ...groups[gi], lines: groups[gi].lines.filter((_, i) => i !== li) };
      return { ...f, groups };
    });
  }
  function addGroup() {
    setForm(f => ({ ...f, groups: [...f.groups, { category_code: "", category_label: "", lines: [emptyLine()] }] }));
  }
  function removeGroup(gi: number) {
    setForm(f => ({ ...f, groups: f.groups.filter((_, i) => i !== gi) }));
  }
  function setGroupMeta(gi: number, field: "category_code" | "category_label", val: string) {
    setForm(f => {
      const groups = [...f.groups];
      const lines = groups[gi].lines.map(l => ({ ...l, [field]: val }));
      groups[gi] = { ...groups[gi], [field]: val, lines };
      return { ...f, groups };
    });
  }

  function buildPayload(status: PriceApprovalRow["status"]) {
    const lines = form.groups.flatMap(g => g.lines).filter(l => l.product_code.trim() || l.product_name.trim());
    const t = computeTotals(lines);
    return {
      doc_no: form.doc_no.trim(),
      request_date: form.request_date,
      salesperson_name: form.salesperson_name.trim(),
      effective_date: form.effective_date || null,
      expiry_date: form.expiry_date || null,
      customer_code: form.customer_code || null,
      customer_name: form.customer_name.trim(),
      zone_province: form.zone_province || null,
      credit_days: form.credit_days ? parseInt(form.credit_days) : 0,
      freight_rate_baht_per_ton: form.freight_rate_baht_per_ton ? parseFloat(form.freight_rate_baht_per_ton) : null,
      delivery_condition: form.delivery_condition,
      freight_support_baht_per_ton: form.freight_support_baht_per_ton ? parseFloat(form.freight_support_baht_per_ton) : 0,
      claim_percent: form.claim_percent || null,
      quarterly_percent: form.quarterly_percent ? parseFloat(form.quarterly_percent) : 0,
      memo: form.memo || null,
      lines,
      total_weight_kg: t.total_weight_kg,
      total_amount: t.total_amount,
      overall_baht_per_ton: t.overall_baht_per_ton,
      status,
    };
  }

  async function save(status: PriceApprovalRow["status"]) {
    setSaving(true); setErr("");
    if (!form.doc_no.trim()) { setErr("กรุณากรอกเลขที่ใบปอ"); setSaving(false); return; }
    if (!form.customer_name.trim()) { setErr("กรุณากรอกชื่อลูกค้า"); setSaving(false); return; }
    const payload = buildPayload(status);

    let resp;
    if (row) {
      const isResubmit = row.status === "rejected" && status === "pending_area_head";
      resp = await supabase.from("price_approvals").update({
        ...payload,
        updated_at: new Date().toISOString(),
        ...(isResubmit ? { area_head_id: null, area_head_approved_at: null, rejected_by: null, rejected_at: null, rejected_reason: null } : {}),
      }).eq("id", row.id).select("*").single();
    } else {
      resp = await supabase.from("price_approvals").insert({ ...payload, created_by: currentUserId }).select("*").single();
    }
    setSaving(false);
    if (resp.error) { setErr(resp.error.message); return; }
    onSaved(resp.data as PriceApprovalRow);
  }

  const custMatches = custSuggest
    ? (form.customer_code
        ? customers.filter(c => c.code.toLowerCase().includes(form.customer_code.toLowerCase()) || c.name.toLowerCase().includes(form.customer_code.toLowerCase())).slice(0, 30)
        : customers.slice(0, 30))
    : [];

  const editable = !row || row.status === "draft" || row.status === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{row ? `แก้ไขใบขออนุมัติราคาพิเศษ ${row.doc_no}` : "สร้างใบขออนุมัติราคาพิเศษ"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{err}</div>}
          {row?.status === "rejected" && row.rejected_reason && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              <strong>เหตุผลที่ไม่อนุมัติ:</strong> {row.rejected_reason}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="เลขที่ใบปอ *"><input required disabled={!editable} className={inputCls} value={form.doc_no} onChange={e => setField("doc_no", e.target.value)} /></Field>
            <Field label="วันที่ทำรายการ"><input type="date" disabled={!editable} className={inputCls} value={form.request_date} onChange={e => setField("request_date", e.target.value)} /></Field>
            <Field label="วันที่มีผลบังคับใช้"><input type="date" disabled={!editable} className={inputCls} value={form.effective_date} onChange={e => setField("effective_date", e.target.value)} /></Field>
            <Field label="วันที่สิ้นสุด"><input type="date" disabled={!editable} className={inputCls} value={form.expiry_date} onChange={e => setField("expiry_date", e.target.value)} /></Field>
          </div>

          <Field label="ชื่อพนักงาน"><input disabled={!editable} className={inputCls} value={form.salesperson_name} onChange={e => setField("salesperson_name", e.target.value)} /></Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
            <Field label="รหัสลูกค้า (พิมพ์ค้นหา หรือกรอกเอง)">
              <input disabled={!editable} className={inputCls} value={form.customer_code}
                onChange={e => { setField("customer_code", e.target.value); setCustSuggest(true); }}
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
                  {customers.length > custMatches.length && (
                    <p className="px-3 py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
                      แสดง {custMatches.length} จากทั้งหมด {customers.length.toLocaleString("th-TH")} รายการ — พิมพ์เพื่อค้นหาให้ตรงมากขึ้น
                    </p>
                  )}
                </div>
              )}
            </Field>
            <Field label="ชื่อลูกค้า *"><input required disabled={!editable} className={inputCls} value={form.customer_name} onChange={e => setField("customer_name", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="เขตจังหวัด"><input disabled={!editable} className={inputCls} value={form.zone_province} onChange={e => setField("zone_province", e.target.value)} /></Field>
            <Field label="เครดิต (วัน / 0=เงินสด)"><input disabled={!editable} type="number" className={inputCls} value={form.credit_days} onChange={e => setField("credit_days", e.target.value)} /></Field>
            <Field label="ค่าขนส่ง (บาท/ตัน)"><input disabled={!editable} type="number" className={inputCls} value={form.freight_rate_baht_per_ton} onChange={e => setField("freight_rate_baht_per_ton", e.target.value)} /></Field>
            <Field label="ช่วยค่าขนส่ง (บาท/ตัน)"><input disabled={!editable} type="number" className={inputCls} value={form.freight_support_baht_per_ton} onChange={e => setField("freight_support_baht_per_ton", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="เงื่อนไขการส่ง">
              <select disabled={!editable} className={inputCls} value={form.delivery_condition} onChange={e => setField("delivery_condition", e.target.value)}>
                <option value="company_deliver">บริษัทส่งให้</option>
                <option value="customer_pickup">ลูกค้ารับเอง</option>
              </select>
            </Field>
            <Field label="เคลม (เช่น F001)"><input disabled={!editable} className={inputCls} value={form.claim_percent} onChange={e => setField("claim_percent", e.target.value)} /></Field>
            <Field label="% ไตรมาส"><input disabled={!editable} type="number" className={inputCls} value={form.quarterly_percent} onChange={e => setField("quarterly_percent", e.target.value)} /></Field>
          </div>

          {/* Line item groups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">รายการสินค้า</p>
              {editable && (
                <button type="button" onClick={addGroup} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium">
                  <Plus className="w-3.5 h-3.5" /> เพิ่มกลุ่มสินค้า
                </button>
              )}
            </div>
            {form.groups.map((g, gi) => (
              <div key={gi}>
                {editable && (
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <input className={inputCls + " text-xs"} placeholder="รหัสกลุ่ม เช่น A" value={g.category_code}
                      onChange={e => setGroupMeta(gi, "category_code", e.target.value)} />
                    <input className={inputCls + " text-xs"} placeholder="ชื่อกลุ่ม เช่น กลุ่มใยหิน" value={g.category_label}
                      onChange={e => setGroupMeta(gi, "category_label", e.target.value)} />
                  </div>
                )}
                <LineItemGroup
                  categoryCode={g.category_code} categoryLabel={g.category_label}
                  lines={g.lines} products={products} readOnly={!editable}
                  onChangeLine={(li, field, val) => changeLine(gi, li, field, val)}
                  onAddLine={() => addLine(gi)}
                  onRemoveLine={(li) => removeLine(gi, li)}
                  onRemoveGroup={() => removeGroup(gi)}
                />
              </div>
            ))}
          </div>

          {/* Live totals preview */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-right space-y-1">
            <p>น้ำหนัก (กก.) : <strong>{totals.total_weight_kg.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong></p>
            <p className="text-base font-bold text-gray-800">= {totals.overall_baht_per_ton.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท/ตัน</p>
            <p>จำนวนเงิน : <strong>{totals.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong></p>
          </div>

          <Field label="Memo"><textarea disabled={!editable} className={inputCls} rows={3} value={form.memo} onChange={e => setField("memo", e.target.value)} /></Field>
        </div>

        {editable && (
          <div className="flex gap-2 px-5 py-3 border-t border-gray-100">
            <button type="button" disabled={saving} onClick={() => save("draft")}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึกร่าง"}
            </button>
            <button type="button" disabled={saving} onClick={() => save("pending_area_head")}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "กำลังบันทึก..." : "ส่งขออนุมัติ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
