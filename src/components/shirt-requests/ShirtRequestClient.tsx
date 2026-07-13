"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Printer, Pencil, Trash2 } from "lucide-react";
import ShirtRequestForm from "./ShirtRequestForm";
import ShirtRequestPrint from "./ShirtRequestPrint";
import { ShirtRequestRow, ShirtRequestStatus, STATUS_LABEL } from "./types";

interface Props {
  initialRows: ShirtRequestRow[];
  currentUserId: string;
  currentUserName: string;
  role: string;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

export default function ShirtRequestClient({ initialRows, currentUserId, currentUserName, role }: Props) {
  const supabase = createClient();
  const [rows, setRows] = useState<ShirtRequestRow[]>(initialRows);
  const [statusFilter, setStatusFilter] = useState<ShirtRequestStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<ShirtRequestRow | null>(null);
  const [viewRow, setViewRow] = useState<ShirtRequestRow | null>(null);
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
    if (statusFilter !== "all") r = r.filter(x => x.status === statusFilter);
    return r;
  }, [rows, statusFilter]);

  function canEdit(r: ShirtRequestRow) {
    return role === "admin" || role === "marketing_manager" || r.requester_id === currentUserId;
  }
  function canDelete(r: ShirtRequestRow) {
    return role === "admin" || (r.requester_id === currentUserId && r.status === "pending");
  }

  async function deleteRow(r: ShirtRequestRow) {
    if (!confirm(`ลบใบติดต่อภายในของ ${r.from_name ?? ""}?`)) return;
    await supabase.from("shirt_requests").delete().eq("id", r.id);
    setRows(prev => prev.filter(x => x.id !== r.id));
  }

  const printDoc = viewRow ? {
    request_date: viewRow.request_date, to_person: viewRow.to_person,
    from_name: viewRow.from_name, from_position: viewRow.from_position,
    subject: viewRow.subject, quantity: viewRow.quantity, reason: viewRow.reason,
    project_note: viewRow.project_note, status: viewRow.status, approver_initials: viewRow.approver_initials,
  } : null;

  const FILTERS: (ShirtRequestStatus | "all")[] = ["all", "pending", "approved", "rejected"];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">ใบติดต่อภายใน</h1>
        <button onClick={() => { setEditRow(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> สร้างใบขอใหม่
        </button>
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
        {visibleRows.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-800 text-sm">{r.from_name || "(ไม่ระบุชื่อ)"}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span>
            </div>
            <p className="text-xs text-gray-500">{r.subject || "—"} {r.quantity ? `· ${r.quantity} ตัว` : ""} · {fmtDate(r.request_date)}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={() => setViewRow(r)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600"><Printer className="w-3.5 h-3.5" /> ดู/พิมพ์</button>
              {canEdit(r) && <button onClick={() => { setEditRow(r); setFormOpen(true); }} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600"><Pencil className="w-3.5 h-3.5" /> แก้ไข</button>}
              {canDelete(r) && <button onClick={() => deleteRow(r)} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 rounded-lg text-xs text-red-600"><Trash2 className="w-3.5 h-3.5" /> ลบ</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <table className="hidden md:table w-full text-sm bg-white rounded-xl overflow-hidden border border-gray-100">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs">
            <th className="px-4 py-2.5 text-left">ผู้ขอ</th>
            <th className="px-4 py-2.5 text-left">เรื่อง</th>
            <th className="px-4 py-2.5 text-right">จำนวน</th>
            <th className="px-4 py-2.5 text-left">วันที่</th>
            <th className="px-4 py-2.5 text-left">สถานะ</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(r => (
            <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{r.from_name || "(ไม่ระบุชื่อ)"}</td>
              <td className="px-4 py-3 text-gray-600">{r.subject || "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.quantity ?? "—"}</td>
              <td className="px-4 py-3 text-gray-500">{fmtDate(r.request_date)}</td>
              <td className="px-4 py-3"><span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span></td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setViewRow(r)} className="p-1.5 text-gray-400 hover:text-gray-700" title="ดู/พิมพ์"><Printer className="w-4 h-4" /></button>
                  {canEdit(r) && <button onClick={() => { setEditRow(r); setFormOpen(true); }} className="p-1.5 text-gray-400 hover:text-amber-600" title="แก้ไข"><Pencil className="w-4 h-4" /></button>}
                  {canDelete(r) && <button onClick={() => deleteRow(r)} className="p-1.5 text-gray-400 hover:text-red-600" title="ลบ"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {formOpen && (
        <ShirtRequestForm
          row={editRow} currentUserId={currentUserId} currentUserName={currentUserName} role={role}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setRows(prev => {
              const exists = prev.some(x => x.id === saved.id);
              return exists ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev];
            });
            setFormOpen(false);
          }}
        />
      )}

      {viewRow && printDoc && (
        <div className="print-modal fixed inset-0 z-50 bg-white overflow-auto">
          <div className="no-print flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-gray-50 flex-wrap gap-2">
            <p className="font-semibold text-gray-800 text-sm">ใบติดต่อภายใน — {viewRow.from_name}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setTimeout(() => window.print(), 50)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                <Printer className="w-4 h-4" /> พิมพ์ / PDF
              </button>
              <button onClick={() => setViewRow(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">ปิด</button>
            </div>
          </div>
          <div ref={containerRef} className="print-scale-outer" style={{ overflow: "hidden" }}>
            <div className="print-scale-wrapper" style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: scale < 1 ? `${100 / scale}%` : undefined }}>
              <ShirtRequestPrint doc={printDoc} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
