# StudyDrive

A private, installable web app (PWA) for one student's maturita preparation.
It shows the route to the exams, what is left to learn, whether the current
pace is enough, and an optional next step. The interface is in Czech.

**Phase one status:** the app is built and ships with **no content** — no
subjects, topics, exam dates, deadlines or files. Content is added in phase two
(see the end of this file) or manually in the app.

## Stack

- Next.js 16 (App Router, Cache Components) + React 19, TypeScript, Tailwind CSS 4
- Supabase: email auth (one-time code), Postgres with Row Level Security, private Storage
- Vercel hosting + Vercel Cron for the daily reminder job; Resend for email delivery
- Vitest (domain logic) and pgTAP (database security tests)

## Where things live

| Path | What |
| --- | --- |
| `src/app/(app)/page.tsx` | Dashboard (Přehled): countdown, progress, streak, pace, warning, suggestion, route, deadlines |
| `src/app/(app)/subjects`, `tracks/[trackId]` | Subjects → exam tracks → topics with Learn / Practice / Review steps |
| `src/app/(app)/calendar` | Exam dates/windows (per track) and administrative deadlines |
| `src/app/(app)/files` | Private uploads and notes (no parsing) |
| `src/app/(app)/settings` | Pace assumptions, reminder preferences, configuration status |
| `src/app/(app)/actions.ts` | All mutations (server actions; each re-checks the owner) |
| `src/app/login`, `src/app/auth/*` | One-time-code login, email-link confirmation, sign-out |
| `src/app/api/cron/reminders` | Daily reminder job (protected by `CRON_SECRET`) |
| `src/lib/domain/*` | Pure logic: Prague dates, streak, steps, progress, pace, suggestion, reminder planning |
| `src/lib/model.ts` | Builds the view model (roll-ups, timeline, missing info) from rows |
| `src/proxy.ts`, `src/lib/auth.ts` | Session refresh + owner check |
| `supabase/migrations/` | The schema, RLS policies, step/streak functions and the private bucket |
| `supabase/tests/database/` | pgTAP tests for owner isolation and step rules |
| `supabase/templates/` | Czech login/invite email templates (code + link) |

## Data model

`subjects` → `exam_tracks` → `topics`. A subject can have several independent
tracks (e.g. PGM oral and PGM practical), each with its own topics, progress
and exam date or window (`exam_starts_on`, optional `exam_ends_on`,
`provisional`/`confirmed`). Topics carry three ordered steps
(`learn/practice/review_completed_at`); a topic is complete only after all
three. Also: `admin_tasks` (deadlines), `study_files` + `notes`,
`study_sessions` and `step_completions` (streak history), `profiles` (pace
assumptions), `reminder_preferences`, `reminder_log` (dedupe).

Reading list (`reading_works`): the school's list of literary works for the
Czech oral exam, stored on that exam track. Picking a work on the track page
checks the rules (20 works; at least 2/3/4/5 per period; at least 2 each of
prose, poetry and drama; at most 2 per author) and adds it as a topic with an
analysis outline in its notes. The list itself is imported, not edited in the app.

Everything except the reminder log can be edited, archived or deleted later.

## Security model

- **Private sign-in.** Public sign-up is disabled in Supabase. The owner is
  invited, and the app additionally only sends codes to and accepts sessions
  from addresses in the server-side `OWNER_EMAILS` (fails closed if empty). The
  owner's address is never in source code.
- **Row Level Security** on every table: the owner can only read/write rows
  with their `user_id`. Child rows reference parents through composite
  `(id, user_id)` foreign keys, so nothing can be attached to another user's data.
- **Protected columns.** Step state and the activity log can only change
  through `complete_topic_step` / `reopen_topic_step` / `start_study_session`,
  which enforce the Learn → Practice → Review order and keep the streak honest.
- **Private storage.** Bucket `study-files` is private; objects must live under
  `<user_id>/…`, and downloads use 60-second signed URLs.
- **Secrets.** Only `NEXT_PUBLIC_SUPABASE_URL` and the publishable key reach the
  browser. The secret key is used only by the cron job (`server-only` modules).
- Anonymous visitors have no table privileges at all.

The multi-user boundary is already in the schema: a second user would get
fully isolated data without schema changes.

## How pace and status are calculated

Shown in the app under *Jak se tempo počítá* and editable in Settings:

- Target: all three steps done **14 days** (configurable) before the first day
  of the exam date/window.
- Even plan: from the preparation start (configurable; default = when the
  track's first topic was added) to the target, steps are spread evenly.
- **V plánu** (on track): less than one step behind the even plan.
  **Hrozí skluz** (at risk): at most one week of plan behind.
  **Ve skluzu** (behind): more than a week behind, or the target has passed.
- Needed pace: remaining steps ÷ remaining study days (study days per week is
  configurable, default 7). Shown per study day and per week, rounded up.
- A provisional date or a window makes the result an **odhad** (estimate).
- Without topics or an exam date, the app says what is missing instead of
  showing a status.

Streak: one day per Europe/Prague calendar day with an explicit *Začít
studovat* or a completed step. Opening the app never counts; undoing a step
completed by mistake today removes that day's credit.

## Local development

Requires Node 22+ and Docker.

```bash
npm install
npx supabase start          # local Supabase (ports 55321–55327, see supabase/config.toml)
npx supabase status -o env  # local URL and keys for .env.local
cp .env.example .env.local  # fill in local values; set OWNER_EMAILS to a test address
npm run dev
```

Local sign-up is disabled too, so create the local owner once:

```bash
curl -X POST http://127.0.0.1:55321/auth/v1/admin/users \
  -H "apikey: $SECRET_KEY" -H "Authorization: Bearer $SECRET_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.test","email_confirm":true}'
```

Login codes arrive in the local Mailpit inbox at http://127.0.0.1:55324.

Checks:

```bash
npm test            # domain logic (Vitest)
npm run test:db     # database security tests (pgTAP, needs local Supabase)
npm run typecheck
npm run lint
npm run build
```

## Production setup (not done yet — needs your accounts)

### 1. Supabase

1. Create a project (an EU region such as Frankfurt is closest to Prague).
2. Apply the schema: `npx supabase link --project-ref <ref>` then
   `npx supabase db push`. This creates the tables, policies, functions and the
   private `study-files` bucket. It inserts **no** study content.
3. Authentication → Sign In / Providers:
   - turn **off** "Allow new users to sign up";
   - keep the **Email** provider **on** (it is what sends the login code);
   - email OTP expiry: 900 seconds.
4. Authentication → URL Configuration: Site URL = your Vercel URL; add
   `https://<your-domain>/auth/confirm` to Redirect URLs.
5. Authentication → Email Templates: paste `supabase/templates/magic_link.html`
   into **Magic Link** and `supabase/templates/invite.html` into **Invite user**
   (subjects: "Přihlašovací kód do StudyDrive", "Pozvánka do StudyDrive").
   The code (`{{ .Token }}`) is what makes login work inside the installed
   iPhone app.
6. Recommended: Authentication → SMTP → custom SMTP (e.g. Resend's SMTP). The
   built-in sender is heavily rate-limited.
7. Authentication → Users → **Invite user** with the owner's email.

### 2. Vercel

Import the GitHub repository and set these environment variables (names only
— see `.env.example`):

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server (publishable key, not the secret key) |
| `OWNER_EMAILS` | server — the owner's email |
| `SUPABASE_SECRET_KEY` | server only — reminder cron job |
| `RESEND_API_KEY`, `REMINDER_FROM_EMAIL` | server only — reminder emails |
| `CRON_SECRET` | server only — protects `/api/cron/reminders` |
| `APP_URL` | optional — link in emails |

`vercel.json` schedules the reminder job once a day at 17:00 UTC (18:00 CET /
19:00 CEST), which works on the Hobby plan.

### 3. Email reminders (Resend)

Verify a sending domain in Resend, create an API key, and set
`REMINDER_FROM_EMAIL` to an address on that domain. Until all reminder
variables are set, the job answers `503 not_configured` and sends nothing;
Settings → *Stav připojení* shows what is missing.

Reminder rules: at most one combined email per day; a study reminder only on
chosen weekdays when nothing was recorded that day; exam and administrative
reminders at the chosen lead days (default 7 and 1); each event is sent once
(moving a date re-arms it).

## Install on iPhone

Open the deployed site in Safari → Share → *Přidat na plochu*. It opens as a
standalone app. Sign in with the 6-digit code from the email (links open in
Safari, outside the installed app).

## Design

Apple-HIG-inspired, adapted for the web from the MIT-licensed
[`ebuntario/apple-hig`](https://github.com/ebuntario/apple-hig) Claude skill
(used as guidance only; nothing from it is installed or executed): system font
stack, text-style scale, semantic light/dark color tokens with one accent,
sidebar on the Mac and a tab bar on the iPhone, inset grouped lists, sheets for
editing, empty states that explain what to add, 44 pt touch targets, safe
areas, and reduced motion/transparency. Progress uses determinate rings, not
Apple Fitness activity rings, which the HIG reserves for Fitness. Icons are
custom line icons; SF Symbols are licensed for Apple platforms only.

## Phase two: adding the maturita content

Phase one deliberately imported nothing. When the owner sends the maturita
files to Claude Code in a new task:

1. Claude Code reads the files and produces a review list of subjects, exam
   tracks, topics, dates and attachments, flagging anything unreadable,
   ambiguous, duplicated or missing.
2. The owner reviews and corrects the list.
3. Only after confirmation is the content written (via the app or a reviewed
   migration/seed run against the owner's project), and original files are
   uploaded to *Soubory* where requested.
