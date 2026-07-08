-- ใบขออนุมัติราคาพิเศษ — full schema for a fresh Supabase project.
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- ── Auth / user profile tables ───────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_approved boolean not null default false,
  created_at timestamptz default now()
);

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer',
  department text,
  created_at timestamptz default now()
);

-- Auto-create profile rows when a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_approved)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  insert into public.user_profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'viewer');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
alter table user_profiles enable row level security;

-- Any authenticated user can see who else is registered (small internal team app).
create policy "read all" on profiles for select using (auth.role() = 'authenticated');
create policy "read all" on user_profiles for select using (auth.role() = 'authenticated');

-- Users may update their own profile (e.g. full_name during signup);
-- admins may update anyone (approval, role assignment).
create policy "update own or admin" on profiles for update using (
  auth.uid() = id or exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);
create policy "update own or admin" on user_profiles for update using (
  auth.uid() = id or exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);
create policy "upsert own or admin" on user_profiles for insert with check (
  auth.uid() = id or exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);

-- ── Master data (uploaded/edited by admin; CSV import supported later) ──────

create table sales_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category_code text not null,        -- e.g. 'A', 'W'
  category_label text not null,       -- e.g. 'กลุ่มใยหิน', 'กลุ่มไม้ฝา'
  weight_per_unit_kg numeric not null,
  list_price numeric,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table sales_customers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  zone_province text,
  freight_baht_per_ton numeric,
  credit_days integer default 0,      -- 0 = เงินสด
  active boolean not null default true,
  created_at timestamptz default now()
);

-- ── Price approval documents ─────────────────────────────────────────────────

create type price_approval_status as enum
  ('draft', 'pending_area_head', 'pending_marketing', 'approved', 'rejected');

create table price_approvals (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,             -- free text, e.g. "N269พ059"
  request_date date not null default current_date,
  salesperson_name text not null,
  effective_date date,
  expiry_date date,

  customer_code text,
  customer_name text not null,
  zone_province text,
  credit_days integer,
  freight_rate_baht_per_ton numeric,
  delivery_condition text,                 -- 'company_deliver' | 'customer_pickup'
  freight_support_baht_per_ton numeric default 0,
  claim_percent text,
  quarterly_percent numeric default 0,
  memo text,

  -- lines: [{category_code,category_label,product_code,product_name,
  --   weight_per_unit_kg,qty,list_price,discount_percent,requested_unit_price}]
  lines jsonb not null default '[]',

  -- denormalized, recomputed & written on every save (source of truth is `lines`)
  total_weight_kg numeric,
  total_amount numeric,
  overall_baht_per_ton numeric,

  status price_approval_status not null default 'draft',
  created_by uuid references auth.users(id),

  area_head_id uuid references auth.users(id),
  area_head_approved_at timestamptz,

  marketing_manager_id uuid references auth.users(id),
  marketing_approved_at timestamptz,

  rejected_by uuid references auth.users(id),
  rejected_at timestamptz,
  rejected_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table sales_products enable row level security;
alter table sales_customers enable row level security;
alter table price_approvals enable row level security;

create policy "read all" on sales_products  for select using (auth.role() = 'authenticated');
create policy "read all" on sales_customers for select using (auth.role() = 'authenticated');
create policy "read all" on price_approvals for select using (auth.role() = 'authenticated');

create policy "admin write master products" on sales_products for all
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "admin write master customers" on sales_customers for all
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- Coarse write policy for the sales workflow — exact per-transition legality
-- (who may submit/approve/reject) is enforced in the app.
create policy "sales workflow write" on price_approvals for all
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role in ('sales', 'area_head', 'marketing_manager', 'admin')
  ));

create index price_approvals_status_idx on price_approvals(status);
create index price_approvals_created_by_idx on price_approvals(created_by);

-- ── First admin ───────────────────────────────────────────────────────────────
-- After you sign up your own account through the app's /login "สมัครสมาชิก" tab,
-- run this once (replace the email) to approve yourself and become admin:
--
-- update profiles set is_approved = true where email = 'you@example.com';
-- update user_profiles set role = 'admin'
--   where id = (select id from profiles where email = 'you@example.com');
