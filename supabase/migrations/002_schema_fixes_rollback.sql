-- ═══════════════════════════════════════════════════════════════════════════
-- THE MIRROR v3 — ROLLBACK FOR SCHEMA FIXES
-- Reverts changes from 002_schema_fixes.sql
-- MachineMind Consulting | Phil McGill
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ROLLBACK #8: Remove Documentation ───────────────────────────────────

COMMENT ON VIEW mirror_user_intelligence IS NULL;
COMMENT ON COLUMN mirror_cognitive_map.intellectualizer_score IS NULL;
COMMENT ON COLUMN mirror_cognitive_map.depth_tolerance_score IS NULL;
COMMENT ON COLUMN mirror_sessions.crisis_detected IS NULL;
COMMENT ON COLUMN mirror_sessions.offering_frame IS NULL;
COMMENT ON TABLE mirror_emergence_log IS NULL;
COMMENT ON TABLE mirror_cognitive_map IS NULL;
COMMENT ON TABLE mirror_calibration IS NULL;
COMMENT ON TABLE mirror_patterns IS NULL;
COMMENT ON TABLE mirror_entries IS NULL;
COMMENT ON TABLE mirror_sessions IS NULL;
COMMENT ON TABLE mirror_profiles IS NULL;


-- ─── ROLLBACK #7: Restore Simple RLS Policies ────────────────────────────

-- Drop granular policies
DROP POLICY IF EXISTS profiles_select ON mirror_profiles;
DROP POLICY IF EXISTS profiles_update ON mirror_profiles;
DROP POLICY IF EXISTS profiles_insert ON mirror_profiles;

DROP POLICY IF EXISTS sessions_select ON mirror_sessions;
DROP POLICY IF EXISTS sessions_insert ON mirror_sessions;
DROP POLICY IF EXISTS sessions_update ON mirror_sessions;
DROP POLICY IF EXISTS sessions_delete ON mirror_sessions;

DROP POLICY IF EXISTS entries_select ON mirror_entries;
DROP POLICY IF EXISTS entries_insert ON mirror_entries;
DROP POLICY IF EXISTS entries_update ON mirror_entries;
DROP POLICY IF EXISTS entries_delete ON mirror_entries;

DROP POLICY IF EXISTS patterns_select ON mirror_patterns;
DROP POLICY IF EXISTS patterns_insert ON mirror_patterns;
DROP POLICY IF EXISTS patterns_update ON mirror_patterns;
DROP POLICY IF EXISTS patterns_delete ON mirror_patterns;

DROP POLICY IF EXISTS calibration_select ON mirror_calibration;
DROP POLICY IF EXISTS calibration_insert ON mirror_calibration;
DROP POLICY IF EXISTS calibration_update ON mirror_calibration;

DROP POLICY IF EXISTS cognitive_map_select ON mirror_cognitive_map;
DROP POLICY IF EXISTS cognitive_map_insert ON mirror_cognitive_map;
DROP POLICY IF EXISTS cognitive_map_update ON mirror_cognitive_map;

DROP POLICY IF EXISTS emergence_select ON mirror_emergence_log;
DROP POLICY IF EXISTS emergence_insert ON mirror_emergence_log;
DROP POLICY IF EXISTS emergence_update ON mirror_emergence_log;
DROP POLICY IF EXISTS emergence_delete ON mirror_emergence_log;

-- Restore original "FOR ALL" policies
CREATE POLICY profiles_own ON mirror_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY sessions_own ON mirror_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY entries_own ON mirror_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY patterns_own ON mirror_patterns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY calibration_own ON mirror_calibration
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY cognitive_map_own ON mirror_cognitive_map
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY emergence_own ON mirror_emergence_log
  FOR ALL USING (auth.uid() = user_id);


-- ─── ROLLBACK #6: Remove Array Constraints ───────────────────────────────

ALTER TABLE mirror_cognitive_map
  DROP CONSTRAINT IF EXISTS check_closing_triggers_limit;

ALTER TABLE mirror_cognitive_map
  DROP CONSTRAINT IF EXISTS check_opening_topics_limit;

ALTER TABLE mirror_calibration
  DROP CONSTRAINT IF EXISTS check_ineffective_categories_limit;

ALTER TABLE mirror_calibration
  DROP CONSTRAINT IF EXISTS check_effective_categories_limit;

ALTER TABLE mirror_sessions
  DROP CONSTRAINT IF EXISTS check_secondary_blind_spots_limit;

ALTER TABLE mirror_patterns
  DROP CONSTRAINT IF EXISTS check_evidence_limit;


-- ─── ROLLBACK #5: Remove NOT NULL on language ────────────────────────────

ALTER TABLE mirror_profiles
  ALTER COLUMN language DROP NOT NULL;


-- ─── ROLLBACK #4: Remove Added Indexes ───────────────────────────────────

DROP INDEX IF EXISTS idx_patterns_confirmed;
DROP INDEX IF EXISTS idx_patterns_active;
DROP INDEX IF EXISTS idx_sessions_crisis;
DROP INDEX IF EXISTS idx_sessions_active;
DROP INDEX IF EXISTS idx_patterns_user_name;
DROP INDEX IF EXISTS idx_patterns_evolving;
DROP INDEX IF EXISTS idx_patterns_surfaced_session;
DROP INDEX IF EXISTS idx_emergence_entry;


-- ─── ROLLBACK #3: Restore Original Trigger Functions ─────────────────────

-- Remove SECURITY DEFINER and depth-aware comparison
CREATE OR REPLACE FUNCTION update_profile_after_session()
RETURNS TRIGGER AS $$
DECLARE
  streak_val INTEGER;
  last_session TIMESTAMPTZ;
BEGIN
  -- Get the user's last descent before this one
  SELECT last_descent_at INTO last_session
  FROM mirror_profiles WHERE id = NEW.user_id;

  -- Calculate streak
  IF last_session IS NULL OR
     (now() - last_session) > INTERVAL '48 hours' THEN
    streak_val := 1;
  ELSE
    SELECT current_streak + 1 INTO streak_val
    FROM mirror_profiles WHERE id = NEW.user_id;
  END IF;

  UPDATE mirror_profiles SET
    total_descents = total_descents + 1,
    deepest_level = CASE
      WHEN NEW.deepest_level::text > deepest_level::text THEN NEW.deepest_level
      ELSE deepest_level
    END,
    current_streak = streak_val,
    longest_streak = GREATEST(longest_streak, streak_val),
    last_descent_at = now(),
    updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_calibration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approach_used IS NOT NULL AND NEW.approach_effectiveness IS NOT NULL THEN
    INSERT INTO mirror_calibration (user_id, approach, times_used, avg_depth_reached, avg_authenticity)
    VALUES (
      NEW.user_id,
      NEW.approach_used,
      1,
      CASE NEW.deepest_level
        WHEN 'surface' THEN 1
        WHEN 'pattern' THEN 2
        WHEN 'origin' THEN 3
        WHEN 'core' THEN 4
      END,
      NEW.approach_effectiveness
    )
    ON CONFLICT (user_id, approach) DO UPDATE SET
      times_used = mirror_calibration.times_used + 1,
      avg_depth_reached = (
        (mirror_calibration.avg_depth_reached * mirror_calibration.times_used) +
        CASE NEW.deepest_level
          WHEN 'surface' THEN 1
          WHEN 'pattern' THEN 2
          WHEN 'origin' THEN 3
          WHEN 'core' THEN 4
        END
      ) / (mirror_calibration.times_used + 1),
      avg_authenticity = (
        (mirror_calibration.avg_authenticity * mirror_calibration.times_used) +
        NEW.approach_effectiveness
      ) / (mirror_calibration.times_used + 1),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── ROLLBACK #2: Remove moddatetime Triggers ─────────────────────────────

DROP TRIGGER IF EXISTS handle_updated_at_cognitive_map ON mirror_cognitive_map;
DROP TRIGGER IF EXISTS handle_updated_at_calibration ON mirror_calibration;
DROP TRIGGER IF EXISTS handle_updated_at_patterns ON mirror_patterns;
DROP TRIGGER IF EXISTS handle_updated_at_profiles ON mirror_profiles;


-- ─── ROLLBACK #1: Remove Enum Values ─────────────────────────────────────
-- NOTE: PostgreSQL does not support removing enum values once added
-- This is a limitation of PostgreSQL itself
-- If you need to rollback enum changes, you must:
--   1. Drop all tables using the enum
--   2. Drop the enum type
--   3. Recreate the enum with original values
--   4. Recreate all tables
-- This is destructive and should only be done in development

-- For production rollback, leave new enum values in place (they're harmless)
-- and update TypeScript types to match the original enum definitions


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK COMPLETE
--
-- WARNING: Enum value additions cannot be rolled back without data loss
-- All other changes have been reverted
--
-- Run: psql -f 002_schema_fixes_rollback.sql
-- ═══════════════════════════════════════════════════════════════════════════
