-- Migration: enable Row Level Security on every table in the public schema
--
-- Why: with RLS disabled, anyone holding the project's anon (publishable) key
-- can read and write these tables directly through the Supabase REST API,
-- including admin_users.password_hash and every lead's contact details.
--
-- Why this is safe for the app: no policies are added, so the anon and
-- authenticated roles are denied everything. The FastAPI backend is
-- unaffected because it uses the service_role key (which bypasses RLS) and
-- the table-owner `postgres` role for asyncpg (owners bypass RLS unless
-- FORCE ROW LEVEL SECURITY is set, which this does not do).
--
-- Idempotent: safe to run more than once. Run it in the Supabase SQL Editor.

DO $$
DECLARE
    t record;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- Verify: every row should show rowsecurity = true
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
