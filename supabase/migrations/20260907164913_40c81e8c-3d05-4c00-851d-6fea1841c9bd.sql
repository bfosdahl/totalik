drop policy if exists "System admins manage email assets" on storage.objects;
create policy "System admins manage email assets"
on storage.objects for all
to authenticated
using (bucket_id = 'email-assets' and public.has_role(auth.uid(), 'system_admin'))
with check (bucket_id = 'email-assets' and public.has_role(auth.uid(), 'system_admin'));