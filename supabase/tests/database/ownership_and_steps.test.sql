-- Run with: npx supabase test db
-- Verifies owner isolation (RLS + composite FKs), protected columns, the
-- Learn → Practice → Review rules, streak logging and storage folder policies.
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- Two users. Sign-up is disabled in the app; these rows exist only inside this
-- rolled-back test transaction.
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-4000-8000-00000000000a', 'owner-a@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000b', 'owner-b@example.test', 'authenticated', 'authenticated');

select is(
  (select count(*)::int from public.profiles where id in (
    '00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000b')),
  2, 'profiles are created for new users');
select is(
  (select timezone from public.profiles where id = '00000000-0000-4000-8000-00000000000a'),
  'Europe/Prague', 'default timezone is Europe/Prague');
select is(
  (select deadline_lead_days from public.reminder_preferences where user_id = '00000000-0000-4000-8000-00000000000a'),
  '{7,1}'::smallint[], 'restrained default reminder lead days');

-- ---------------------------------------------------------------- user A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);

insert into public.subjects (id, name, code) values ('10000000-0000-4000-8000-000000000001', 'Testovací předmět', 'T');
insert into public.exam_tracks (id, subject_id, name, kind)
  values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Ústní', 'oral');
insert into public.topics (id, track_id, title)
  values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Téma 1');

select is((select count(*)::int from public.topics), 1, 'A sees own topic');
select is((select user_id::text from public.subjects), '00000000-0000-4000-8000-00000000000a', 'user_id defaults to auth.uid()');

select throws_ok(
  $$ update public.topics set learn_completed_at = now() where id = '30000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'step columns cannot be updated directly');
select throws_ok(
  $$ insert into public.subjects (user_id, name) values ('00000000-0000-4000-8000-00000000000b', 'x') $$,
  '42501', null, 'cannot insert rows for another user');

select throws_ok(
  $$ select public.complete_topic_step('30000000-0000-4000-8000-000000000001', 'practice') $$,
  'P0001', null, 'practice cannot be completed before learn');
select lives_ok(
  $$ select public.complete_topic_step('30000000-0000-4000-8000-000000000001', 'learn') $$,
  'learn can be completed');
select is((select completed_steps::int from public.topics), 1, 'completed_steps counts learn');
select is((select count(*)::int from public.step_completions), 1, 'completion is logged');
select is((select count(*)::int from public.study_days), 1, 'completion creates a study day');
select is(
  (select local_date from public.step_completions),
  (now() at time zone 'Europe/Prague')::date, 'study day uses the Prague calendar date');
select throws_ok(
  $$ select public.complete_topic_step('30000000-0000-4000-8000-000000000001', 'learn') $$,
  'P0001', null, 'a step cannot be completed twice');

select lives_ok(
  $$ select public.reopen_topic_step('30000000-0000-4000-8000-000000000001', 'learn') $$,
  'a mistaken step can be reopened');
select is((select completed_steps::int from public.topics), 0, 'reopen clears the step');
select is((select count(*)::int from public.study_days), 0, 'reopening today removes today''s mistaken study day');

select lives_ok($$ select public.complete_topic_step('30000000-0000-4000-8000-000000000001', 'learn') $$, 'learn again');
select lives_ok($$ select public.complete_topic_step('30000000-0000-4000-8000-000000000001', 'practice') $$, 'practice');
select throws_ok(
  $$ select public.reopen_topic_step('30000000-0000-4000-8000-000000000001', 'learn') $$,
  'P0001', null, 'learn cannot be reopened while practice is done');
select lives_ok($$ select public.complete_topic_step('30000000-0000-4000-8000-000000000001', 'review') $$, 'review');
select is((select completed_steps::int from public.topics), 3, 'topic is complete after all three steps');

select throws_ok(
  $$ insert into public.study_sessions (local_date) values (current_date) $$,
  '42501', null, 'sessions cannot be inserted directly');
select lives_ok($$ select public.start_study_session('30000000-0000-4000-8000-000000000001', 'review') $$, 'start session');
select lives_ok($$ select public.start_study_session() $$, 'starting again ends the previous session');
select is((select count(*)::int from public.study_sessions where ended_at is null), 1, 'only one active session');

select throws_ok(
  $$ insert into public.reminder_log (user_id, dedupe_key) values ('00000000-0000-4000-8000-00000000000a', 'x') $$,
  '42501', null, 'reminder log is written only server-side');
select throws_ok(
  $$ insert into public.study_files (display_name, storage_path) values ('x', '00000000-0000-4000-8000-00000000000b/x') $$,
  '23514', null, 'file metadata must point into the owner''s folder');

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('study-files', '00000000-0000-4000-8000-00000000000a/notes.pdf') $$,
  'owner can upload into own folder');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('study-files', '00000000-0000-4000-8000-00000000000b/evil.pdf') $$,
  '42501', null, 'owner cannot upload into another user''s folder');

-- ---------------------------------------------------------------- user B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.subjects) + (select count(*)::int from public.topics)
  + (select count(*)::int from public.step_completions) + (select count(*)::int from storage.objects where bucket_id = 'study-files'),
  0, 'B sees none of A''s data or files');
select throws_ok(
  $$ insert into public.exam_tracks (subject_id, name) values ('10000000-0000-4000-8000-000000000001', 'Cizí') $$,
  '23503', null, 'B cannot attach a track to A''s subject');
select throws_ok(
  $$ select public.reopen_topic_step('30000000-0000-4000-8000-000000000001', 'review') $$,
  'P0001', null, 'B cannot change A''s topic steps');

-- ---------------------------------------------------------------- anonymous
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$ select count(*) from public.subjects $$, '42501', null, 'anonymous visitors cannot read any table');

select * from finish();
rollback;
