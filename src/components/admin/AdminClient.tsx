"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Clock, Shield, UserCheck, Users, Briefcase, Eye, Factory, Warehouse } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  created_at: string;
  role?: string;
}

const ROLES = [
  { value: "admin",             label: "Admin",             desc: "จัดการผู้ใช้/สิทธิ์ และแก้ไข/ลบได้ทุกอย่าง",           icon: Shield,    color: "text-red-600 bg-red-50 border-red-200" },
  { value: "sales",             label: "พนักงานขาย",       desc: "สร้าง/แก้ไขใบขออนุมัติราคาพิเศษ และส่งขออนุมัติ",     icon: UserCheck, color: "text-teal-600 bg-teal-50 border-teal-200" },
  { value: "area_head",         label: "หัวหน้าภาคการขาย", desc: "อนุมัติใบขออนุมัติราคาพิเศษ ขั้นที่ 1",                icon: Users,     color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "marketing_manager", label: "ผจก.การตลาด",      desc: "อนุมัติใบขออนุมัติราคาพิเศษ ขั้นสุดท้าย",              icon: Briefcase, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { value: "factory",           label: "ฝ่ายโรงงาน/QC",    desc: "ตรวจสอบและตอบกลับใบเคลมคุณภาพ",                        icon: Factory,   color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { value: "warehouse",         label: "ฝ่ายคลังสินค้า",   desc: "ตรวจสอบและอนุมัติใบขอสินค้าตัวอย่าง",                  icon: Warehouse, color: "text-lime-600 bg-lime-50 border-lime-200" },
  { value: "viewer",            label: "Viewer",            desc: "ดูข้อมูลอย่างเดียว",                                   icon: Eye,       color: "text-gray-600 bg-gray-50 border-gray-200" },
];

export default function AdminClient({ users: initial }: { users: UserRow[] }) {
  const supabase = createClient();
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  async function setApproval(id: string, approved: boolean) {
    setLoading(id);
    await supabase.from("profiles").update({ is_approved: approved }).eq("id", id);
    setUsers(u => u.map(x => x.id === id ? { ...x, is_approved: approved } : x));
    setLoading(null);
  }

  async function setRole(id: string, role: string) {
    setRoleLoading(id + role);
    await supabase.from("user_profiles").upsert({ id, role }, { onConflict: "id" });
    setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
    setRoleLoading(null);
  }

  const pending = users.filter(u => !u.is_approved);
  const approved = users.filter(u => u.is_approved);

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function UserCard({ u }: { u: UserRow }) {
    const currentRole = u.role ?? "viewer";
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-amber-700 font-bold text-sm">
                {(u.full_name ?? u.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              {u.full_name && <p className="text-sm font-medium text-gray-800 truncate">{u.full_name}</p>}
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
              <p className="text-xs text-gray-400">{fmtDate(u.created_at)}</p>
            </div>
          </div>
          {u.is_approved ? (
            <button
              onClick={() => setApproval(u.id, false)}
              disabled={loading === u.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
            >
              <XCircle className="w-3.5 h-3.5" />
              ยกเลิก
            </button>
          ) : (
            <button
              onClick={() => setApproval(u.id, true)}
              disabled={loading === u.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {loading === u.id ? "..." : "อนุมัติ"}
            </button>
          )}
        </div>

        {u.is_approved && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5">สิทธิ์การใช้งาน</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map(r => {
                const Icon = r.icon;
                const active = currentRole === r.value;
                const isLoading = roleLoading === u.id + r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => setRole(u.id, r.value)}
                    disabled={isLoading}
                    title={r.desc}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                      active ? r.color + " border-current" : "text-gray-400 bg-gray-50 border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {isLoading ? "..." : r.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {ROLES.find(r => r.value === currentRole)?.desc}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-2">จัดการผู้ใช้งาน</h1>
      <div className="mb-6 space-y-1">
        {ROLES.map(r => <p key={r.value} className="text-xs text-gray-500"><strong>{r.label}</strong>: {r.desc}</p>)}
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-700">รอการอนุมัติ ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">ไม่มีคำขอที่รออยู่</p>
        ) : (
          <div className="space-y-2">
            {pending.map(u => <UserCard key={u.id} u={u} />)}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <h2 className="text-sm font-semibold text-gray-700">อนุมัติแล้ว ({approved.length})</h2>
        </div>
        <div className="space-y-2">
          {approved.map(u => <UserCard key={u.id} u={u} />)}
        </div>
      </div>
    </div>
  );
}
