create index if not exists email_logs_recipient_status_idx
  on public.email_logs (lower(recipient_email), status, created_at)
  include (bounced_at, delivered_at);

create or replace function public.suppressed_emails(p_emails text[])
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  -- Suppress an address only if its most recent bounce/complaint is strictly newer
  -- than its most recent successful delivery.
  with q as (
    select array_agg(distinct lower(trim(x))) as arr from unnest(p_emails) as x
  ), bad as (
    select lower(e.recipient_email) as email,
           max(coalesce(e.bounced_at, e.created_at)) as last_bad
    from public.email_logs e, q
    where e.status in ('bounced','complained')
      and lower(e.recipient_email) = any (q.arr)
    group by 1
  )
  select b.email
  from bad b
  where not exists (
    select 1 from public.email_logs d
    where lower(d.recipient_email) = b.email
      and d.status = 'delivered'
      and coalesce(d.delivered_at, d.created_at) >= b.last_bad
  );
$$;
revoke all on function public.suppressed_emails(text[]) from public, anon, authenticated;
grant execute on function public.suppressed_emails(text[]) to service_role;