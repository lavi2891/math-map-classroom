-- Allow students to remove file metadata for their own homework submissions.

drop policy if exists "homework_files_delete_owner"
on public.homework_files;

create policy "homework_files_delete_owner"
on public.homework_files
for delete
to authenticated
using (public.is_owner_of_submission(submission_id));
