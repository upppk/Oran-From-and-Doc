export interface SalesProduct {
  id: string;
  code: string;
  name: string;
  category_code: string;
  category_label: string;
  weight_per_unit_kg: number;
  list_price: number | null;
}

export interface SalesCustomer {
  id: string;
  code: string;
  name: string;
  zone_province: string | null;
  freight_baht_per_ton: number | null;
  credit_days: number | null;
}

export type PriceApprovalStatus = "draft" | "pending_area_head" | "pending_marketing" | "approved" | "rejected";

export interface LineItemForm {
  category_code: string;
  category_label: string;
  product_code: string;
  product_name: string;
  weight_per_unit_kg: string;
  qty: string;
  list_price: string;
  discount_percent: string;
  requested_unit_price: string;
}

export interface PriceApprovalRow {
  id: string;
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
  lines: LineItemForm[] | unknown;
  total_weight_kg: number | null;
  total_amount: number | null;
  overall_baht_per_ton: number | null;
  status: PriceApprovalStatus;
  created_by: string | null;
  area_head_id: string | null;
  area_head_approved_at: string | null;
  marketing_manager_id: string | null;
  marketing_approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  area_head_name?: string | null;
  marketing_manager_name?: string | null;
}

export const STATUS_LABEL: Record<PriceApprovalStatus, { text: string; cls: string }> = {
  draft:              { text: "ร่าง",                  cls: "bg-gray-100 text-gray-600" },
  pending_area_head:  { text: "รออนุมัติ (หัวหน้าภาค)", cls: "bg-amber-100 text-amber-700" },
  pending_marketing:  { text: "รออนุมัติ (ผจก.การตลาด)", cls: "bg-blue-100 text-blue-700" },
  approved:           { text: "อนุมัติแล้ว",             cls: "bg-green-100 text-green-700" },
  rejected:           { text: "ไม่อนุมัติ",               cls: "bg-red-100 text-red-700" },
};

export function parseLines(l: unknown): LineItemForm[] {
  if (Array.isArray(l)) return l as LineItemForm[];
  if (typeof l === "string") {
    try { return JSON.parse(l) as LineItemForm[]; } catch { return []; }
  }
  return [];
}

export function lineAmount(l: LineItemForm) {
  const price = parseFloat(l.requested_unit_price) || 0;
  const qty = parseFloat(l.qty) || 0;
  return price * qty;
}

export function lineWeightKg(l: LineItemForm) {
  const w = parseFloat(l.weight_per_unit_kg) || 0;
  const qty = parseFloat(l.qty) || 0;
  return w * qty;
}

export function bahtPerTon(amount: number, weightKg: number) {
  if (weightKg <= 0) return 0;
  return amount / (weightKg / 1000);
}

export function computeTotals(lines: LineItemForm[]) {
  const total_amount = lines.reduce((s, l) => s + lineAmount(l), 0);
  const total_weight_kg = lines.reduce((s, l) => s + lineWeightKg(l), 0);
  const overall_baht_per_ton = bahtPerTon(total_amount, total_weight_kg);
  return { total_amount, total_weight_kg, overall_baht_per_ton };
}

export const emptyLine = (category_code = "", category_label = ""): LineItemForm => ({
  category_code, category_label, product_code: "", product_name: "",
  weight_per_unit_kg: "", qty: "", list_price: "", discount_percent: "", requested_unit_price: "",
});
