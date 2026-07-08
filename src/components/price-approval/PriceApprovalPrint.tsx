"use client";

import React from "react";

export interface PriceApprovalLine {
  category_code: string;
  category_label: string;
  product_code: string;
  product_name: string;
  weight_per_unit_kg: number;
  qty: number;
  list_price: number;
  discount_percent: number;
  requested_unit_price: number;
}

export interface PriceApprovalDoc {
  doc_no: string;
  request_date: string;
  salesperson_name: string;
  effective_date: string | null;
  expiry_date: string | null;
  customer_code: string | null;
  customer_name: string;
  zone_province: string | null;
  credit_days: number | null;
  freight_rate_baht_per_ton: number | null;
  delivery_condition: string | null;
  freight_support_baht_per_ton: number | null;
  claim_percent: string | null;
  quarterly_percent: number | null;
  memo: string | null;
  lines: PriceApprovalLine[];
  status: string;
  salesperson_name_signed?: string | null;
  area_head_name?: string | null;
  area_head_approved_at?: string | null;
  marketing_manager_name?: string | null;
  marketing_approved_at?: string | null;
}

function fmtNum(n: number, digits = 2) {
  if (!isFinite(n)) return "0.00";
  return n.toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function fmtDateTime(s: string | null | undefined) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

const cell: React.CSSProperties = { padding: "1.2mm 2mm", verticalAlign: "middle" };

function lineAmount(l: PriceApprovalLine) {
  return l.requested_unit_price * l.qty;
}
function lineWeightKg(l: PriceApprovalLine) {
  return l.weight_per_unit_kg * l.qty;
}
function bahtPerTon(amount: number, weightKg: number) {
  if (weightKg <= 0) return 0;
  return amount / (weightKg / 1000);
}

export default function PriceApprovalPrint({ doc }: { doc: PriceApprovalDoc }) {
  const groups = React.useMemo(() => {
    const map = new Map<string, { label: string; lines: PriceApprovalLine[] }>();
    for (const l of doc.lines) {
      const key = l.category_code || "-";
      if (!map.has(key)) map.set(key, { label: l.category_label || key, lines: [] });
      map.get(key)!.lines.push(l);
    }
    return Array.from(map.entries());
  }, [doc.lines]);

  const totalAmount = doc.lines.reduce((s, l) => s + lineAmount(l), 0);
  const totalWeightKg = doc.lines.reduce((s, l) => s + lineWeightKg(l), 0);
  const overallBahtPerTon = bahtPerTon(totalAmount, totalWeightKg);

  const deliveryLabel = doc.delivery_condition === "customer_pickup" ? "ลูกค้ารับเอง" : doc.delivery_condition === "company_deliver" ? "บริษัทส่งให้" : "-";

  return (
    <div style={{
      fontFamily: "'AngsanaUPC','TH Sarabun New','Sarabun',Arial,sans-serif",
      fontSize: "13pt",
      color: "#000",
      backgroundColor: "#fff",
      padding: "10mm 15mm",
      width: "210mm",
      minHeight: "297mm",
      boxSizing: "border-box",
    }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3mm" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4mm" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/oranit-logo.svg" alt="ORANIT" style={{ width: "14mm", height: "14mm", flexShrink: 0 }} />
          <div style={{ fontWeight: "bold", fontSize: "16pt" }}>บริษัท กระเบื้องโอฬาร จำกัด</div>
        </div>
        <div style={{ textAlign: "right", minWidth: "72mm" }}>
          <div style={{ fontSize: "20pt", fontWeight: "bold", marginBottom: "2mm" }}>ใบขออนุมัติราคาพิเศษ</div>
          <div style={{ fontSize: "12pt" }}>เลขที่ใบปอ : <strong>{doc.doc_no}</strong></div>
          <div style={{ fontSize: "12pt" }}>วันที่ทำรายการ : <strong>{fmtDate(doc.request_date)}</strong></div>
        </div>
      </div>

      {/* ── Field grid ── */}
      <div style={{ border: "1px solid #000", padding: "2.5mm 3mm", fontSize: "11pt", marginBottom: "3mm", lineHeight: 1.7 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>ชื่อพนักงาน : <strong>{doc.salesperson_name || "-"}</strong></div>
          <div>วันที่มีผลบังคับใช้ : <strong>{fmtDate(doc.effective_date)}</strong> &nbsp;&nbsp; วันที่สิ้นสุด : <strong>{fmtDate(doc.expiry_date)}</strong></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>รหัส/ชื่อลูกค้า : <strong>{[doc.customer_code, doc.customer_name].filter(Boolean).join("  ") || "-"}</strong></div>
          <div>เครดิต (วัน / 0=เงินสด) : <strong>{doc.credit_days ?? 0}</strong></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>เขตจังหวัด : <strong>{doc.zone_province || "-"}</strong></div>
          <div>ค่าขนส่ง (ตามเขต พท.) : <strong>{doc.freight_rate_baht_per_ton != null ? fmtNum(doc.freight_rate_baht_per_ton, 2) : "-"}</strong> บาท/ตัน</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>เงื่อนไข : <strong>{deliveryLabel}</strong> &nbsp;&nbsp; ช่วยค่าขนส่ง : <strong>{fmtNum(doc.freight_support_baht_per_ton ?? 0, 0)}</strong> บาท/ตัน</div>
          <div>เคลม : <strong>{doc.claim_percent || "-"}</strong> &nbsp;&nbsp; % ไตรมาส : <strong>{doc.quarterly_percent ?? 0}</strong></div>
        </div>
      </div>

      {/* ── Line items grouped by category ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5pt" }}>
        <thead>
          <tr style={{ borderTop: "1.5px solid #000", borderBottom: "1.5px solid #000", backgroundColor: "#f9f9f9" }}>
            {["รหัส", "ชื่อสินค้า", "น.น./หน่วย (กก.)", "จำนวน", "ราคาตั้ง", "%ขอ", "ราคาขอ/หน่วย", "จำนวนเงิน"].map(h => (
              <th key={h} style={{ ...cell, textAlign: h === "ชื่อสินค้า" ? "left" : "center", fontWeight: "bold", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(([code, g]) => {
            const groupAmount = g.lines.reduce((s, l) => s + lineAmount(l), 0);
            const groupWeightKg = g.lines.reduce((s, l) => s + lineWeightKg(l), 0);
            const groupBahtPerTon = bahtPerTon(groupAmount, groupWeightKg);
            return (
              <React.Fragment key={code}>
                <tr>
                  <td colSpan={8} style={{ ...cell, fontWeight: "bold", paddingTop: "2mm" }}>{code} : {g.label}</td>
                </tr>
                {g.lines.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "0.5px solid #ddd" }}>
                    <td style={{ ...cell, textAlign: "center", fontFamily: "monospace" }}>{l.product_code}</td>
                    <td style={cell}>{l.product_name}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmtNum(l.weight_per_unit_kg)}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{l.qty.toLocaleString("th-TH")}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmtNum(l.list_price)}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmtNum(l.discount_percent)}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmtNum(l.requested_unit_price)}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{fmtNum(lineAmount(l))}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={8} style={{ ...cell, textAlign: "right", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "2mm" }}>
                    รวม =====&gt; {fmtNum(groupBahtPerTon)} บาท/ตัน
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* ── Overall summary (end of document) ── */}
      <div style={{ marginTop: "3mm", textAlign: "right", fontSize: "12pt", lineHeight: 1.8 }}>
        <div>น้ำหนัก (กก.) : <strong>{fmtNum(totalWeightKg)}</strong></div>
        <div style={{ fontWeight: "bold", fontSize: "13pt" }}>= {fmtNum(overallBahtPerTon)} บาท/ตัน</div>
        <div>จำนวนเงิน : <strong>{fmtNum(totalAmount)}</strong></div>
      </div>

      {/* ── Memo ── */}
      <div style={{ marginTop: "4mm", border: "1px solid #000", minHeight: "20mm", padding: "2mm 3mm", fontSize: "11pt" }}>
        <div style={{ fontWeight: "bold", marginBottom: "1mm" }}>Memo</div>
        <div>{doc.memo || ""}</div>
      </div>

      {doc.status === "rejected" && (
        <div style={{ marginTop: "3mm", border: "1px solid #c00", color: "#c00", padding: "2mm 3mm", fontSize: "11pt" }}>
          ไม่อนุมัติ
        </div>
      )}

      {/* ── Signatures / approval chain ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14mm" }}>
        {[
          { label: "พนักงานขาย", name: doc.salesperson_name_signed ?? doc.salesperson_name, date: doc.request_date },
          { label: "หัวหน้าภาคการขาย", name: doc.area_head_name, date: doc.area_head_approved_at },
          { label: "ผู้จัดการฝ่ายการตลาด", name: doc.marketing_manager_name, date: doc.marketing_approved_at },
        ].map((sig, i) => (
          <div key={i} style={{ textAlign: "center", flex: 1, fontSize: "10.5pt" }}>
            {sig.name ? (
              <>
                <div style={{ marginBottom: "6mm", fontWeight: "bold" }}>{sig.name}</div>
                <div style={{ borderTop: "0.5px solid #000", paddingTop: "1mm" }}>{sig.label}</div>
                <div style={{ marginTop: "1mm" }}>{fmtDateTime(sig.date) ?? ""}</div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "10mm" }}>ลงชื่อ........................................</div>
                <div style={{ borderTop: "0.5px solid #000", paddingTop: "1mm" }}>{sig.label}</div>
                <div style={{ marginTop: "1mm" }}>วันที่ ...... /...... /......</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
