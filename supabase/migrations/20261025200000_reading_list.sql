-- Reading list for the Czech oral exam ("čtenářský deník").
--
-- The school publishes a list of literary works; the student picks 20 of them.
-- Each work is stored on the exam track it belongs to. Picking a work creates a
-- topic on that track (read → analysis → review) and links it here, so a work is
-- picked exactly when topic_id is set. Deleting the topic un-picks the work.

create type public.literary_period as enum (
  'before_1800',   -- světová a česká literatura do konce 18. století
  'century_19',    -- světová a česká literatura 19. století
  'world_modern',  -- světová literatura 20. a 21. století
  'czech_modern'   -- česká literatura 20. a 21. století
);

create type public.literary_form as enum ('prose', 'poetry', 'drama');

create table public.reading_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id uuid not null,
  position integer not null default 0,
  author text not null check (char_length(btrim(author)) between 1 and 200),
  -- Groups works for the "at most two works by one author" rule.
  author_key text not null check (char_length(btrim(author_key)) between 1 and 200),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  period public.literary_period not null,
  form public.literary_form not null,
  topic_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (track_id, user_id) references public.exam_tracks (id, user_id) on delete cascade,
  foreign key (topic_id, user_id) references public.topics (id, user_id) on delete set null (topic_id)
);

create index reading_works_track_idx on public.reading_works (track_id, position);

create trigger reading_works_updated_at before update on public.reading_works
  for each row execute function public.set_updated_at();

revoke all on public.reading_works from anon;
-- Only the pick (topic_id) changes from the app; the list itself is imported.
revoke update on public.reading_works from authenticated;
grant update (topic_id) on public.reading_works to authenticated;

alter table public.reading_works enable row level security;

create policy "reading_works: owner reads" on public.reading_works
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reading_works: owner inserts" on public.reading_works
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reading_works: owner updates" on public.reading_works
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reading_works: owner deletes" on public.reading_works
  for delete to authenticated using ((select auth.uid()) = user_id);
