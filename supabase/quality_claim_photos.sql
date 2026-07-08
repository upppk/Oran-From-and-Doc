-- Add photo attachments to ใบเคลมคุณภาพ. Run after quality_claim_schema.sql.

alter table quality_claims add column if not exists photo_urls text[] default '{}';

insert into storage.buckets (id, name, public)
values ('quality-claim-photos', 'quality-claim-photos', true)
on conflict (id) do nothing;

create policy "read claim photos" on storage.objects for select
  using (bucket_id = 'quality-claim-photos');

create policy "upload claim photos" on storage.objects for insert
  with check (bucket_id = 'quality-claim-photos' and auth.role() = 'authenticated');

create policy "delete claim photos" on storage.objects for delete
  using (bucket_id = 'quality-claim-photos' and auth.role() = 'authenticated');
