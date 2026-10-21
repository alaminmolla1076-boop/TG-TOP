begin;
alter table public.session_requests add column if not exists age_selection text;
commit;