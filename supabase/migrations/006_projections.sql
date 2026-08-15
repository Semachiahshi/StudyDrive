create table knowledge_states (
  topic_id uuid primary key references topics(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mastery numeric(5,2) not null default 0 check (mastery between 0 and 100),
  successful_attempts int not null default 0,
  failed_attempts int not null default 0,
  is_mastered boolean not null default false,
  engine_version text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table spaced_repetition_states (
  study_item_id uuid primary key references study_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  interval_days int not null default 0,
  ease_factor numeric(5,2) not null default 2.5,
  repetitions int not null default 0,
  next_review_at timestamptz not null,
  engine_version text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table project_states (
  project_id uuid primary key references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ers numeric(5,2) not null default 0 check (ers between 0 and 100),
  deadline_risk risk_state not null default 'insufficient_data',
  required_pace_minutes int not null default 0,
  engine_version text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  date date not null,
  status plan_status not null default 'generated',
  estimated_minutes int not null default 0,
  required_pace_minutes int not null default 0,
  engine_version text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(project_id, date)
);

create table daily_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references daily_plans(id) on delete cascade,
  study_session_id uuid not null references study_sessions(id) on delete cascade,
  priority int not null,
  status task_status not null default 'pending',
  estimated_minutes int not null,
  reason_code task_reason not null,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table gamification_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp int not null default 0 check (total_xp >= 0),
  current_streak int not null default 0 check (current_streak >= 0),
  engine_version text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  action text not null,
  target_table text not null,
  target_id uuid not null,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);