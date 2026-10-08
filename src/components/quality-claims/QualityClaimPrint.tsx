"use client";

import React from "react";
import { ClaimItem } from "./types";

export interface QualityClaimDoc {
  claim_no: string | null;
  claim_date: string;
  to_person: string | null;
  shop_name: string | null;
  shop_phone: string | null;
  shop_address: string | null;
  department: string | null;
  items: ClaimItem[];
  roof_type: string | null;
  structure: string | null;
  damage_desc: string | null;
  damage_qty: string | null;
  purpose: string | null;
  factory_comment: string | null;
  marketing_opinion?: "proceed" | "not_eligible" | null;
  marketing_opinion_reason?: string | null;
  marketing_opinion_by_name?: string | null;
  marketing_opinion_at?: string | null;
  submitted_by_name: string | null;
  print_date: string | null;
  status: string;
  resolved_by_name?: string | null;
  resolved_at?: string | null;
  photo_urls?: string[] | null;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

const dotted: React.CSSProperties = { borderBottom: "1px dotted #000", flex: 1, minHeight: "1.3em", padding: "0 2mm" };
const rowLabel: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "2mm", marginBottom: "2.5mm" };

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "6mm", height: "6mm", border: "1px solid #000", fontSize: "13pt", lineHeight: 1,
      fontWeight: "bold", verticalAlign: "middle",
    }}>{checked ? "✓" : ""}</span>
  );
}

function fmtDateTimeShort(s: string | null | undefined) {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${(d.getFullYear() + 543) % 100}`;
}

export default function QualityClaimPrint({ doc }: { doc: QualityClaimDoc }) {
  const factoryLines = (doc.factory_comment || "").split("\n");
  const commentLines = Array.from({ length: Math.max(6, factoryLines.length) }, (_, i) => factoryLines[i] || "");
  const opinionLines = (doc.marketing_opinion_reason || "").split("\n");
  const reasonLines = Array.from({ length: Math.max(4, opinionLines.length) }, (_, i) => opinionLines[i] || "");

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
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "6mm", marginBottom: "6mm" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/oranit-logo.svg" alt="ORANIT" style={{ width: "18mm", height: "18mm", flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontWeight: "bold", fontSize: "18pt" }}>บริษัท กระเบื้องโอฬาร จำกัด</div>
          <div style={{ fontWeight: "bold", fontSize: "13pt" }}>ORANVANICH COMPANY LIMITED</div>
        </div>
      </div>

      {/* ── Subject / date / to ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1mm" }}>
        <div><strong>เรื่อง</strong>&nbsp;&nbsp;คุณภาพสินค้าและบริการ</div>
        <div><strong>วันที่ :</strong> &nbsp;{fmtDate(doc.claim_date)}</div>
      </div>
      <div style={{ marginBottom: "4mm" }}><strong>เรียน</strong>&nbsp;&nbsp;{doc.to_person || "ผู้จัดการโรงงาน"}</div>

      <p style={{ fontSize: "12.5pt", lineHeight: 1.6, marginBottom: "5mm" }}>
        ฝ่ายขายและการตลาดขอแจ้งรายชื่อลูกค้าที่ต้องการให้ทางฝ่ายผลิต หรือ QC ตรวจสอบวิเคราะห์หาสาเหตุของกระเบื้องที่เสียหาย
      </p>

      <div style={{ fontSize: "12.5pt" }}>
        <div style={rowLabel}><span>สถานที่พบ : ร้าน</span><span style={dotted}>{doc.shop_name}</span><span>โทร</span><span style={{ ...dotted, flex: 0.6 }}>{doc.shop_phone}</span></div>
        <div style={rowLabel}><span>ที่อยู่ :</span><span style={dotted}>{doc.shop_address}</span></div>
        <div style={rowLabel}><span>หน่วยงาน :</span><span style={dotted}>{doc.department}</span></div>
        {doc.items.map((it, i) => (
          <div key={i} style={rowLabel}>
            <span>{i === 0 ? "กระเบื้องที่ใช้ :" : " ".repeat(20)}</span>
            <span style={dotted}>{it.product_name}</span>
            <span>จำนวน</span>
            <span style={{ ...dotted, flex: 0.3, textAlign: "right" }}>{it.qty}</span>
          </div>
        ))}

        <div style={{ marginTop: "4mm", marginBottom: "2mm", fontWeight: "bold" }}>ข้อมูลเบื้องต้น</div>
        <div style={rowLabel}><span>ลักษณะการมุง :</span><span style={dotted}>{doc.roof_type}</span></div>
        <div style={rowLabel}><span>โครงสร้าง :</span><span style={dotted}>{doc.structure}</span></div>
        <div style={rowLabel}><span>ลักษณะความเสียหาย :</span><span style={dotted}>{doc.damage_desc}</span></div>
        <div style={rowLabel}><span>จำนวนเสียหาย :</span><span style={dotted}>{doc.damage_qty}</span></div>

        <div style={{ ...rowLabel, marginTop: "3mm" }}>
          <span>วัตถุประสงค์ :</span><span style={dotted}>{doc.purpose}</span>
        </div>
      </div>

      {/* ── ความเห็นหัวหน้าฝ่ายการตลาด ── */}
      <div style={{ marginTop: "4mm", fontSize: "12.5pt" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2mm" }}>ความเห็นหัวหน้าฝ่ายการตลาด</div>
        <div style={{ display: "flex", gap: "14mm", marginLeft: "8mm", marginBottom: "2mm", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2mm", fontWeight: "bold" }}>
            <CheckBox checked={doc.marketing_opinion === "proceed"} /> เห็นควรดำเนินการต่อ
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2mm", fontWeight: "bold" }}>
            <CheckBox checked={doc.marketing_opinion === "not_eligible"} /> ไม่เข้าเงื่อนไขหรือข้อกำหนด
          </span>
        </div>
        <div style={{ fontWeight: "bold", marginBottom: "1mm" }}>เนื่องจาก :</div>
        {reasonLines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: "2mm", marginTop: "1mm", marginLeft: "8mm" }}>
            <span>:</span><span style={dotted}>{line}</span>
          </div>
        ))}
        {(doc.marketing_opinion_by_name || doc.marketing_opinion_at) && (
          <div style={{ textAlign: "right", fontSize: "11pt", marginTop: "2mm" }}>
            {doc.marketing_opinion_by_name || ""} &nbsp; {fmtDateTimeShort(doc.marketing_opinion_at)}
          </div>
        )}
      </div>

      {doc.photo_urls && doc.photo_urls.length > 0 && (
        <div style={{ marginTop: "4mm" }}>
          <div style={{ fontWeight: "bold", marginBottom: "2mm" }}>รูปภาพประกอบ</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3mm" }}>
            {doc.photo_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" style={{ width: "45mm", height: "35mm", objectFit: "cover", border: "1px solid #999" }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "3mm" }}><strong>ผลการตรวจสอบจากโรงงาน (หลังการตรวจสอบ)</strong></div>
      <div style={{ fontSize: "12.5pt" }}>
        {commentLines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: "2mm", marginTop: "1mm" }}>
            <span>:</span><span style={dotted}>{line}</span>
          </div>
        ))}
      </div>
      {doc.status === "resolved" && (
        <div style={{ marginTop: "2mm", fontSize: "11pt", color: "#555" }}>
          ตรวจสอบโดย {doc.resolved_by_name || ""} {doc.resolved_at ? `วันที่ ${fmtDate(doc.resolved_at)}` : ""}
        </div>
      )}

      {/* ── Footer signature ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10mm" }}>
        <div style={{ textAlign: "right", fontSize: "12.5pt" }}>
          <div>ลงชื่อ : <strong>{doc.submitted_by_name || ""}</strong></div>
          <div style={{ marginTop: "2mm", fontSize: "11pt" }}>วันที่พิมพ์ : {fmtDate(doc.print_date)}</div>
        </div>
      </div>

      <div style={{ marginTop: "16mm", fontSize: "10pt", borderTop: "0.5px solid #999", paddingTop: "2mm" }}>
        <div>สำนักงาน : 27 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240</div>
        <div>Office : 27 Soi Ramkhamhaeng Road, Hua-Mark, Bangkapi, Bangkok 10240. Thailand.</div>
        <div>Tel. 02-3189801-20 Fax : (662) 3189840</div>
      </div>
    </div>
  );
}
