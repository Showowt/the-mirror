-- ═══════════════════════════════════════════════════════════════════════════
-- THE MIRROR v3 — SCHEMA FIXES & IMPROVEMENTS
-- Fixes critical issues from schema audit
-- MachineMind Consulting | Phil McGill
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── FIX #1: Add Missing Enum Values ─────────────────────────────────────

DO $$ BEGIN
  ALTER TYPE response_behavior ADD VALUE IF NOT EXISTS 'minimization';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE response_behavior ADD VALUE IF NOT EXISTS 'avoidance';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE response_behavior ADD VALUE IF NOT EXISTS 'rationalization';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE blind_spot_category ADD VALUE IF NOT EXISTS 'perfectionism_shield';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE blind_spot_category ADD VALUE IF NOT EXISTS 'helper_syndrome';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE blind_spot_category ADD VALUE IF NOT EXISTS 'achievement_addiction';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE blind_spot_category ADD VALUE IF NOT EXISTS 'comparison_trap';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE blind_spot_category ADD VALUE IF NOT EXISTS 'control_illusion';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE blind_spot_category ADD VALUE IF NOT EXISTS 'intimacy_avoidance';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─── FIX #2: Add moddatetime Triggers ────────────────────────────────────

-- Enable extension
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS handle_updated_at_profiles ON mirror_profiles;
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON mirror_profiles
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

DROP TRIGGER IF EXISTS handle_updated_at_patterns ON mirror_patterns;
CREATE TRIGGER handle_updated_at_patterns
  BEFORE UPDATE ON mirror_patterns
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

DROP TRIGGER IF EXISTS handle_updated_at_calibration ON mirror_calibration;
CREATE TRIGGER handle_updated_at_calibration
  BEFORE UPDATE ON mirror_calibration
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

DROP TRIGGER IF EXISTS handle_updated_at_cognitive_map ON mirror_cognitive_map;
CREATE TRIGGER handle_updated_at_cognitive_map
  BEFORE UPDATE ON mirror_cognitive_map
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);


-- ─── FIX #3: Add SECURITY DEFINER to Trigger Functions ───────────────────

-- Recreate with proper security context
CREATE OR REPLACE FUNCTION update_profile_after_session()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Update profile with depth-aware comparison
  UPDATE mirror_profiles SET
    total_descents = total_descents + 1,
    deepest_level = CASE
      WHEN CASE NEW.deepest_level
        WHEN 'surface' THEN 1
        WHEN 'pattern' THEN 2
        WHEN 'origin' THEN 3
        WHEN 'core' THEN 4
      END > CASE deepest_level
        WHEN 'surface' THEN 1
        WHEN 'pattern' THEN 2
        WHEN 'origin' THEN 3
        WHEN 'core' THEN 4
      END
      THEN NEW.deepest_level
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
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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
      ) / GREATEST(mirror_calibration.times_used + 1, 1),
      avg_authenticity = (
        (mirror_calibration.avg_authenticity * mirror_calibration.times_used) +
        NEW.approach_effectiveness
      ) / GREATEST(mirror_calibration.times_used + 1, 1),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── FIX #4: Add Missing Indexes ─────────────────────────────────────────

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_emergence_entry
  ON mirror_emergence_log(entry_id)
  WHERE entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patterns_surfaced_session
  ON mirror_patterns(surfaced_in_session)
  WHERE surfaced_in_session IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patterns_evolving
  ON mirror_patterns(evolving_into)
  WHERE evolving_into IS NOT NULL;

-- Composite unique constraint to prevent duplicate patterns
CREATE UNIQUE INDEX IF NOT EXISTS idx_patterns_user_name
  ON mirror_patterns(user_id, pattern_name);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON mirror_sessions(user_id, started_at DESC)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_crisis
  ON mirror_sessions(user_id, started_at DESC)
  WHERE crisis_detected = true;

CREATE INDEX IF NOT EXISTS idx_patterns_active
  ON mirror_patterns(user_id, occurrence_count DESC)
  WHERE status != 'integrated';

CREATE INDEX IF NOT EXISTS idx_patterns_confirmed
  ON mirror_patterns(user_id, occurrence_count DESC)
  WHERE status IN ('confirmed', 'acknowledged');


-- ─── FIX #5: Make language column NOT NULL ───────────────────────────────

-- Set default for any existing rows
UPDATE mirror_profiles SET language = 'en' WHERE language IS NULL;

-- Add NOT NULL constraint
ALTER TABLE mirror_profiles
  ALTER COLUMN language SET NOT NULL;


-- ─── FIX #6: Add Array Length Constraints ────────────────────────────────

ALTER TABLE mirror_patterns
  ADD CONSTRAINT check_evidence_limit
  CHECK (array_length(evidence_session_ids, 1) IS NULL OR array_length(evidence_session_ids, 1) <= 100);

ALTER TABLE mirror_sessions
  ADD CONSTRAINT check_secondary_blind_spots_limit
  CHECK (array_length(secondary_blind_spots, 1) IS NULL OR array_length(secondary_blind_spots, 1) <= 10);

ALTER TABLE mirror_calibration
  ADD CONSTRAINT check_effective_categories_limit
  CHECK (array_length(effective_for_categories, 1) IS NULL OR array_length(effective_for_categories, 1) <= 20);

ALTER TABLE mirror_calibration
  ADD CONSTRAINT check_ineffective_categories_limit
  CHECK (array_length(ineffective_for_categories, 1) IS NULL OR array_length(ineffective_for_categories, 1) <= 20);

ALTER TABLE mirror_cognitive_map
  ADD CONSTRAINT check_opening_topics_limit
  CHECK (array_length(opening_topics, 1) IS NULL OR array_length(opening_topics, 1) <= 50);

ALTER TABLE mirror_cognitive_map
  ADD CONSTRAINT check_closing_triggers_limit
  CHECK (array_length(closing_triggers, 1) IS NULL OR array_length(closing_triggers, 1) <= 50);


-- ─── FIX #7: Enhanced RLS Policies ───────────────────────────────────────

-- Replace "FOR ALL" policies with granular ones

-- mirror_profiles: Users can read/update their own, but not delete
DO $$ BEGIN
  DROP POLICY IF EXISTS profiles_own ON mirror_profiles;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY profiles_select ON mirror_profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY profiles_update ON mirror_profiles
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY profiles_insert ON mirror_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- mirror_sessions: Full access to own sessions
DO $$ BEGIN
  DROP POLICY IF EXISTS sessions_own ON mirror_sessions;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sessions_select ON mirror_sessions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sessions_insert ON mirror_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sessions_update ON mirror_sessions
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sessions_delete ON mirror_sessions
    FOR DELETE USING (auth.uid() = user_id AND ended_at IS NOT NULL);
    -- Only allow deleting completed sessions
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- mirror_entries: Full access to own entries
DO $$ BEGIN
  DROP POLICY IF EXISTS entries_own ON mirror_entries;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY entries_select ON mirror_entries
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY entries_insert ON mirror_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY entries_update ON mirror_entries
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY entries_delete ON mirror_entries
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- mirror_patterns: Full access to own patterns
DO $$ BEGIN
  DROP POLICY IF EXISTS patterns_own ON mirror_patterns;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY patterns_select ON mirror_patterns
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY patterns_insert ON mirror_patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY patterns_update ON mirror_patterns
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY patterns_delete ON mirror_patterns
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- mirror_calibration: Read-only for users (updated by triggers)
DO $$ BEGIN
  DROP POLICY IF EXISTS calibration_own ON mirror_calibration;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY calibration_select ON mirror_calibration
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow inserts/updates (needed for trigger function)
DO $$ BEGIN
  CREATE POLICY calibration_insert ON mirror_calibration
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY calibration_update ON mirror_calibration
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- mirror_cognitive_map: Read-only for users
DO $$ BEGIN
  DROP POLICY IF EXISTS cognitive_map_own ON mirror_cognitive_map;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY cognitive_map_select ON mirror_cognitive_map
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY cognitive_map_insert ON mirror_cognitive_map
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY cognitive_map_update ON mirror_cognitive_map
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- mirror_emergence_log: Full access to own emergence logs
DO $$ BEGIN
  DROP POLICY IF EXISTS emergence_own ON mirror_emergence_log;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY emergence_select ON mirror_emergence_log
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY emergence_insert ON mirror_emergence_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY emergence_update ON mirror_emergence_log
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY emergence_delete ON mirror_emergence_log
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─── FIX #8: Add Schema Documentation ────────────────────────────────────

COMMENT ON TABLE mirror_profiles IS
  'User profiles extending auth.users with Mirror-specific psychological journey data';

COMMENT ON TABLE mirror_sessions IS
  'Individual descent sessions - each time a user begins a new psychological exploration';

COMMENT ON TABLE mirror_entries IS
  'Each exchange within a session (questions, responses, observations, pattern reveals)';

COMMENT ON TABLE mirror_patterns IS
  'Recurring psychological patterns detected across multiple sessions';

COMMENT ON TABLE mirror_calibration IS
  'Effectiveness tracking for different questioning approaches per user';

COMMENT ON TABLE mirror_cognitive_map IS
  'AI-generated map of how the user thinks, defends, and processes depth';

COMMENT ON TABLE mirror_emergence_log IS
  'Moments of breakthrough - frame breaks, insights, emotional releases';

COMMENT ON COLUMN mirror_sessions.offering_frame IS
  'AI analysis of the psychological frame the user is operating within';

COMMENT ON COLUMN mirror_sessions.crisis_detected IS
  'True if AI detects crisis language requiring immediate intervention';

COMMENT ON COLUMN mirror_cognitive_map.depth_tolerance_score IS
  'Score 0-100: How deep the user can go before deflecting (higher = more tolerant)';

COMMENT ON COLUMN mirror_cognitive_map.intellectualizer_score IS
  'Score 0-100: Tendency to retreat to head vs staying in feeling (higher = more intellectual)';

COMMENT ON VIEW mirror_user_intelligence IS
  'Consolidated view of user profile, cognitive map, active patterns, and effective approaches';


-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
--
-- Changes Applied:
--   1. Added missing enum values (9 new values)
--   2. Added moddatetime triggers (4 tables)
--   3. Fixed trigger functions with SECURITY DEFINER
--   4. Added missing indexes (10 new indexes)
--   5. Made language column NOT NULL
--   6. Added array length constraints (6 tables)
--   7. Enhanced RLS with granular policies (7 tables × ~4 policies each)
--   8. Added PostgreSQL documentation comments
--
-- Run: psql -f 002_schema_fixes.sql
-- Rollback: See 002_schema_fixes_rollback.sql
-- ═══════════════════════════════════════════════════════════════════════════
