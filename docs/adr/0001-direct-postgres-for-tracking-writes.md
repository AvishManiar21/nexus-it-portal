# ADR 0001: Write tracking events directly to Postgres

- **Status:** Accepted, implemented
- **Date:** 2026-04-27 (problem found) · 2026-04 (decision implemented)
- **Area:** Visitor tracking (`visitor_page_views`, `video_engagement_events`)

## Context

The portal records anonymous visitor behavior (solution page views, demo video starts and completions), then links it to a lead when the visitor submits a form. The rest of the backend talks to Supabase through its REST layer (PostgREST) with the service-role key.

For the two tracking tables, inserts through PostgREST **reported success but never persisted**:

- The backend logged `Inserted successfully` with returned rows and ids.
- `SELECT * FROM video_engagement_events` in Postgres returned **0 rows**.

Things that did **not** fix it: reloading the PostgREST schema cache (dashboard and `NOTIFY pgrst, 'reload schema'`), dropping and recreating the tables, changing Row Level Security, restarting the backend, verifying credentials, and testing with many session ids.

Because success was reported, the failure was silent: the analytics dashboard simply showed no engagement data.

## Decision

Write tracking events **directly to Postgres with `asyncpg`** (`app/db_pg.py`), bypassing PostgREST for these tables, while keeping the Supabase client for everything else.

- One lazily-created connection pool (`min_size=1`, `max_size=10`, TLS required), closed on application shutdown.
- `statement_cache_size=0`, required by Supabase's connection pooler (PgBouncer in transaction mode does not support prepared statements).
- Analytics reads the same tables through the same pool, so writes and reads see one source of truth.

## Consequences

- ✅ Events persist reliably. Verified in production data: page views and video engagement events are recorded and linked to leads, and the admin dashboard and AI lead insights are built on them.
- ✅ Inserts return the real database id (`RETURNING id`), so a "success" means the row exists.
- ➖ Two data-access paths (Supabase client and asyncpg). The asyncpg path is limited to tracking and analytics, and documented here.
- ➖ The asyncpg connection uses the table-owner role, which bypasses Row Level Security. This is intended: these endpoints validate input and are rate-limited (`app/rate_limit.py`).

## Lessons

- Treat "success" responses from an abstraction layer as claims to verify. Checking the database directly is what exposed the problem.
- When a managed layer misbehaves and the fix is outside your control, route around it narrowly and record why, instead of rewriting the whole data layer.
