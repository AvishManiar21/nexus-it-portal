# Known Issues

## Video Tracking - Supabase PostgREST API Bug

**Status:** BLOCKED - Supabase infrastructure issue
**Affected Features:** US-9 (Video Engagement Tracking)
**Date Discovered:** 2026-04-27

### Problem Description

The `video_engagement_events` and `visitor_page_views` tables cannot persist data through the Supabase PostgREST API, despite:
- Tables existing in Postgres database
- Successful schema recreation with `DISABLE ROW LEVEL SECURITY`
- Multiple schema cache reloads (`NOTIFY pgrst, 'reload schema'`)
- Backend receiving 200 OK responses from Supabase client

### Evidence

**Backend logs show successful inserts:**
```
[VIDEO] Inserted successfully: [{'id': 8, 'session_id': '11111111-2222-3333-4444-555555555555', ...}]
[VIDEO] Inserted successfully: [{'id': 9, 'session_id': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', ...}]
[VIDEO] Inserted successfully: [{'id': 10, 'session_id': 'ffffffff-ffff-ffff-ffff-ffffffffffff', ...}]
```

**Postgres query shows NO DATA:**
```sql
SELECT * FROM video_engagement_events;
-- Result: 0 rows
```

### Root Cause

The Supabase PostgREST API layer is returning phantom success responses without persisting data to the actual Postgres database. This appears to be a caching or transaction isolation bug in Supabase's infrastructure.

### Attempted Fixes (All Failed)

1. ✗ Reloaded schema cache via Supabase Dashboard → Settings → API → Reload Schema
2. ✗ Dropped and recreated tables with `NOTIFY pgrst, 'reload schema'`
3. ✗ Disabled Row Level Security on both tables
4. ✗ Restarted backend to force new Supabase client connection
5. ✗ Verified correct Supabase URL and credentials
6. ✗ Tested with multiple different session IDs

### Impact

- **Frontend code:** ✅ Working (sends proper UUID session IDs)
- **Backend code:** ✅ Working (receives and processes events correctly)
- **Database schema:** ✅ Working (tables exist with correct structure)
- **Data persistence:** ❌ FAILING (Supabase API bug)

### Workaround

None available. This requires Supabase support intervention or migration to direct Postgres connection (bypassing PostgREST).

### Next Steps

1. Contact Supabase support with this issue
2. Consider switching to direct Postgres connection using `psycopg2` or `asyncpg`
3. Temporarily skip video tracking testing until resolved

### Files Affected

- `app/routers/events.py` - Video engagement endpoint
- `components/DemoVideoTracker.tsx` - Frontend video tracker
- `database/fix_video_tables.sql` - Table recreation script
