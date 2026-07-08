"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LineItemForm, SalesProduct, lineAmount, lineWeightKg, bahtPerTon } from "./types";

const inputCls = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500";

interface Props {
  categoryCode: string;
  categoryLabel: string;
  lines: LineItemForm[];
  products: SalesProduct[];
  onChangeLine: (idx: number, field: keyof LineItemForm, val: string) => void;
  onAddLine: () => void;
  onRemoveLine: (idx: number) => void;
  onRemoveGroup: () => void;
  readOnly?: boolean;
}

export default function LineItemGroup({ categoryCode, categoryLabel, lines, products, onChangeLine, onAddLine, onRemoveLine, onRemoveGroup, readOnly }: Props) {
  const [suggestFor, setSuggestFor] = useState<number | null>(null);

  const groupAmount = lines.reduce((s, l) => s + lineAmount(l), 0);
  const groupWeightKg = lines.reduce((s, l) => s + lineWeightKg(l), 0);
  const groupBahtPerTon = bahtPerTon(groupAmount, groupWeightKg);

  function pickProduct(idx: number, p: SalesProduct) {
    onChangeLine(idx, "product_code", p.code);
    onChangeLine(idx, "product_name", p.name);
    onChangeLine(idx, "weight_per_unit_kg", String(p.weight_per_unit_kg));
    onChangeLine(idx, "list_price", p.list_price != null ? String(p.list_price) : "");
    setSuggestFor(null);
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
        <p className="text-sm font-semibold text-gray-700">{categoryCode} : {categoryLabel || "(ไม่ระบุกลุ่ม)"}</p>
        {!readOnly && (
          <button type="button" onClick={onRemoveGroup} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> ลบกลุ่ม
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="px-2 py-1.5 text-left">รหัส</th>
              <th className="px-2 py-1.5 text-left">ชื่อสินค้า</th>
              <th className="px-2 py-1.5 text-right">น.น./หน่วย (กก.)</th>
              <th className="px-2 py-1.5 text-right">จำนวน</th>
              <th className="px-2 py-1.5 text-right">ราคาตั้ง</th>
              <th className="px-2 py-1.5 text-right">%ขอ</th>
              <th className="px-2 py-1.5 text-right">ราคาขอ/หน่วย</th>
              <th className="px-2 py-1.5 text-right">จำนวนเงิน</th>
              {!readOnly && <th className="px-2 py-1.5" />}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const matches = suggestFor === i
                ? (l.product_code
                    ? products.filter(p => p.code.toLowerCase().includes(l.product_code.toLowerCase()) || p.name.toLowerCase().includes(l.product_code.toLowerCase())).slice(0, 30)
                    : products.slice(0, 30))
                : [];
              return (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-2 py-1 relative">
                    <input className={inputCls} value={l.product_code} disabled={readOnly}
                      onChange={e => { onChangeLine(i, "product_code", e.target.value); setSuggestFor(i); }}
                      onFocus={() => setSuggestFor(i)}
                      onBlur={() => setTimeout(() => setSuggestFor(s => s === i ? null : s), 150)}
                      placeholder="รหัส/พิมพ์ค้นหา" />
                    {matches.length > 0 && (
                      <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-64 max-h-48 overflow-y-auto">
                        {matches.map(p => (
                          <button type="button" key={p.id} onMouseDown={() => pickProduct(i, p)}
                            className="block w-full text-left px-2 py-1.5 hover:bg-gray-50 text-xs">
                            <span className="font-mono font-medium">{p.code}</span> — {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <input className={inputCls} value={l.product_name} disabled={readOnly}
                      onChange={e => onChangeLine(i, "product_name", e.target.value)} placeholder="ชื่อสินค้า" />
                  </td>
                  <td className="px-2 py-1"><input className={inputCls + " text-right"} value={l.weight_per_unit_kg} disabled={readOnly}
                    onChange={e => onChangeLine(i, "weight_per_unit_kg", e.target.value)} inputMode="decimal" /></td>
                  <td className="px-2 py-1"><input className={inputCls + " text-right"} value={l.qty} disabled={readOnly}
                    onChange={e => onChangeLine(i, "qty", e.target.value)} inputMode="decimal" /></td>
                  <td className="px-2 py-1"><input className={inputCls + " text-right"} value={l.list_price} disabled={readOnly}
                    onChange={e => onChangeLine(i, "list_price", e.target.value)} inputMode="decimal" /></td>
                  <td className="px-2 py-1"><input className={inputCls + " text-right"} value={l.discount_percent} disabled={readOnly}
                    onChange={e => onChangeLine(i, "discount_percent", e.target.value)} inputMode="decimal" /></td>
                  <td className="px-2 py-1"><input className={inputCls + " text-right"} value={l.requested_unit_price} disabled={readOnly}
                    onChange={e => onChangeLine(i, "requested_unit_price", e.target.value)} inputMode="decimal" /></td>
                  <td className="px-2 py-1 text-right tabular-nums text-gray-600">{lineAmount(l).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  {!readOnly && (
                    <td className="px-2 py-1">
                      <button type="button" onClick={() => onRemoveLine(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
        {!readOnly ? (
          <button type="button" onClick={onAddLine} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium">
            <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
          </button>
        ) : <span />}
        <p className="text-xs font-semibold text-gray-700">
          รวม =====&gt; {groupBahtPerTon.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท/ตัน
        </p>
      </div>
    </div>
  );
}
