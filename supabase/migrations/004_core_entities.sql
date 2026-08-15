create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_type text not null default 'custom',
  status project_status not null default 'draft',
  deadline_at timestamptz not null,
  daily_capacity_minutes int not null check (daily_capacity_minutes >= 0),
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_topic_id uuid references topics(id) on delete cascade,
  name text not null,
  status topic_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table source_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  sha256 text not null,
  status file_status not null default 'uploaded',
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table study_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_document_id uuid references source_documents(id) on delete set null,
  type study_item_type not null,
  prompt text not null,
  explanation text,
  ai_confidence_score numeric(5,4) check (ai_confidence_score between 0 and 1),
  ai_model_id text,
  prompt_version text,
  provenance_details jsonb,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table study_item_options (
  id uuid primary key default gen_random_uuid(),
  study_item_id uuid not null references study_items(id) on delete cascade,
  content text not null,
  is_correct boolean not null
);

create table study_item_topics (
  study_item_id uuid not null references study_items(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (study_item_id, topic_id)
);

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_type session_type not null,
  status session_status not null default 'planned',
  estimated_minutes int not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references study_sessions(id) on delete cascade,
  study_item_id uuid not null references study_items(id) on delete cascade,
  position int not null,
  status task_status not null default 'pending'
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references study_sessions(id) on delete cascade,
  study_item_id uuid not null references study_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  study_item_option_id uuid references study_item_options(id),
  is_correct boolean not null,
  response_time_ms bigint,
  engine_version text not null,
  created_at timestamptz not null default timezone('utc', now())
);