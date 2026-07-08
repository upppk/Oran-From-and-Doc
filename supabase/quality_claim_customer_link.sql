-- Link ใบเคลมคุณภาพ to the customer master data for lookup/autofill.
alter table quality_claims add column if not exists customer_code text;
