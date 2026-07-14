-- ใบผ่านวัสดุออกนอกโรงงาน (Material Out-Pass) — additive migration.
-- Run this in the Supabase SQL editor after the other schema files.

create type material_pass_status as enum ('pending', 'exited', 'rejected');

create table material_passes (
  id uuid primary key default gen_random_uuid(),
  doc_no text,                 -- เลขที่ (auto-generated DD-MM-YYYY-###)
  book_no text,                -- เล่มที่ (optional, free text)
  pass_date date not null default current_date,
  destination text,            -- สถานที่ส่ง
  vehicle_no text,              -- ทะเบียนรถที่บรรทุก
  driver_name text,             -- ผู้ขับรถ
  issue_time text,              -- เวลาออกใบผ่าน

  -- items: [{qty, unit, description, remark}]
  items jsonb not null default '[]',

  requester_id uuid references auth.users(id),
  issuer_name text,             -- ผู้ออกใบผ่าน
  received_origin_name text,    -- ผู้รับต้นทาง
  received_dest_name text,      -- ผู้รับปลายทาง

  exit_no text,                 -- เลขที่ผ่านออก
  exit_date date,
  exit_time text,
  warehouse_head_name text,     -- หัวหน้าแผนกคลังสินค้า
  gate_guard_name text,         -- ผู้รักษาประตูโรงงาน

  status material_pass_status not null default 'pending',
  exited_by uuid references auth.users(id),
  exited_at timestamptz,
  rejected_by uuid references auth.users(id),
  rejected_at timestamptz,
  rejected_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table material_passes enable row level security;

create policy "read all" on material_passes for select using (auth.role() = 'authenticated');

create policy "authenticated write" on material_passes for all
  using (auth.role() = 'authenticated');

create index material_passes_status_idx on material_passes(status);
