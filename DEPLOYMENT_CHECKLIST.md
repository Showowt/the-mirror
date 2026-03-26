# THE MIRROR — DATABASE FIXES DEPLOYMENT CHECKLIST

## PRE-DEPLOYMENT

- [ ] **Backup database**
  ```bash
  # Via Supabase CLI
  supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

  # Or via dashboard: Settings > Database > Backups
  ```

- [ ] **Review migration file**
  - [ ] Open `supabase/migrations/002_schema_fixes.sql`
  - [ ] Verify all changes align with audit report
  - [ ] Confirm no data-destructive operations

- [ ] **Test locally first**
  ```bash
  # Reset local DB and apply both migrations
  cd /Users/showowt/machinemind-builds/the-mirror
  supabase db reset
  supabase migration up
  ```

- [ ] **Verify TypeScript types**
  ```bash
  ./scripts/generate-types.sh
  npm run build
  ```

---

## DEPLOYMENT (Production)

### Option A: Supabase Dashboard (Recommended)
1. [ ] Navigate to Supabase dashboard
2. [ ] Go to **Database** → **Migrations**
3. [ ] Click **Upload Migration**
4. [ ] Select `supabase/migrations/002_schema_fixes.sql`
5. [ ] Click **Run Migration**
6. [ ] Wait for success confirmation (30-60 seconds)

### Option B: Supabase CLI
```bash
supabase db push
```

---

## POST-DEPLOYMENT VERIFICATION

### 1. Check Migration Status
```sql
-- Run in SQL Editor (Supabase dashboard)
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 5;
```
- [ ] Confirm `002_schema_fixes` shows success

### 2. Verify Triggers
```sql
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```
- [ ] Confirm 6 triggers exist (2 old + 4 new moddatetime)

### 3. Verify Indexes
```sql
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
- [ ] Confirm ~23 indexes (was 13, added 10)

### 4. Verify RLS Policies
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
- [ ] Confirm ~28 policies (was 7, now 4 per table × 7 tables)

### 5. Test Enum Values
```sql
-- Test new response_behavior values
INSERT INTO mirror_entries (
  session_id,
  user_id,
  entry_type,
  descent_level,
  sequence_num,
  content,
  response_behavior
) VALUES (
  gen_random_uuid(),
  auth.uid(),
  'response',
  'surface',
  1,
  'Test entry',
  'minimization'
);
-- Should succeed (new enum value)

-- Clean up
DELETE FROM mirror_entries WHERE content = 'Test entry';
```
- [ ] New enum values work

### 6. Test Application Flows
- [ ] **Create new user** (verify profile created with language NOT NULL)
- [ ] **Complete a session** (verify trigger updates profile stats)
- [ ] **Create a pattern** (verify unique constraint prevents duplicates)
- [ ] **Update profile** (verify updated_at auto-updates)

---

## MONITORING (First 24 Hours)

### Check Supabase Logs
- [ ] Go to **Logs** → **Database**
- [ ] Filter for errors in last 1 hour
- [ ] Look for:
  - Trigger execution errors
  - Constraint violations
  - RLS policy blocks

### Performance Check
```sql
-- Check slow queries
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000 -- queries >1s
ORDER BY mean_exec_time DESC
LIMIT 10;
```
- [ ] Verify no new slow queries introduced

### Index Usage
```sql
-- Check if new indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```
- [ ] Confirm new indexes show usage (idx_scan > 0)

---

## ROLLBACK PROCEDURE (If Needed)

**Only if critical errors occur**

### Via Dashboard
1. [ ] Upload `002_schema_fixes_rollback.sql`
2. [ ] Run migration
3. [ ] Verify services recover

### Via CLI
```bash
psql -f supabase/migrations/002_schema_fixes_rollback.sql
```

**Note**: Enum values CANNOT be rolled back (PostgreSQL limitation)

---

## FINAL STEPS

- [ ] **Update TypeScript types in production**
  ```bash
  ./scripts/generate-types.sh
  git add src/lib/supabase/database.types.generated.ts
  git commit -m "chore: Update DB types after schema fixes"
  git push
  ```

- [ ] **Deploy Next.js app** (if types changed)
  ```bash
  # Vercel auto-deploys from main branch
  # Or trigger manual deploy in Vercel dashboard
  ```

- [ ] **Document in changelog**
  - Migration date/time
  - Issues fixed
  - Performance improvements observed

- [ ] **Archive audit report**
  - Save `DATABASE_AUDIT_REPORT.md` to project docs
  - Share with team if applicable

---

## SUCCESS CRITERIA

✅ All checks passed if:
1. No errors in Supabase logs
2. All 6 triggers active
3. All 23+ indexes created
4. ~28 RLS policies active
5. Application flows work (auth, sessions, patterns)
6. TypeScript compiles without errors
7. Performance same or better (check query times)

---

## SUPPORT

If issues occur:

1. **Check Supabase logs first** (Database → Logs)
2. **Review audit report** (`DATABASE_AUDIT_REPORT.md`)
3. **Rollback if critical** (use `002_schema_fixes_rollback.sql`)
4. **Contact**: MachineMind Genesis Engine

---

**Deployment Estimated Time**: 10-15 minutes
**Risk Level**: LOW (additive changes only, no data loss)
**Recommended Window**: Off-peak hours (optional, no downtime expected)

---

**Last Updated**: 2026-03-26
**Migration Version**: 002_schema_fixes
