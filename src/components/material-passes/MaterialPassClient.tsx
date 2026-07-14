"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Printer, Pencil, Trash2 } from "lucide-react";
import MaterialPassForm from "./MaterialPassForm";
import MaterialPassPrint from "./MaterialPassPrint";
import { MaterialPassRow, MaterialPassStatus, STATUS_LABEL, parseItems } from "./types";

interface Props {
  initialRows: MaterialPassRow[];
  currentUserId: string;
  currentUserName: string;
  role: string;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

export default function MaterialPassClient({ initialRows, currentUserId, currentUserName, role }: Props) {
  const supabase = createClient();
  const [rows, setRows] = useState<MaterialPassRow[]>(initialRows);
  const [statusFilter, setStatusFilter] = useState<MaterialPassStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<MaterialPassRow | null>(null);
  const [viewRow, setViewRow] = useState<MaterialPassRow | null>(null);
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

  function canEdit(r: MaterialPassRow) {
    return role === "admin" || role === "warehouse" || r.requester_id === currentUserId;
  }
  function canDelete(r: MaterialPassRow) {
    return role === "admin" || (r.requester_id === currentUserId && r.status === "pending");
  }

  async function deleteRow(r: MaterialPassRow) {
    if (!confirm(`ลบใบผ่านวัสดุ ${r.doc_no ?? ""}?`)) return;
    await supabase.from("material_passes").delete().eq("id", r.id);
    setRows(prev => prev.filter(x => x.id !== r.id));
  }

  const printDoc = viewRow ? {
    doc_no: viewRow.doc_no, book_no: viewRow.book_no, pass_date: viewRow.pass_date,
    destination: viewRow.destination, vehicle_no: viewRow.vehicle_no, driver_name: viewRow.driver_name,
    issue_time: viewRow.issue_time, items: parseItems(viewRow.items),
    issuer_name: viewRow.issuer_name, received_origin_name: viewRow.received_origin_name,
    received_dest_name: viewRow.received_dest_name,
    exit_no: viewRow.exit_no, exit_date: viewRow.exit_date, exit_time: viewRow.exit_time,
    warehouse_head_name: viewRow.warehouse_head_name, gate_guard_name: viewRow.gate_guard_name,
    status: viewRow.status,
  } : null;

  const FILTERS: (MaterialPassStatus | "all")[] = ["all", "pending", "exited", "rejected"];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">ใบผ่านวัสดุออกนอกโรงงาน</h1>
        <button onClick={() => { setEditRow(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> สร้างใบผ่านใหม่
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
              <p className="font-mono font-semibold text-gray-800 text-sm">{r.doc_no || "-"}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span>
            </div>
            <p className="text-xs text-gray-500">{r.destination || "—"} · {fmtDate(r.pass_date)}</p>
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
            <th className="px-4 py-2.5 text-left">เลขที่</th>
            <th className="px-4 py-2.5 text-left">สถานที่ส่ง</th>
            <th className="px-4 py-2.5 text-left">ทะเบียนรถ</th>
            <th className="px-4 py-2.5 text-left">วันที่</th>
            <th className="px-4 py-2.5 text-left">สถานะ</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(r => (
            <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3 font-mono font-medium text-gray-800">{r.doc_no || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{r.destination || "—"}</td>
              <td className="px-4 py-3 text-gray-500">{r.vehicle_no || "—"}</td>
              <td className="px-4 py-3 text-gray-500">{fmtDate(r.pass_date)}</td>
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
        <MaterialPassForm
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
            <p className="font-semibold text-gray-800 text-sm">ใบผ่านวัสดุ — {viewRow.doc_no}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setTimeout(() => window.print(), 50)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                <Printer className="w-4 h-4" /> พิมพ์ / PDF
              </button>
              <button onClick={() => setViewRow(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">ปิด</button>
            </div>
          </div>
          <div ref={containerRef} className="print-scale-outer" style={{ overflow: "hidden" }}>
            <div className="print-scale-wrapper" style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: scale < 1 ? `${100 / scale}%` : undefined }}>
              <MaterialPassPrint doc={printDoc} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
