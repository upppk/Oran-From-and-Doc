export type ShirtRequestStatus = "pending" | "approved" | "rejected";

export interface ShirtRequestRow {
  id: string;
  request_date: string;
  to_person: string | null;
  from_name: string | null;
  from_position: string | null;
  subject: string | null;
  quantity: number | null;
  reason: string | null;
  project_note: string | null;
  requester_id: string | null;
  status: ShirtRequestStatus;
  approver_initials: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  created_at: string;
}

export const STATUS_LABEL: Record<ShirtRequestStatus, { text: string; cls: string }> = {
  pending:  { text: "รออนุมัติ",   cls: "bg-amber-100 text-amber-700" },
  approved: { text: "อนุมัติแล้ว", cls: "bg-green-100 text-green-700" },
  rejected: { text: "ไม่อนุมัติ",   cls: "bg-red-100 text-red-700" },
};
