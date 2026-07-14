"use client";

import React from "react";
import { PassItem } from "./types";

export interface MaterialPassDoc {
  doc_no: string | null;
  book_no: string | null;
  pass_date: string;
  destination: string | null;
  vehicle_no: string | null;
  driver_name: string | null;
  issue_time: string | null;
  items: PassItem[];
  issuer_name: string | null;
  received_origin_name: string | null;
  received_dest_name: string | null;
  exit_no: string | null;
  exit_date: string | null;
  exit_time: string | null;
  warehouse_head_name: string | null;
  gate_guard_name: string | null;
  status: string;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

const dotted: React.CSSProperties = { borderBottom: "1px dotted #000", flex: 1, minHeight: "1.3em", padding: "0 2mm" };
const cell: React.CSSProperties = { border: "1px solid #000", padding: "1.5mm 2mm", verticalAlign: "top" };
const sigBox: React.CSSProperties = { flex: 1, fontSize: "11pt", textAlign: "center" };

export default function MaterialPassPrint({ doc }: { doc: MaterialPassDoc }) {
  const rows = doc.items.length ? doc.items : [{ qty: "", unit: "", description: "", remark: "" }];

  return (
    <div style={{
      fontFamily: "'AngsanaUPC','TH Sarabun New','Sarabun',Arial,sans-serif",
      fontSize: "13pt",
      color: "#000",
      backgroundColor: "#fff",
      padding: "12mm 15mm",
      width: "210mm",
      minHeight: "297mm",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3mm" }}>
        <div>เล่มที่ <strong>{doc.book_no || "-"}</strong></div>
        <div style={{ fontWeight: "bold", fontSize: "16pt" }}>ใบผ่านนำวัสดุออกนอกโรงงาน (ฝ่ายพัสดุ)</div>
        <div>เลขที่ <strong>{doc.doc_no || "-"}</strong></div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "6mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "15pt" }}>บริษัท กระเบื้องโอฬาร จำกัด</div>
      </div>

      <div style={{ display: "flex", marginBottom: "2mm", fontSize: "12pt" }}>
        <span>สถานที่ส่ง</span><span style={{ ...dotted, flex: 2 }}>{doc.destination}</span>
        <span>วันที่</span><span style={{ ...dotted, flex: 1.5 }}>{fmtDate(doc.pass_date)}</span>
      </div>
      <div style={{ display: "flex", marginBottom: "4mm", fontSize: "12pt" }}>
        <span>ทะเบียนรถที่บรรทุก</span><span style={{ ...dotted, flex: 1 }}>{doc.vehicle_no}</span>
        <span>ผู้ขับรถ</span><span style={{ ...dotted, flex: 1 }}>{doc.driver_name}</span>
        <span>เวลาออกใบผ่าน</span><span style={{ ...dotted, flex: 1 }}>{doc.issue_time}</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12pt", marginBottom: "5mm" }}>
        <thead>
          <tr>
            <th style={{ ...cell, fontWeight: "bold", width: "18mm" }}>จำนวน</th>
            <th style={{ ...cell, fontWeight: "bold" }}>รายการ / ขนาด</th>
            <th style={{ ...cell, fontWeight: "bold", width: "35mm" }}>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((it, i) => (
            <tr key={i}>
              <td style={{ ...cell, textAlign: "center" }}>{[it.qty, it.unit].filter(Boolean).join(" ")}</td>
              <td style={cell}>{it.description}</td>
              <td style={cell}>{it.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {doc.status === "rejected" && (
        <div style={{ marginBottom: "3mm", border: "1px solid #c00", color: "#c00", padding: "2mm 3mm", fontSize: "11pt", display: "inline-block" }}>
          ไม่อนุมัติ
        </div>
      )}

      <div style={{ display: "flex", gap: "6mm", marginTop: "6mm" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "11pt", marginBottom: "10mm" }}>ได้รับของตามรายการข้างบนถูกต้องและครบตามจำนวน</p>
          <div style={sigBox}>
            <div style={{ borderTop: "1px dotted #000", paddingTop: "1mm" }}>{doc.received_origin_name || " "}</div>
            <div style={{ fontSize: "10pt" }}>ผู้รับต้นทาง</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "11pt", marginBottom: "10mm" }}>&nbsp;</p>
          <div style={sigBox}>
            <div style={{ borderTop: "1px dotted #000", paddingTop: "1mm" }}>{doc.issuer_name || " "}</div>
            <div style={{ fontSize: "10pt" }}>ผู้ออกใบผ่าน</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6mm", marginTop: "8mm" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "11pt", marginBottom: "10mm" }}>ได้รับของตามรายการข้างบนถูกต้องและครบตามจำนวน</p>
          <div style={sigBox}>
            <div style={{ borderTop: "1px dotted #000", paddingTop: "1mm" }}>{doc.received_dest_name || " "}</div>
            <div style={{ fontSize: "10pt" }}>ผู้รับปลายทาง</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ marginTop: "8mm", borderTop: "1px solid #000", paddingTop: "4mm" }}>
        <p style={{ fontSize: "11pt", marginBottom: "2mm" }}>ตรวจสอบแล้วถูกต้องทุกประการ</p>
        <div style={{ display: "flex", gap: "6mm", fontSize: "11pt", marginBottom: "8mm" }}>
          <span>เลขที่ผ่านออก <strong>{doc.exit_no || "-"}</strong></span>
          <span>เวลา <strong>{doc.exit_time || "-"}</strong></span>
          <span>วันที่ <strong>{fmtDate(doc.exit_date)}</strong></span>
        </div>
        <div style={{ display: "flex", gap: "6mm" }}>
          <div style={sigBox}>
            <div style={{ borderTop: "1px dotted #000", paddingTop: "1mm" }}>{doc.warehouse_head_name || " "}</div>
            <div style={{ fontSize: "10pt" }}>หัวหน้าแผนกคลังสินค้า</div>
          </div>
          <div style={sigBox}>
            <div style={{ borderTop: "1px dotted #000", paddingTop: "1mm" }}>{doc.gate_guard_name || " "}</div>
            <div style={{ fontSize: "10pt" }}>ผู้รักษาประตูโรงงาน</div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: "10pt", marginTop: "8mm" }}>หมายเหตุ : ใบผ่านนี้ใช้ได้กับของที่ไม่ใช่กระเบื้อง</p>
    </div>
  );
}
