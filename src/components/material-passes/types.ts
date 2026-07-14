export type MaterialPassStatus = "pending" | "exited" | "rejected";

export interface PassItem {
  qty: string;
  unit: string;
  description: string;
  remark: string;
}

export interface MaterialPassRow {
  id: string;
  doc_no: string | null;
  book_no: string | null;
  pass_date: string;
  destination: string | null;
  vehicle_no: string | null;
  driver_name: string | null;
  issue_time: string | null;
  items: PassItem[] | unknown;
  requester_id: string | null;
  issuer_name: string | null;
  received_origin_name: string | null;
  received_dest_name: string | null;
  exit_no: string | null;
  exit_date: string | null;
  exit_time: string | null;
  warehouse_head_name: string | null;
  gate_guard_name: string | null;
  status: MaterialPassStatus;
  rejected_reason: string | null;
  created_at: string;
}

export const STATUS_LABEL: Record<MaterialPassStatus, { text: string; cls: string }> = {
  pending:  { text: "รอผ่านออก",   cls: "bg-amber-100 text-amber-700" },
  exited:   { text: "ผ่านออกแล้ว", cls: "bg-green-100 text-green-700" },
  rejected: { text: "ไม่อนุมัติ",   cls: "bg-red-100 text-red-700" },
};

export function parseItems(l: unknown): PassItem[] {
  if (Array.isArray(l)) return l as PassItem[];
  if (typeof l === "string") {
    try { return JSON.parse(l) as PassItem[]; } catch { return []; }
  }
  return [];
}

export const emptyItem = (): PassItem => ({ qty: "", unit: "", description: "", remark: "" });
