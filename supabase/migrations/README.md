# Supabase migrations

The production schema from Phase 8/8.1 must be translated into versioned SQL migrations here.

Important invariants:

- `study_events` is append-only.
- Event foreign keys must not cascade-delete the event log.
- Client cannot mutate projections.
- RLS is mandatory on user-owned tables.
- Projection tables are rebuildable from events.
- All production schema changes go through Git migrations.
