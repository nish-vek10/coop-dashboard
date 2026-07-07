-- supabase/migration.sql
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query) BEFORE
-- using the rebuilt dashboard. It cannot be run automatically from this session because
-- schema changes require the project's service-role/DB credentials, which this app does
-- not hold (it only uses the public anon key).
--
-- Fully idempotent: safe to run more than once, and safe whether your schema is
-- currently called "coop" or already "rota".
--
-- What this does:
--   1. Renames the "coop" schema to "rota" IF "coop" still exists (drops Co-op
--      branding at the DB level). If your schema is already named "rota", this step
--      is skipped automatically.
--   2. Adds employees.pay_rate (£ per hour, agreed rate keyed in on Add Employee).
--   3. Drops employees.contracted_minutes (contracted hours column removed from UI).
--   4. Drops shifts.break_minutes (break column removed from UI).
--
-- Existing employees will get pay_rate = 0 by default — re-open each employee's
-- Edit modal afterwards and set their real agreed hourly rate.

begin;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'coop')
     and not exists (select 1 from pg_namespace where nspname = 'rota') then
    execute 'alter schema coop rename to rota';
  end if;
end
$$;

alter table if exists rota.employees
  add column if not exists pay_rate numeric(10, 2) not null default 0;

alter table if exists rota.employees
  drop column if exists contracted_minutes;

alter table if exists rota.shifts
  drop column if exists break_minutes;

commit;
