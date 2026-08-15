# StudyDrive — Phase 10 MVP + UI

This build is intentionally runnable locally **without Supabase credentials**.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Verification

```bash
npm run test
npm run lint
npm run build
```

## Included

- Apple-style StudyDrive dashboard
- Project overview
- Today's deterministic study plan
- Interactive study session
- Mastery / ERS / deadline-risk presentation
- Local demo state so the UI can be tested immediately
- Deterministic engine modules
- IndexedDB event queue skeleton
- Supabase client/server/admin boundaries
- Phase 10 database migration blueprint
- Event immutability, idempotency and RLS migration structure

## Important

The UI demo is deliberately decoupled from Supabase so it can be tested immediately. Real authentication, database persistence, AI processing and production event ingestion require Supabase credentials and the remaining server integration work.

Do not put `SUPABASE_SERVICE_ROLE_KEY` in client-side code.