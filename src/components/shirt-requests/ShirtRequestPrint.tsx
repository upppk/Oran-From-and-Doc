"use client";

import React from "react";

export interface ShirtRequestDoc {
  request_date: string;
  to_person: string | null;
  from_name: string | null;
  from_position: string | null;
  subject: string | null;
  quantity: number | null;
  reason: string | null;
  project_note: string | null;
  status: string;
  approver_initials: string | null;
}

function fmtDateThai(s: string) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

export default function ShirtRequestPrint({ doc }: { doc: ShirtRequestDoc }) {
  return (
    <div style={{
      fontFamily: "'AngsanaUPC','TH Sarabun New','Sarabun',Arial,sans-serif",
      fontSize: "15pt",
      color: "#000",
      backgroundColor: "#fff",
      padding: "15mm 18mm",
      width: "210mm",
      minHeight: "297mm",
      boxSizing: "border-box",
      lineHeight: 1.7,
    }}>
      <div style={{ textAlign: "center", marginBottom: "8mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "18pt" }}>ใบติดต่องาน สำหรับหน่วยงานภายใน</div>
        <div style={{ fontSize: "13pt" }}>Internal Routing slip</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13pt", marginBottom: "6mm" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", verticalAlign: "top", padding: "1mm 2mm 1mm 0" }}>
              <strong>เรียน</strong><br />
              To : {doc.to_person || "-"}
            </td>
            <td style={{ width: "50%", verticalAlign: "top", padding: "1mm 0 1mm 2mm" }}>
              <strong>วันที่</strong><br />
              Date : {fmtDateThai(doc.request_date)}
            </td>
          </tr>
          <tr>
            <td style={{ verticalAlign: "top", padding: "1mm 2mm 1mm 0" }}>
              <strong>จาก</strong><br />
              From : {doc.from_name || "-"}
            </td>
            <td style={{ verticalAlign: "top", padding: "1mm 0 1mm 2mm" }}>
              <strong>ลงชื่อย่อ</strong><br />
              Initials : {doc.approver_initials || ""}
            </td>
          </tr>
        </tbody>
      </table>

      <p>เพื่อเป็นการขออนุมัติของท่าน</p>

      <p><strong>เรื่อง</strong> {doc.subject || ""}{doc.quantity ? ` จำนวน ${doc.quantity} ตัว` : ""}</p>

      <p style={{ whiteSpace: "pre-wrap" }}>{doc.reason}</p>

      {doc.project_note && <p>หมายเหตุ : {doc.project_note}</p>}

      {doc.status === "rejected" ? (
        <div style={{ margin: "4mm 0", border: "1px solid #c00", color: "#c00", padding: "2mm 3mm", fontSize: "12pt", display: "inline-block" }}>
          ไม่อนุมัติ
        </div>
      ) : (
        <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>
      )}

      <p style={{ marginTop: "8mm" }}>ขอแสดงความนับถือ</p>

      <div style={{ marginTop: "14mm" }}>
        <p style={{ marginBottom: 0 }}>{doc.from_name}</p>
        <p style={{ marginTop: 0, fontSize: "12pt" }}>{doc.from_position}</p>
      </div>
    </div>
  );
}
