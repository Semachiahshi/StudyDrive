create table study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  event_type text not null,
  aggregate_type event_aggregate_type not null,
  aggregate_id uuid not null,
  idempotency_key uuid not null,
  client_sequence_id bigint not null,
  client_created_at timestamptz not null,
  server_created_at timestamptz not null default timezone('utc', now()),
  engine_version text not null,
  payload jsonb not null,
  unique(user_id, idempotency_key)
);

create trigger enforce_study_events_immutability
before update or delete on study_events
for each row execute function prevent_event_mutation();