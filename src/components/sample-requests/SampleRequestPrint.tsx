"use client";

import React from "react";
import { SampleItem } from "./types";

export interface SampleRequestDoc {
  request_no: string | null;
  request_date: string;
  to_person: string | null;
  employee_name: string | null;
  zone_province: string | null;
  items: SampleItem[];
  reason: string | null;
  requester_name: string | null;
  checked_by_name: string | null;
  checked_at: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  status: string;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

const dotted: React.CSSProperties = { borderBottom: "1px dotted #000", flex: 1, minHeight: "1.3em", padding: "0 2mm" };
const cell: React.CSSProperties = { border: "1px solid #000", padding: "2mm 3mm", verticalAlign: "middle" };

export default function SampleRequestPrint({ doc }: { doc: SampleRequestDoc }) {
  const rows = doc.items.length ? doc.items : [{ product_name: "", qty: "" }];

  return (
    <div style={{
      fontFamily: "'AngsanaUPC','TH Sarabun New','Sarabun',Arial,sans-serif",
      fontSize: "14pt",
      color: "#000",
      backgroundColor: "#fff",
      padding: "12mm 15mm",
      width: "210mm",
      minHeight: "297mm",
      boxSizing: "border-box",
    }}>
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "20pt", marginBottom: "2mm" }}>
        ใบขอสินค้าตัวอย่าง
      </div>
      <div style={{ textAlign: "right", fontSize: "11pt", marginBottom: "6mm" }}>
        เลขที่ : {doc.request_no || "-"} &nbsp;&nbsp; วันที่ : {fmtDate(doc.request_date)}
      </div>

      <div style={{ marginBottom: "4mm" }}>
        ถึง &nbsp;<strong>หัวหน้าคลังสินค้า</strong>{doc.to_person && doc.to_person !== "หัวหน้าคลังสินค้า" ? ` ${doc.to_person}` : ""}
        <span style={{ borderBottom: "1px dotted #000", display: "inline-block", width: "120mm", marginLeft: "2mm" }}>&nbsp;</span>
      </div>

      <div style={{ display: "flex", marginBottom: "5mm", fontSize: "13pt" }}>
        <span>ชื่อพนักงาน</span>
        <span style={{ ...dotted, flex: 2 }}>{doc.employee_name}</span>
        <span>เขต</span>
        <span style={{ ...dotted, flex: 1 }}>{doc.zone_province}</span>
        <span>ขออนุมัติสินค้าตัวอย่าง</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13pt", marginBottom: "5mm" }}>
        <thead>
          <tr>
            <th style={{ ...cell, fontWeight: "bold" }}>รายการสินค้า</th>
            <th style={{ ...cell, fontWeight: "bold", width: "30mm" }}>จำนวนแผ่น</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((it, i) => (
            <tr key={i}>
              <td style={{ ...cell, height: "9mm" }}>{it.product_name}</td>
              <td style={{ ...cell, textAlign: "center" }}>{it.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", marginBottom: "4mm", fontSize: "13pt" }}>
        <span>เหตุผลในการขออนุมัติ</span>
        <span style={dotted}>{doc.reason}</span>
      </div>

      {doc.status === "rejected" && (
        <div style={{ marginBottom: "3mm", border: "1px solid #c00", color: "#c00", padding: "2mm 3mm", fontSize: "11pt" }}>
          ไม่อนุมัติ
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13pt", marginTop: "8mm" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span>ผู้ขอ</span>
          <span style={{ ...dotted, width: "40mm" }}>{doc.requester_name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span>ผู้ตรวจ</span>
          <span style={{ ...dotted, width: "40mm" }}>{doc.checked_by_name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span>ผู้อนุมัติ</span>
          <span style={{ ...dotted, width: "40mm" }}>{doc.approved_by_name}</span>
        </div>
      </div>
    </div>
  );
}
