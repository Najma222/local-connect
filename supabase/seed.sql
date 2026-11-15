-- Legacy cleanup only. The Delhi-style demo rows from the first version of this
-- project are removed here. All Bangalore demo data now lives in
-- supabase/demo-bangalore.sql, which is safe to run again at any time.
-- Run order: schema.sql -> seed.sql -> update-v2.sql -> demo-bangalore.sql.

delete from shops where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009'
);
