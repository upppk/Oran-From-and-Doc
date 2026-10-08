-- ความเห็นหัวหน้าฝ่ายการตลาด on ใบเคลมคุณภาพ.
-- Run in the Supabase SQL editor after the other quality_claim migrations.
alter table quality_claims add column if not exists marketing_opinion text
  check (marketing_opinion in ('proceed', 'not_eligible'));
alter table quality_claims add column if not exists marketing_opinion_reason text;
alter table quality_claims add column if not exists marketing_opinion_by uuid references auth.users(id);
alter table quality_claims add column if not exists marketing_opinion_at timestamptz;

-- Marketing managers also need to write their opinion on a claim.
drop policy if exists "sales/factory/admin write" on quality_claims;
create policy "sales/factory/marketing/admin write" on quality_claims for all
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role in ('sales', 'factory', 'marketing_manager', 'admin')
  ));
