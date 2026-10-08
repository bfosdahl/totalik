create or replace function public.suppressed_emails(p_emails text[])
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct lower(e.recipient_email)
  from public.email_logs e
  where e.status in ('bounced','complained')
    and lower(e.recipient_email) = any (select lower(trim(x)) from unnest(p_emails) as x);
$$;
revoke all on function public.suppressed_emails(text[]) from public, anon, authenticated;
grant execute on function public.suppressed_emails(text[]) to service_role;