-- Manual repair helper for orphan homework file metadata.
-- Run only from Supabase SQL Editor/admin tooling when repairing data.
-- Do not run this automatically from the application.

-- Find homework_files rows whose storage object is missing.
select f.*
from public.homework_files f
left join storage.objects o
  on o.bucket_id = 'homework-submissions'
 and o.name = f.file_path
where o.id is null;

-- Delete orphan homework_files rows after reviewing the result above.
delete from public.homework_files f
where not exists (
  select 1
  from storage.objects o
  where o.bucket_id = 'homework-submissions'
    and o.name = f.file_path
);
