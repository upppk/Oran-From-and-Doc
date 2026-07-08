"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Papa from "papaparse";
import { Upload, CheckCircle } from "lucide-react";
import type { SalesProduct, SalesCustomer } from "@/components/price-approval/types";

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";

type ProductCsvRow = { code: string; name: string; category_code: string; category_label: string; weight_per_unit_kg: string; list_price: string };
type CustomerCsvRow = { code: string; name: string; zone_province: string; freight_baht_per_ton: string; credit_days: string };

function ImportCard<T extends Record<string, string>>({
  title, hint, columns, onParsed,
}: {
  title: string; hint: string; columns: string[]; onParsed: (rows: T[]) => Promise<void>;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);
  const [err, setErr] = useState("");

  function handleFile(file: File) {
    setErr(""); setDone(0);
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const missing = columns.filter(c => !res.meta.fields?.includes(c));
        if (missing.length) { setErr(`ไฟล์ขาดคอลัมน์: ${missing.join(", ")}`); setRows([]); return; }
        setRows(res.data);
      },
      error: (e) => setErr(e.message),
    });
  }

  async function doImport() {
    setImporting(true); setErr("");
    try {
      await onParsed(rows);
      setDone(rows.length);
      setRows([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setImporting(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-1">{title}</h2>
      <p className="text-xs text-gray-500 mb-3">{hint}</p>
      <p className="text-xs text-gray-400 mb-3 font-mono">คอลัมน์ที่ต้องมี: {columns.join(", ")}</p>
      <input type="file" accept=".csv" className={inputCls}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {err && <div className="mt-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{err}</div>}
      {done > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-green-700 text-xs">
          <CheckCircle className="w-4 h-4" /> นำเข้าสำเร็จ {done} รายการ
        </div>
      )}
      {rows.length > 0 && (
        <div className="mt-3">
          <div className="overflow-x-auto max-h-60 border border-gray-100 rounded-lg mb-3">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50">{columns.map(c => <th key={c} className="px-2 py-1.5 text-left">{c}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-gray-50">{columns.map(c => <td key={c} className="px-2 py-1">{r[c]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mb-2">พบ {rows.length} แถว {rows.length > 50 && "(แสดงตัวอย่าง 50 แถวแรก)"}</p>
          <button onClick={doImport} disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-sm font-medium">
            <Upload className="w-4 h-4" /> {importing ? "กำลังนำเข้า..." : `นำเข้า ${rows.length} รายการ`}
          </button>
        </div>
      )}
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function MasterDataImportClient({ initialProducts, initialCustomers }: { initialProducts: SalesProduct[]; initialCustomers: SalesCustomer[] }) {
  const supabase = createClient();
  const [productCount, setProductCount] = useState(initialProducts.length);
  const [customerCount, setCustomerCount] = useState(initialCustomers.length);

  async function importProducts(rows: ProductCsvRow[]) {
    const payload = rows.map(r => ({
      code: r.code.trim(), name: r.name.trim(),
      category_code: r.category_code.trim(), category_label: r.category_label.trim(),
      weight_per_unit_kg: parseFloat(r.weight_per_unit_kg) || 0,
      list_price: r.list_price ? parseFloat(r.list_price) : null,
      active: true,
    })).filter(r => r.code);
    for (const batch of chunk(payload, 500)) {
      const { error } = await supabase.from("sales_products").upsert(batch, { onConflict: "code" });
      if (error) throw new Error(error.message);
    }
    const { count } = await supabase.from("sales_products").select("id", { count: "exact", head: true });
    if (count != null) setProductCount(count);
  }

  async function importCustomers(rows: CustomerCsvRow[]) {
    const payload = rows.map(r => ({
      code: r.code.trim(), name: r.name.trim(),
      zone_province: r.zone_province?.trim() || null,
      freight_baht_per_ton: r.freight_baht_per_ton ? parseFloat(r.freight_baht_per_ton) : null,
      credit_days: r.credit_days ? parseInt(r.credit_days) : 0,
      active: true,
    })).filter(r => r.code);
    for (const batch of chunk(payload, 500)) {
      const { error } = await supabase.from("sales_customers").upsert(batch, { onConflict: "code" });
      if (error) throw new Error(error.message);
    }
    const { count } = await supabase.from("sales_customers").select("id", { count: "exact", head: true });
    if (count != null) setCustomerCount(count);
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">ข้อมูลสินค้า/ลูกค้า</h1>
        <p className="text-sm text-gray-500 mt-1">อัปโหลดไฟล์ CSV เพื่อนำเข้า/อัปเดตรหัสสินค้าและรหัสลูกค้า — ระบบจะจับคู่ด้วยคอลัมน์ "code" (ถ้ามีอยู่แล้วจะอัปเดตทับ)</p>
        <p className="text-xs text-gray-400 mt-1">ปัจจุบันมีสินค้า {productCount} รายการ, ลูกค้า {customerCount} รายการ</p>
      </div>

      <ImportCard<ProductCsvRow>
        title="นำเข้ารหัสสินค้า"
        hint="ไฟล์ CSV ของสินค้า (บันทึกจาก Excel เป็น .csv)"
        columns={["code", "name", "category_code", "category_label", "weight_per_unit_kg", "list_price"]}
        onParsed={importProducts}
      />

      <ImportCard<CustomerCsvRow>
        title="นำเข้ารหัสลูกค้า"
        hint="ไฟล์ CSV ของลูกค้า (บันทึกจาก Excel เป็น .csv)"
        columns={["code", "name", "zone_province", "freight_baht_per_ton", "credit_days"]}
        onParsed={importCustomers}
      />
    </div>
  );
}
