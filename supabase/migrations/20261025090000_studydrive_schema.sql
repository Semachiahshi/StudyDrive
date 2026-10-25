-- StudyDrive — phase one schema.
--
-- Ownership model: every row carries user_id. Child rows reference their parent
-- through a composite (id, user_id) foreign key, so a row can never point at a
-- parent owned by someone else, and RLS restricts every operation to the owner.
-- This keeps the schema ready for several isolated users later without redesign.
--
-- Phase one intentionally inserts NO subjects, tracks, topics, dates or tasks.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.track_kind as enum (
  'didactic_test', -- didaktický test
  'essay',         -- písemná práce / slohová práce
  'oral',          -- ústní zkouška
  'practical',     -- praktická zkouška
  'other'
);

create type public.exam_date_status as enum ('provisional', 'confirmed');

create type public.topic_step as enum ('learn', 'practice', 'review');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles and preferences
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  timezone text not null default 'Europe/Prague',
  -- Pace assumptions (shown to the user, editable in Settings).
  buffer_days integer not null default 14 check (buffer_days between 0 and 120),
  study_days_per_week integer not null default 7 check (study_days_per_week between 1 and 7),
  plan_started_on date, -- null: derived from when topics were first added
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The owner's local calendar date for a timestamp. Streak days are counted in
-- this zone (Europe/Prague by default), never in UTC.
create function public.user_local_date(p_user uuid, p_at timestamptz)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (p_at at time zone coalesce(
    (select p.timezone from public.profiles p where p.id = p_user),
    'Europe/Prague'
  ))::date;
$$;

create table public.reminder_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_enabled boolean not null default true,
  study_reminder_enabled boolean not null default true,
  -- ISO weekdays (1 = Monday … 7 = Sunday) on which a study reminder may be sent.
  study_reminder_weekdays smallint[] not null default '{1,2,3,4,5,6,7}'
    check (study_reminder_weekdays <@ '{1,2,3,4,5,6,7}'::smallint[]),
  deadline_reminders_enabled boolean not null default true,
  -- How many days before an exam window or administrative deadline to remind.
  deadline_lead_days smallint[] not null default '{7,1}'
    check (cardinality(deadline_lead_days) <= 5
      and 0 <= all (deadline_lead_days) and 60 >= all (deadline_lead_days)),
  updated_at timestamptz not null default now()
);

-- Every new auth user gets a profile and default (restrained) reminder settings.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.reminder_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Study structure: subject → exam track → topic
-- ---------------------------------------------------------------------------

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  code text check (char_length(code) <= 12), -- e.g. ČJ, M, PGM
  notes text check (char_length(notes) <= 5000),
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

-- A subject can have several independent tracks (e.g. PGM oral and PGM
-- practical), each with its own topics, progress and exam window.
create table public.exam_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  kind public.track_kind not null default 'other',
  notes text check (char_length(notes) <= 5000),
  position integer not null default 0,
  -- Exam date or window. Equal start/end (or no end) = a single day.
  exam_starts_on date,
  exam_ends_on date,
  exam_date_status public.exam_date_status not null default 'provisional',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete cascade,
  check (exam_ends_on is null or (exam_starts_on is not null and exam_ends_on >= exam_starts_on))
);

-- Learn → Practice → Review. A topic is complete only when all three are done.
-- Step columns can only be changed through complete_topic_step / reopen_topic_step
-- (see grants below), which also record streak activity.
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  notes text check (char_length(notes) <= 10000),
  position integer not null default 0,
  learn_completed_at timestamptz,
  practice_completed_at timestamptz,
  review_completed_at timestamptz,
  completed_steps smallint generated always as (
    (learn_completed_at is not null)::int
    + (practice_completed_at is not null)::int
    + (review_completed_at is not null)::int
  ) stored,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (track_id, user_id) references public.exam_tracks (id, user_id) on delete cascade,
  check (practice_completed_at is null or learn_completed_at is not null),
  check (review_completed_at is null or practice_completed_at is not null)
);

-- ---------------------------------------------------------------------------
-- Study activity (drives the streak)
-- ---------------------------------------------------------------------------

-- Explicit "start studying" actions. Opening the app never creates one.
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id uuid,
  step public.topic_step,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  local_date date not null,
  foreign key (topic_id, user_id) references public.topics (id, user_id) on delete set null (topic_id),
  check (ended_at is null or ended_at >= started_at)
);

create unique index study_sessions_one_active_per_user
  on public.study_sessions (user_id) where ended_at is null;

-- History of completed steps. Kept when a topic is deleted so past streak days
-- stay intact.
create table public.step_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id uuid,
  step public.topic_step not null,
  completed_at timestamptz not null default now(),
  local_date date not null,
  foreign key (topic_id, user_id) references public.topics (id, user_id) on delete set null (topic_id)
);

-- One row per distinct study day per user.
create view public.study_days
with (security_invoker = true)
as
  select user_id, local_date from public.study_sessions
  union
  select user_id, local_date from public.step_completions;

-- ---------------------------------------------------------------------------
-- Administrative deadlines (application form, reading list, …)
-- ---------------------------------------------------------------------------

create table public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  notes text check (char_length(notes) <= 5000),
  due_on date,
  completed_at timestamptz,
  reminders_enabled boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id)
);

-- ---------------------------------------------------------------------------
-- Files and notes
-- ---------------------------------------------------------------------------

create table public.study_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid,
  track_id uuid,
  topic_id uuid,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 200),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id),
  foreign key (track_id, user_id) references public.exam_tracks (id, user_id) on delete set null (track_id),
  foreign key (topic_id, user_id) references public.topics (id, user_id) on delete set null (topic_id),
  -- Objects live under "<user_id>/…" in the private bucket.
  check (storage_path like (user_id::text || '/%'))
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid,
  track_id uuid,
  topic_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  body text not null default '' check (char_length(body) <= 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id),
  foreign key (track_id, user_id) references public.exam_tracks (id, user_id) on delete set null (track_id),
  foreign key (topic_id, user_id) references public.topics (id, user_id) on delete set null (topic_id)
);

-- ---------------------------------------------------------------------------
-- Reminder delivery log (written only by the server-side cron job)
-- ---------------------------------------------------------------------------

create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- e.g. "digest:2027-03-24", "study:2027-03-24", "track:<id>:7", "task:<id>:1"
  dedupe_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

-- ---------------------------------------------------------------------------
-- Indexes and triggers
-- ---------------------------------------------------------------------------

create index subjects_user_idx on public.subjects (user_id, position);
create index exam_tracks_subject_idx on public.exam_tracks (subject_id, position);
create index exam_tracks_user_idx on public.exam_tracks (user_id);
create index topics_track_idx on public.topics (track_id, position);
create index topics_user_idx on public.topics (user_id);
create index study_sessions_user_date_idx on public.study_sessions (user_id, local_date);
create index study_sessions_topic_idx on public.study_sessions (topic_id);
create index step_completions_user_date_idx on public.step_completions (user_id, local_date);
create index step_completions_topic_idx on public.step_completions (topic_id, step);
create index admin_tasks_user_due_idx on public.admin_tasks (user_id, due_on);
create index admin_tasks_subject_idx on public.admin_tasks (subject_id);
create index study_files_user_idx on public.study_files (user_id, created_at desc);
create index study_files_subject_idx on public.study_files (subject_id);
create index study_files_track_idx on public.study_files (track_id);
create index study_files_topic_idx on public.study_files (topic_id);
create index notes_user_idx on public.notes (user_id, updated_at desc);
create index notes_subject_idx on public.notes (subject_id);
create index notes_track_idx on public.notes (track_id);
create index notes_topic_idx on public.notes (topic_id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger reminder_preferences_updated_at before update on public.reminder_preferences
  for each row execute function public.set_updated_at();
create trigger subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger exam_tracks_updated_at before update on public.exam_tracks
  for each row execute function public.set_updated_at();
create trigger topics_updated_at before update on public.topics
  for each row execute function public.set_updated_at();
create trigger admin_tasks_updated_at before update on public.admin_tasks
  for each row execute function public.set_updated_at();
create trigger study_files_updated_at before update on public.study_files
  for each row execute function public.set_updated_at();
create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Study actions (the only way to change step state or log activity)
-- ---------------------------------------------------------------------------

create function public.complete_topic_step(p_topic_id uuid, p_step public.topic_step)
returns public.topics
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_topic public.topics;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.topics t
     set learn_completed_at = case when p_step = 'learn' then now() else t.learn_completed_at end,
         practice_completed_at = case when p_step = 'practice' then now() else t.practice_completed_at end,
         review_completed_at = case when p_step = 'review' then now() else t.review_completed_at end
   where t.id = p_topic_id
     and t.user_id = v_uid
     and case p_step
           when 'learn' then t.learn_completed_at is null
           when 'practice' then t.practice_completed_at is null and t.learn_completed_at is not null
           when 'review' then t.review_completed_at is null and t.practice_completed_at is not null
         end
  returning * into v_topic;

  if not found then
    raise exception 'step cannot be completed (missing topic, already done, or previous step open)'
      using errcode = 'P0001';
  end if;

  insert into public.step_completions (user_id, topic_id, step, local_date)
  values (v_uid, p_topic_id, p_step, public.user_local_date(v_uid, now()));

  return v_topic;
end;
$$;

-- Correct a step marked complete by mistake. Only the latest completed step can
-- be reopened, which keeps the Learn → Practice → Review order intact. If the
-- step was completed today, today's completion record is removed too, so a
-- mistaken click does not count as a study day.
create function public.reopen_topic_step(p_topic_id uuid, p_step public.topic_step)
returns public.topics
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_topic public.topics;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.topics t
     set learn_completed_at = case when p_step = 'learn' then null else t.learn_completed_at end,
         practice_completed_at = case when p_step = 'practice' then null else t.practice_completed_at end,
         review_completed_at = case when p_step = 'review' then null else t.review_completed_at end
   where t.id = p_topic_id
     and t.user_id = v_uid
     and case p_step
           when 'learn' then t.learn_completed_at is not null and t.practice_completed_at is null
           when 'practice' then t.practice_completed_at is not null and t.review_completed_at is null
           when 'review' then t.review_completed_at is not null
         end
  returning * into v_topic;

  if not found then
    raise exception 'step cannot be reopened (missing topic, not done, or a later step is done)'
      using errcode = 'P0001';
  end if;

  delete from public.step_completions c
   where c.user_id = v_uid
     and c.topic_id = p_topic_id
     and c.step = p_step
     and c.local_date = public.user_local_date(v_uid, now());

  return v_topic;
end;
$$;

-- Explicitly start studying (optionally a specific topic/step). Ends any
-- session that is still open.
create function public.start_study_session(
  p_topic_id uuid default null,
  p_step public.topic_step default null
)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.study_sessions;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_topic_id is not null and not exists (
    select 1 from public.topics t where t.id = p_topic_id and t.user_id = v_uid
  ) then
    raise exception 'topic not found' using errcode = 'P0002';
  end if;

  update public.study_sessions s
     set ended_at = now()
   where s.user_id = v_uid and s.ended_at is null;

  insert into public.study_sessions (user_id, topic_id, step, local_date)
  values (v_uid, p_topic_id, p_step, public.user_local_date(v_uid, now()))
  returning * into v_session;

  return v_session;
end;
$$;

create function public.end_study_session()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.study_sessions s
     set ended_at = now()
   where s.user_id = auth.uid() and s.ended_at is null;
$$;

revoke all on function public.complete_topic_step(uuid, public.topic_step) from public, anon;
revoke all on function public.reopen_topic_step(uuid, public.topic_step) from public, anon;
revoke all on function public.start_study_session(uuid, public.topic_step) from public, anon;
revoke all on function public.end_study_session() from public, anon;
revoke all on function public.user_local_date(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.complete_topic_step(uuid, public.topic_step) to authenticated;
grant execute on function public.reopen_topic_step(uuid, public.topic_step) to authenticated;
grant execute on function public.start_study_session(uuid, public.topic_step) to authenticated;
grant execute on function public.end_study_session() to authenticated;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

-- Nothing is readable or writable without signing in.
revoke all on all tables in schema public from anon;

-- Activity and delivery logs are read-only to the owner; writes go through
-- the functions above (activity) or the server-side cron job (reminder_log).
revoke insert, update, delete on public.study_sessions, public.step_completions, public.reminder_log
  from authenticated;

-- Profiles are created by trigger; ids cannot be changed.
revoke insert, delete on public.profiles, public.reminder_preferences from authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, timezone, buffer_days, study_days_per_week, plan_started_on)
  on public.profiles to authenticated;
revoke update on public.reminder_preferences from authenticated;
grant update (email_enabled, study_reminder_enabled, study_reminder_weekdays,
              deadline_reminders_enabled, deadline_lead_days)
  on public.reminder_preferences to authenticated;

-- Topic step columns are changed only via complete/reopen_topic_step.
revoke update on public.topics from authenticated;
grant update (track_id, title, notes, position, archived_at) on public.topics to authenticated;

-- Ownership columns never change after insert.
revoke update on public.subjects from authenticated;
grant update (name, code, notes, position, archived_at) on public.subjects to authenticated;
revoke update on public.exam_tracks from authenticated;
grant update (subject_id, name, kind, notes, position, exam_starts_on, exam_ends_on,
              exam_date_status, archived_at)
  on public.exam_tracks to authenticated;
revoke update on public.admin_tasks from authenticated;
grant update (subject_id, title, notes, due_on, completed_at, reminders_enabled, archived_at)
  on public.admin_tasks to authenticated;
revoke update on public.study_files from authenticated;
grant update (subject_id, track_id, topic_id, display_name) on public.study_files to authenticated;
revoke update on public.notes from authenticated;
grant update (subject_id, track_id, topic_id, title, body) on public.notes to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.reminder_preferences enable row level security;
alter table public.subjects enable row level security;
alter table public.exam_tracks enable row level security;
alter table public.topics enable row level security;
alter table public.study_sessions enable row level security;
alter table public.step_completions enable row level security;
alter table public.admin_tasks enable row level security;
alter table public.study_files enable row level security;
alter table public.notes enable row level security;
alter table public.reminder_log enable row level security;

create policy "profiles: owner reads" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: owner updates" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "reminder_preferences: owner reads" on public.reminder_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reminder_preferences: owner updates" on public.reminder_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "study_sessions: owner reads" on public.study_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "step_completions: owner reads" on public.step_completions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reminder_log: owner reads" on public.reminder_log
  for select to authenticated using ((select auth.uid()) = user_id);

-- Full CRUD for the owner on user-managed tables.
do $$
declare
  t text;
begin
  foreach t in array array['subjects', 'exam_tracks', 'topics', 'admin_tasks', 'study_files', 'notes']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || ': owner reads', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || ': owner inserts', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || ': owner updates', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || ': owner deletes', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Private file storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('study-files', 'study-files', false, 52428800) -- 50 MB per file
on conflict (id) do nothing;

create policy "study-files: owner reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "study-files: owner uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "study-files: owner updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "study-files: owner deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
