-- VOIDWORKS ID: database hardening for the current schema.

-- account_controls is readable only by the account owner through the existing RLS policy.
grant select on table public.account_controls to authenticated;

-- Enforce the same username rules in Postgres that the UI enforces.
alter table public.profiles
  add constraint profiles_username_format_check
  check (
    char_length(username) between 3 and 24
    and username ~ '^[A-Za-z0-9_-]+$'
  );
