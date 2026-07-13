-- ขอเบิกเสื้อช่าง (Internal Routing Slip — technician shirt requisition) — additive migration.
-- Run this in the Supabase SQL editor after the other schema files.

create type shirt_request_status as enum ('pending', 'approved', 'rejected');

create table shirt_requests (
  id uuid primary key default gen_random_uuid(),
  request_date date not null default current_date,
  to_person text,             -- เรียน
  from_name text,             -- จาก
  from_position text,         -- ตำแหน่งผู้ขอ (ท้ายเอกสาร)
  subject text default 'ขออนุมัติเบิกเสื้อช่างแขนยาว',
  quantity integer,           -- จำนวนเสื้อ (ตัว)
  reason text,                -- เนื่องจาก...
  project_note text,          -- หมายเหตุ: โครงการ / ผู้ติดต่อ

  requester_id uuid references auth.users(id),

  status shirt_request_status not null default 'pending',
  approver_initials text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  rejected_by uuid references auth.users(id),
  rejected_at timestamptz,
  rejected_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table shirt_requests enable row level security;

create policy "read all" on shirt_requests for select using (auth.role() = 'authenticated');

create policy "authenticated write" on shirt_requests for all
  using (auth.role() = 'authenticated');

create index shirt_requests_status_idx on shirt_requests(status);
