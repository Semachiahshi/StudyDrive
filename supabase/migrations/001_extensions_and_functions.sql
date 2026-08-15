create extension if not exists pgcrypto;

create or replace function prevent_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'study_events is append-only';
end;
$$;

create or replace function update_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;