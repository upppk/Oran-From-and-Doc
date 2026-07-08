-- ใบเคลมคุณภาพ (Quality Claim) — additive migration.
-- Run this in the Supabase SQL editor after schema.sql.

create type quality_claim_status as enum ('pending', 'resolved');

create table quality_claims (
  id uuid primary key default gen_random_uuid(),
  claim_no text,                            -- optional free-text reference no.
  claim_date date not null default current_date,
  to_person text default 'ผู้จัดการโรงงาน',

  shop_name text,
  shop_phone text,
  shop_address text,
  department text,

  -- items: [{product_name, qty}]
  items jsonb not null default '[]',

  roof_type text,          -- ลักษณะการมุง
  structure text,          -- โครงสร้าง
  damage_desc text,        -- ลักษณะความเสียหาย
  damage_qty text,         -- จำนวนเสียหาย (free text, e.g. "26 แผ่น")
  purpose text,            -- วัตถุประสงค์

  factory_comment text,    -- ความเห็นของโรงงาน (หลังการตรวจสอบ)

  submitted_by_name text,
  submitted_by uuid references auth.users(id),
  print_date date default current_date,

  status quality_claim_status not null default 'pending',
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quality_claims enable row level security;

create policy "read all" on quality_claims for select using (auth.role() = 'authenticated');

create policy "sales/factory/admin write" on quality_claims for all
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role in ('sales', 'factory', 'admin')
  ));

create index quality_claims_status_idx on quality_claims(status);
