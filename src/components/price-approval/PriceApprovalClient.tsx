"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Printer, Pencil, Trash2, Check, X as XIcon, FileDown } from "lucide-react";
import PriceApprovalForm from "./PriceApprovalForm";
import PriceApprovalPrint from "./PriceApprovalPrint";
import { PriceApprovalRow, SalesProduct, SalesCustomer, PriceApprovalStatus, STATUS_LABEL, parseLines, computeTotals, lineAmount, lineWeightKg, bahtPerTon } from "./types";
import { notifySubmittedForApproval, notifyPendingMarketing, notifyApproved, notifyRejected } from "@/lib/notify";

interface Props {
  initialRows: PriceApprovalRow[];
  products: SalesProduct[];
  customers: SalesCustomer[];
  currentUserId: string;
  currentUserName: string;
  role: string;
  userNames: Record<string, string>;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

export default function PriceApprovalClient({ initialRows, products, customers, currentUserId, currentUserName, role, userNames }: Props) {
  const supabase = createClient();
  const [rows, setRows] = useState<PriceApprovalRow[]>(initialRows);
  const [statusFilter, setStatusFilter] = useState<PriceApprovalStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<PriceApprovalRow | null>(null);
  const [viewRow, setViewRow] = useState<PriceApprovalRow | null>(null);
  const [rejectFor, setRejectFor] = useState<PriceApprovalRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewRow) return;
    const calc = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const a4px = 794;
      setScale(Math.min(1, w / a4px));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [viewRow]);

  const visibleRows = useMemo(() => {
    let r = rows;
    if (role === "sales") r = r.filter(x => x.created_by === currentUserId || x.status !== "draft");
    if (statusFilter !== "all") r = r.filter(x => x.status === statusFilter);
    return r;
  }, [rows, statusFilter, role, currentUserId]);

  function canEdit(r: PriceApprovalRow) {
    if (role === "admin") return true;
    if (role !== "sales") return false;
    if (r.created_by !== currentUserId) return false;
    return r.status === "draft" || r.status === "rejected";
  }
  function canDelete(r: PriceApprovalRow) {
    return role === "admin" || (role === "sales" && r.created_by === currentUserId && r.status === "draft");
  }
  function canApprove(r: PriceApprovalRow) {
    if (role === "admin") return r.status === "pending_area_head" || r.status === "pending_marketing";
    if (role === "area_head") return r.status === "pending_area_head";
    if (role === "marketing_manager") return r.status === "pending_marketing";
    return false;
  }

  function amountLineFor(r: PriceApprovalRow) {
    const t = computeTotals(parseLines(r.lines));
    return `จำนวนเงิน: ${t.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท (${t.overall_baht_per_ton.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท/ตัน)`;
  }

  async function approve(r: PriceApprovalRow) {
    const isStage1 = r.status === "pending_area_head";
    const patch = isStage1
      ? { status: "pending_marketing" as const, area_head_id: currentUserId, area_head_approved_at: new Date().toISOString() }
      : { status: "approved" as const, marketing_manager_id: currentUserId, marketing_approved_at: new Date().toISOString() };
    const { data, error } = await supabase.from("price_approvals").update(patch).eq("id", r.id).select("*").single();
    if (!error && data) {
      setRows(prev => prev.map(x => x.id === r.id ? data as PriceApprovalRow : x));
      setViewRow(data as PriceApprovalRow);
      if (isStage1) {
        notifyPendingMarketing(r.doc_no, r.customer_name, amountLineFor(r));
      } else if (r.created_by) {
        notifyApproved(r.created_by, r.doc_no, r.customer_name, amountLineFor(r));
      }
    }
  }

  async function submitReject() {
    if (!rejectFor) return;
    const { data, error } = await supabase.from("price_approvals").update({
      status: "rejected", rejected_by: currentUserId, rejected_at: new Date().toISOString(), rejected_reason: rejectReason,
    }).eq("id", rejectFor.id).select("*").single();
    if (!error && data) {
      setRows(prev => prev.map(x => x.id === rejectFor.id ? data as PriceApprovalRow : x));
      if (rejectFor.created_by) notifyRejected(rejectFor.created_by, rejectFor.doc_no, rejectFor.customer_name, rejectReason);
    }
    setRejectFor(null); setRejectReason("");
  }

  async function deleteRow(r: PriceApprovalRow) {
    if (!confirm(`ลบใบ ${r.doc_no}?`)) return;
    await supabase.from("price_approvals").delete().eq("id", r.id);
    setRows(prev => prev.filter(x => x.id !== r.id));
  }

  function openPrint(r: PriceApprovalRow) {
    setViewRow(r);
  }

  const printDoc = viewRow ? {
    doc_no: viewRow.doc_no, request_date: viewRow.request_date, salesperson_name: viewRow.salesperson_name,
    effective_date: viewRow.effective_date, expiry_date: viewRow.expiry_date,
    customer_code: viewRow.customer_code, customer_name: viewRow.customer_name, zone_province: viewRow.zone_province,
    credit_days: viewRow.credit_days, freight_rate_baht_per_ton: viewRow.freight_rate_baht_per_ton,
    delivery_condition: viewRow.delivery_condition, freight_support_baht_per_ton: viewRow.freight_support_baht_per_ton,
    claim_percent: viewRow.claim_percent, quarterly_percent: viewRow.quarterly_percent, memo: viewRow.memo,
    lines: parseLines(viewRow.lines).map(l => ({
      category_code: l.category_code, category_label: l.category_label,
      product_code: l.product_code, product_name: l.product_name,
      weight_per_unit_kg: parseFloat(l.weight_per_unit_kg) || 0,
      qty: parseFloat(l.qty) || 0,
      list_price: parseFloat(l.list_price) || 0,
      discount_percent: parseFloat(l.discount_percent) || 0,
      requested_unit_price: parseFloat(l.requested_unit_price) || 0,
    })),
    status: viewRow.status,
    area_head_name: viewRow.area_head_id ? (userNames[viewRow.area_head_id] ?? "อนุมัติแล้ว") : null,
    area_head_approved_at: viewRow.area_head_approved_at,
    marketing_manager_name: viewRow.marketing_manager_id ? (userNames[viewRow.marketing_manager_id] ?? "อนุมัติแล้ว") : null,
    marketing_approved_at: viewRow.marketing_approved_at,
  } : null;

  const FILTERS: (PriceApprovalStatus | "all")[] = ["all", "draft", "pending_area_head", "pending_marketing", "approved", "rejected"];

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = visibleRows.map(r => {
      const t = computeTotals(parseLines(r.lines));
      return {
        "เลขที่ใบปอ": r.doc_no,
        "ลูกค้า": r.customer_name,
        "รหัสลูกค้า": r.customer_code ?? "",
        "เขตจังหวัด": r.zone_province ?? "",
        "วันที่ทำรายการ": r.request_date,
        "พนักงานขาย": r.salesperson_name,
        "น้ำหนัก (กก.)": t.total_weight_kg,
        "บาท/ตัน": Math.round(t.overall_baht_per_ton * 100) / 100,
        "จำนวนเงิน": t.total_amount,
        "สถานะ": STATUS_LABEL[r.status].text,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 14 }, { wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
      { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    ];

    const itemRows = visibleRows.flatMap(r =>
      parseLines(r.lines).map(l => ({
        "เลขที่ใบปอ": r.doc_no,
        "ลูกค้า": r.customer_name,
        "กลุ่มสินค้า": l.category_code ? `${l.category_code} : ${l.category_label}` : (l.category_label || ""),
        "รหัสสินค้า": l.product_code,
        "ชื่อสินค้า": l.product_name,
        "น.น./หน่วย (กก.)": parseFloat(l.weight_per_unit_kg) || 0,
        "จำนวน": parseFloat(l.qty) || 0,
        "ราคาตั้ง": parseFloat(l.list_price) || 0,
        "%ขอ": parseFloat(l.discount_percent) || 0,
        "ราคาขอ/หน่วย": parseFloat(l.requested_unit_price) || 0,
        "บาท/ตัน": Math.round(bahtPerTon(lineAmount(l), lineWeightKg(l)) * 100) / 100,
        "จำนวนเงิน": lineAmount(l),
      }))
    );
    const wsItems = XLSX.utils.json_to_sheet(itemRows);
    wsItems["!cols"] = [
      { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 14 }, { wch: 32 },
      { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สรุปใบขออนุมัติ");
    XLSX.utils.book_append_sheet(wb, wsItems, "รายการสินค้า");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `ใบขออนุมัติราคาพิเศษ-${stamp}.xlsx`);
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">ใบขออนุมัติราคาพิเศษ</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium">
            <FileDown className="w-4 h-4" /> Export Excel
          </button>
          {(role === "sales" || role === "admin") && (
            <button onClick={() => { setEditRow(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> สร้างใบใหม่
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f === "all" ? "ทั้งหมด" : STATUS_LABEL[f].text}
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {visibleRows.length === 0 && <p className="text-sm text-gray-400 text-center py-8">ไม่มีรายการ</p>}
        {visibleRows.map(r => {
          const t = computeTotals(parseLines(r.lines));
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono font-semibold text-gray-800 text-sm">{r.doc_no}</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span>
              </div>
              <p className="text-xs text-gray-500">{r.customer_name} · {fmtDate(r.request_date)}</p>
              <p className="text-xs text-gray-600 mt-1">{t.overall_baht_per_ton.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท/ตัน · {t.total_amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openPrint(r)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600"><Printer className="w-3.5 h-3.5" /> ดู/พิมพ์</button>
                {canEdit(r) && <button onClick={() => { setEditRow(r); setFormOpen(true); }} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600"><Pencil className="w-3.5 h-3.5" /> แก้ไข</button>}
                {canDelete(r) && <button onClick={() => deleteRow(r)} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 rounded-lg text-xs text-red-600"><Trash2 className="w-3.5 h-3.5" /> ลบ</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <table className="hidden md:table w-full text-sm bg-white rounded-xl overflow-hidden border border-gray-100">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs">
            <th className="px-4 py-2.5 text-left">เลขที่ใบปอ</th>
            <th className="px-4 py-2.5 text-left">ลูกค้า</th>
            <th className="px-4 py-2.5 text-left">วันที่</th>
            <th className="px-4 py-2.5 text-right">บาท/ตัน</th>
            <th className="px-4 py-2.5 text-right">จำนวนเงิน</th>
            <th className="px-4 py-2.5 text-left">สถานะ</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(r => {
            const t = computeTotals(parseLines(r.lines));
            return (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-gray-800">{r.doc_no}</td>
                <td className="px-4 py-3 text-gray-600">{r.customer_name}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(r.request_date)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.overall_baht_per_ton.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.total_amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3"><span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => openPrint(r)} className="p-1.5 text-gray-400 hover:text-gray-700" title="ดู/พิมพ์"><Printer className="w-4 h-4" /></button>
                    {canEdit(r) && <button onClick={() => { setEditRow(r); setFormOpen(true); }} className="p-1.5 text-gray-400 hover:text-amber-600" title="แก้ไข"><Pencil className="w-4 h-4" /></button>}
                    {canDelete(r) && <button onClick={() => deleteRow(r)} className="p-1.5 text-gray-400 hover:text-red-600" title="ลบ"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {formOpen && (
        <PriceApprovalForm
          row={editRow} products={products} customers={customers}
          currentUserId={currentUserId} currentUserName={currentUserName}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            const wasPending = editRow?.status === "pending_area_head";
            setRows(prev => {
              const exists = prev.some(x => x.id === saved.id);
              return exists ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev];
            });
            setFormOpen(false);
            if (saved.status === "pending_area_head" && !wasPending) {
              notifySubmittedForApproval(saved.doc_no, saved.customer_name, amountLineFor(saved));
            }
          }}
        />
      )}

      {viewRow && printDoc && (
        <div className="print-modal fixed inset-0 z-50 bg-white overflow-auto">
          <div className="no-print flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-gray-50 flex-wrap gap-2">
            <p className="font-semibold text-gray-800 text-sm">ใบเลขที่ {viewRow.doc_no}</p>
            <div className="flex gap-2 flex-wrap">
              {canApprove(viewRow) && (
                <>
                  <button onClick={() => approve(viewRow)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    <Check className="w-4 h-4" /> อนุมัติ
                  </button>
                  <button onClick={() => setRejectFor(viewRow)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                    <XIcon className="w-4 h-4" /> ไม่อนุมัติ
                  </button>
                </>
              )}
              <button onClick={() => setTimeout(() => window.print(), 50)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                <Printer className="w-4 h-4" /> พิมพ์ / PDF
              </button>
              <button onClick={() => setViewRow(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">ปิด</button>
            </div>
          </div>
          <div ref={containerRef} className="print-scale-outer" style={{ overflow: "hidden" }}>
            <div className="print-scale-wrapper" style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: scale < 1 ? `${100 / scale}%` : undefined }}>
              <PriceApprovalPrint doc={printDoc} />
            </div>
          </div>
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-2">เหตุผลที่ไม่อนุมัติ</h3>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" rows={3}
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="ระบุเหตุผล" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectFor(null); setRejectReason(""); }} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={submitReject} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium">ยืนยันไม่อนุมัติ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
