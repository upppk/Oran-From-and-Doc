"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ClipboardCheck,
  ShieldCheck,
  Database,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  FileWarning,
  PackageSearch,
} from "lucide-react";

interface SidebarProps {
  userEmail: string;
  fullName: string | null;
  role: string;
}

const NAV_ITEMS = [
  { href: "/price-approval", label: "ใบขออนุมัติราคาพิเศษ", icon: ClipboardCheck },
  { href: "/quality-claims", label: "ใบเคลมคุณภาพ", icon: FileWarning },
  { href: "/sample-requests", label: "ใบขอสินค้าตัวอย่าง", icon: PackageSearch },
];

const ROLE_LABEL: Record<string, { text: string; cls: string }> = {
  admin:             { text: "Admin",             cls: "bg-red-500/20 text-red-300" },
  sales:             { text: "พนักงานขาย",         cls: "bg-teal-500/20 text-teal-300" },
  area_head:         { text: "หัวหน้าภาคการขาย",   cls: "bg-orange-500/20 text-orange-300" },
  marketing_manager: { text: "ผจก.การตลาด",        cls: "bg-indigo-500/20 text-indigo-300" },
  factory:           { text: "ฝ่ายโรงงาน/QC",      cls: "bg-cyan-500/20 text-cyan-300" },
  warehouse:         { text: "ฝ่ายคลังสินค้า",     cls: "bg-lime-500/20 text-lime-300" },
  viewer:            { text: "Viewer",             cls: "bg-white/10 text-white/50" },
};

export default function Sidebar({ userEmail, fullName, role }: SidebarProps) {
  const supabase = createClient();
  const [pathname, setPathname] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const roleBadge = ROLE_LABEL[role] ?? ROLE_LABEL.viewer;

  function isActive(href: string) {
    if (!pathname) return false;
    return pathname.startsWith(href);
  }

  const allNavItems = [
    ...NAV_ITEMS,
    ...(role === "admin" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
    ...(role === "admin" ? [{ href: "/admin/master-data", label: "ข้อมูลสินค้า/ลูกค้า", icon: Database }] : []),
  ];

  const NavLink = ({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: React.ElementType; onClick?: () => void }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
        style={{
          backgroundColor: active ? "#d97706" : "transparent",
          color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
          fontWeight: active ? 600 : 400,
        }}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-60 min-h-screen shrink-0"
        style={{ backgroundColor: "#1a1d29" }}
      >
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#d97706" }}>
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm leading-tight block">แบบฟอร์มต่างๆ</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map(item => <NavLink key={item.href} {...item} />)}
        </nav>

        <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

        <div className="px-4 py-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#d97706" }}>
              <span className="text-white text-xs font-bold">
                {(fullName ?? userEmail).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              {fullName && <p className="text-sm font-medium text-white truncate">{fullName}</p>}
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{userEmail}</p>
              <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${roleBadge.cls}`}>
                {roleBadge.text}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "#1a1d29" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#d97706" }}>
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm">แบบฟอร์มต่างๆ</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white p-1">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative flex flex-col w-72 max-w-[85vw] min-h-screen"
            style={{ backgroundColor: "#1a1d29" }}
          >
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#d97706" }}>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white text-sm">แบบฟอร์มต่างๆ</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/60 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {allNavItems.map(item => (
                <NavLink key={item.href} {...item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

            <div className="px-4 py-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#d97706" }}>
                  <span className="text-white text-xs font-bold">
                    {(fullName ?? userEmail).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  {fullName && <p className="text-sm font-medium text-white truncate">{fullName}</p>}
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{userEmail}</p>
                  <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${roleBadge.cls}`}>
                    {roleBadge.text}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
