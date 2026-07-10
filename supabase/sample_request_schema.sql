-- ใบขอสินค้าตัวอย่าง (Sample Product Request) — additive migration.
-- Run this in the Supabase SQL editor after the other schema files.

create type sample_request_status as enum ('pending', 'checked', 'approved', 'rejected');

create table sample_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text,
  request_date date not null default current_date,
  to_person text default 'หัวหน้าคลังสินค้า',
  employee_name text,
  zone_province text,

  -- items: [{product_name, qty}]  (qty = จำนวนแผ่น)
  items jsonb not null default '[]',

  reason text,

  requester_name text,
  requester_id uuid references auth.users(id),

  checked_by_name text,
  checked_by uuid references auth.users(id),
  checked_at timestamptz,

  approved_by_name text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,

  status sample_request_status not null default 'pending',
  rejected_by uuid references auth.users(id),
  rejected_at timestamptz,
  rejected_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sample_requests enable row level security;

create policy "read all" on sample_requests for select using (auth.role() = 'authenticated');

create policy "sales/warehouse/admin write" on sample_requests for all
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role in ('sales', 'warehouse', 'admin')
  ));

create index sample_requests_status_idx on sample_requests(status);
