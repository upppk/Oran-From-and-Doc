export type SampleRequestStatus = "pending" | "checked" | "approved" | "rejected";

export interface SampleItem {
  product_name: string;
  qty: string;
}

export interface SampleRequestRow {
  id: string;
  request_no: string | null;
  request_date: string;
  to_person: string | null;
  employee_name: string | null;
  zone_province: string | null;
  items: SampleItem[] | unknown;
  reason: string | null;
  requester_name: string | null;
  requester_id: string | null;
  checked_by_name: string | null;
  checked_by: string | null;
  checked_at: string | null;
  approved_by_name: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status: SampleRequestStatus;
  rejected_by: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  created_at: string;
}

export const STATUS_LABEL: Record<SampleRequestStatus, { text: string; cls: string }> = {
  pending:  { text: "รออนุมัติ",   cls: "bg-amber-100 text-amber-700" },
  checked:  { text: "ตรวจแล้ว",    cls: "bg-blue-100 text-blue-700" },
  approved: { text: "อนุมัติแล้ว", cls: "bg-green-100 text-green-700" },
  rejected: { text: "ไม่อนุมัติ",   cls: "bg-red-100 text-red-700" },
};

export function parseItems(l: unknown): SampleItem[] {
  if (Array.isArray(l)) return l as SampleItem[];
  if (typeof l === "string") {
    try { return JSON.parse(l) as SampleItem[]; } catch { return []; }
  }
  return [];
}

export const emptyItem = (): SampleItem => ({ product_name: "", qty: "" });
