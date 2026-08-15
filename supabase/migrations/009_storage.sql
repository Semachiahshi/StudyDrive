-- Create the private bucket in Supabase dashboard/API:
-- source_documents
-- Then apply storage policies below.

create policy "source documents upload own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'source_documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "source documents read own folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'source_documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);