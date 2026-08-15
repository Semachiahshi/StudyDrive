# Database P0 tests

Planned CI tests:

1. Study event UPDATE fails.
2. Study event DELETE fails.
3. User deletion preserves anonymized events.
4. Projection INSERT/UPDATE/DELETE fails for normal client role.
5. Duplicate idempotency key does not create a second event.
6. RLS prevents cross-user access.
7. Replay reconstructs projections deterministically.
