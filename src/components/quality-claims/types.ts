export type QualityClaimStatus = "pending" | "resolved";

export interface ClaimItem {
  product_name: string;
  qty: string;
}

export interface QualityClaimRow {
  id: string;
  claim_no: string | null;
  claim_date: string;
  to_person: string | null;
  customer_code: string | null;
  shop_name: string | null;
  shop_phone: string | null;
  shop_address: string | null;
  department: string | null;
  items: ClaimItem[] | unknown;
  roof_type: string | null;
  structure: string | null;
  damage_desc: string | null;
  damage_qty: string | null;
  purpose: string | null;
  factory_comment: string | null;
  submitted_by_name: string | null;
  submitted_by: string | null;
  print_date: string | null;
  status: QualityClaimStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  photo_urls: string[] | null;
}

export const STATUS_LABEL: Record<QualityClaimStatus, { text: string; cls: string }> = {
  pending:  { text: "รอตรวจสอบ", cls: "bg-amber-100 text-amber-700" },
  resolved: { text: "ตรวจสอบแล้ว", cls: "bg-green-100 text-green-700" },
};

export function parseItems(l: unknown): ClaimItem[] {
  if (Array.isArray(l)) return l as ClaimItem[];
  if (typeof l === "string") {
    try { return JSON.parse(l) as ClaimItem[]; } catch { return []; }
  }
  return [];
}

export const emptyItem = (): ClaimItem => ({ product_name: "", qty: "" });
