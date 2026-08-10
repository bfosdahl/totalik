create schema if not exists backup_numbering;
revoke all on schema backup_numbering from anon, authenticated;

create table if not exists backup_numbering.deviations_20260810 as select id, company_id, deviation_number from public.deviations;
create table if not exists backup_numbering.ks_module2_projects_20260810 as select id, company_id, project_number from public.ks_module2_projects;
create table if not exists backup_numbering.audits_20260810 as select id, company_id, audit_number from public.audits;
create table if not exists backup_numbering.ks_module2_avvik_20260810 as select id, company_id, avvik_number from public.ks_module2_avvik;

lock table public.ks_module2_avvik in share row exclusive mode;

with duplicate_rows as (
  select id, company_id, avvik_number,
         row_number() over (partition by company_id, avvik_number order by created_at nulls last, id) as dp
  from public.ks_module2_avvik where avvik_number is not null
),
rows_to_renumber as (
  select id, company_id, avvik_number,
         row_number() over (partition by company_id order by avvik_number, id) as off
  from duplicate_rows where dp > 1
),
maxes as (
  select company_id, coalesce(max(nullif(regexp_replace(avvik_number, '\D', '', 'g'), '')::bigint), 0) as maxnum
  from public.ks_module2_avvik where avvik_number ~ '\d' group by company_id
),
changes as (
  select r.id, r.company_id, r.avvik_number as old_number,
         'AVV-' || public.pad_number(m.maxnum + r.off, 4) as new_number
  from rows_to_renumber r join maxes m on m.company_id = r.company_id
)
update public.ks_module2_avvik a
set avvik_number = c.new_number
from changes c
where a.id = c.id and a.company_id = c.company_id and a.avvik_number is not distinct from c.old_number;

select setval('ks_module2_avvik_number_seq',
  greatest(
    (select last_value from ks_module2_avvik_number_seq),
    (select coalesce(max(nullif(regexp_replace(avvik_number, '\D', '', 'g'), '')::bigint), 0) from public.ks_module2_avvik where avvik_number ~ '\d')
  ), true);

create unique index if not exists uq_deviations_company_number on public.deviations (company_id, deviation_number) where deviation_number is not null;
create unique index if not exists uq_audits_company_number on public.audits (company_id, audit_number) where audit_number is not null;
create unique index if not exists uq_ks_module2_avvik_company_number on public.ks_module2_avvik (company_id, avvik_number) where avvik_number is not null;