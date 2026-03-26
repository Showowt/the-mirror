-- ═══════════════════════════════════════════════════════════════════════════
-- THE MIRROR v3 — COMPLETE DATABASE SCHEMA
-- The first AI that knows its human.
-- MachineMind Consulting | Phil McGill
-- ═══════════════════════════════════════════════════════════════════════════
-- IDEMPOTENT: Safe to run multiple times (IF NOT EXISTS / DO blocks)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ENUMS ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE descent_level AS ENUM ('surface', 'pattern', 'origin', 'core');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE entry_type AS ENUM ('offering', 'question', 'response', 'observation', 'pattern_reveal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE response_behavior AS ENUM (
    'direct_engagement',   -- answered the actual question
    'deflection',          -- pivoted to something adjacent
    'intellectualization', -- went to head, avoided feeling
    'emotional_flood',     -- overwhelmed, lost structure
    'humor_shield',        -- used humor to avoid depth
    'silence',             -- couldn't or wouldn't answer
    'projection',          -- answered about someone else
    'deepening'            -- went deeper than the question asked
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pattern_status AS ENUM ('emerging', 'confirmed', 'acknowledged', 'integrated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE calibration_approach AS ENUM (
    'gut_punch',        -- direct, confrontational question
    'slow_reveal',      -- gradual observation building to insight
    'lateral',          -- sideways question that bypasses defenses
    'somatic',          -- body-level, feeling-based question
    'observational',    -- "I notice..." style reflection
    'paradoxical',      -- question containing productive contradiction
    'temporal'          -- past/future perspective shift
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE blind_spot_category AS ENUM (
    'role_identity',       -- locked into a role they can't see past
    'binary_trap',         -- seeing only two options when more exist
    'projection',          -- seeing in others what lives in self
    'temporal_fixation',   -- stuck in past or future, missing now
    'agency_blindness',    -- not seeing own power/choice
    'relational_pattern',  -- repeating dynamic across relationships
    'narrative_lock',      -- story about self that filters everything
    'somatic_disconnect',  -- disconnected from body/feeling
    'shadow_material',     -- disowned aspects driving behavior
    'systemic_invisibility' -- can't see the system they're inside
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─── PROFILES ───────────────────────────────────────────────────────────
-- Extends Supabase auth.users

CREATE TABLE IF NOT EXISTS mirror_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  language        TEXT DEFAULT 'en' CHECK (language IN ('en', 'es')),
  total_descents  INTEGER DEFAULT 0,
  deepest_level   descent_level DEFAULT 'surface',
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_descent_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_last_descent ON mirror_profiles(last_descent_at);


-- ─── SESSIONS (Each Descent) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mirror_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES mirror_profiles(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  deepest_level   descent_level DEFAULT 'surface',

  -- What they brought (raw + analyzed)
  initial_offering TEXT NOT NULL,
  offering_frame   JSONB,  -- AI's analysis of the frame they're inside

  -- Crisis detection
  crisis_detected  BOOLEAN DEFAULT false,

  -- Session quality metrics
  total_entries    INTEGER DEFAULT 0,
  deflection_count INTEGER DEFAULT 0,
  deepening_count  INTEGER DEFAULT 0,

  -- Post-session AI analysis
  session_summary  TEXT,
  primary_blind_spot blind_spot_category,
  secondary_blind_spots blind_spot_category[] DEFAULT '{}',

  -- What calibration approach was used
  approach_used    calibration_approach,
  approach_effectiveness INTEGER CHECK (approach_effectiveness BETWEEN 1 AND 10),

  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON mirror_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_time ON mirror_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_blind_spot ON mirror_sessions(primary_blind_spot);


-- ─── ENTRIES (Each exchange within a descent) ───────────────────────────

CREATE TABLE IF NOT EXISTS mirror_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES mirror_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES mirror_profiles(id) ON DELETE CASCADE,

  entry_type      entry_type NOT NULL,
  descent_level   descent_level NOT NULL,
  sequence_num    INTEGER NOT NULL,  -- order within session

  -- Content
  content         TEXT NOT NULL,      -- the actual text (question or response)

  -- AI analysis of responses (only for response type entries)
  response_behavior response_behavior,
  emotional_charge  INTEGER CHECK (emotional_charge BETWEEN 1 AND 10),
  authenticity_score INTEGER CHECK (authenticity_score BETWEEN 1 AND 10),

  -- What the AI detected beneath the surface
  subtext          TEXT,              -- what they're actually saying
  frame_shift      BOOLEAN DEFAULT false,  -- did their frame change?

  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entries_session ON mirror_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_entries_user ON mirror_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_behavior ON mirror_entries(response_behavior);


-- ─── PATTERNS (Recurring themes detected across sessions) ───────────────

CREATE TABLE IF NOT EXISTS mirror_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES mirror_profiles(id) ON DELETE CASCADE,

  -- Pattern identification
  pattern_name    TEXT NOT NULL,       -- short label: "The Rescuer", "Binary Thinking"
  pattern_description TEXT NOT NULL,   -- full description of the pattern
  blind_spot_category blind_spot_category,

  -- Evidence
  first_detected_at  TIMESTAMPTZ DEFAULT now(),
  last_seen_at       TIMESTAMPTZ DEFAULT now(),
  occurrence_count   INTEGER DEFAULT 1,
  evidence_session_ids UUID[] DEFAULT '{}',  -- sessions where this appeared

  -- Status tracking
  status           pattern_status DEFAULT 'emerging',

  -- Has the mirror surfaced this to the user?
  surfaced_at      TIMESTAMPTZ,
  surfaced_in_session UUID REFERENCES mirror_sessions(id),
  user_reaction    response_behavior,  -- how they responded when shown

  -- Pattern evolution
  evolving_into    UUID REFERENCES mirror_patterns(id),  -- if pattern morphs

  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patterns_user ON mirror_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_status ON mirror_patterns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_patterns_category ON mirror_patterns(blind_spot_category);


-- ─── CALIBRATION (What works for each specific human) ───────────────────

CREATE TABLE IF NOT EXISTS mirror_calibration (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES mirror_profiles(id) ON DELETE CASCADE,

  approach         calibration_approach NOT NULL,

  -- Effectiveness tracking
  times_used       INTEGER DEFAULT 0,
  avg_depth_reached FLOAT DEFAULT 0,   -- average descent level achieved
  avg_authenticity  FLOAT DEFAULT 0,   -- average authenticity score
  deflection_rate   FLOAT DEFAULT 0,   -- how often they deflect with this approach
  deepening_rate    FLOAT DEFAULT 0,   -- how often they go deeper

  -- Contextual effectiveness
  effective_for_categories blind_spot_category[] DEFAULT '{}',
  ineffective_for_categories blind_spot_category[] DEFAULT '{}',

  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, approach)
);

CREATE INDEX IF NOT EXISTS idx_calibration_user ON mirror_calibration(user_id);


-- ─── THE COGNITIVE MAP (Shape of how someone thinks) ────────────────────

CREATE TABLE IF NOT EXISTS mirror_cognitive_map (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES mirror_profiles(id) ON DELETE CASCADE,

  -- Cognitive tendencies (0-100 spectrum)
  intellectualizer_score   INTEGER DEFAULT 50, -- head vs heart
  externalizer_score       INTEGER DEFAULT 50, -- blames outside vs looks inside
  future_fixation_score    INTEGER DEFAULT 50, -- stuck in future vs past vs present
  agency_score             INTEGER DEFAULT 50, -- sees self as acted-upon vs choosing
  narrative_rigidity_score INTEGER DEFAULT 50, -- fixed story vs fluid identity
  depth_tolerance_score    INTEGER DEFAULT 50, -- how deep they can go before deflecting
  confrontation_response   INTEGER DEFAULT 50, -- shuts down vs opens up when challenged

  -- Dominant defense mechanisms (ranked)
  primary_defense    response_behavior,
  secondary_defense  response_behavior,

  -- What opens them up
  opening_approach   calibration_approach,
  opening_topics     TEXT[] DEFAULT '{}', -- topics where they naturally go deep

  -- What shuts them down
  closing_triggers   TEXT[] DEFAULT '{}', -- topics/approaches that cause withdrawal

  -- Recalculated after every session
  sessions_analyzed  INTEGER DEFAULT 0,
  last_updated       TIMESTAMPTZ DEFAULT now(),
  confidence_score   INTEGER DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),

  created_at         TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_cognitive_map_user ON mirror_cognitive_map(user_id);


-- ─── EMERGENCE LOG (Moments neither predicted) ─────────────────────────

CREATE TABLE IF NOT EXISTS mirror_emergence_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES mirror_profiles(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES mirror_sessions(id) ON DELETE CASCADE,
  entry_id        UUID REFERENCES mirror_entries(id),

  -- What emerged
  description     TEXT NOT NULL,

  -- Classification
  emergence_type  TEXT CHECK (emergence_type IN (
    'frame_break',        -- user's frame visibly shifted
    'novel_insight',      -- something appeared neither party predicted
    'emotional_break',    -- authentic emotion broke through defenses
    'pattern_recognition',-- user saw their own pattern for the first time
    'integration',        -- user connected disparate parts of themselves
    'transmission'        -- something happened that can't be fully described
  )),

  -- Impact
  led_to_pattern_change BOOLEAN DEFAULT false,
  user_reported_impact  TEXT,

  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergence_session ON mirror_emergence_log(session_id);
CREATE INDEX IF NOT EXISTS idx_emergence_user ON mirror_emergence_log(user_id);


-- ─── FUNCTIONS ──────────────────────────────────────────────────────────

-- Update profile stats after each session
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

DROP TRIGGER IF EXISTS trg_session_complete ON mirror_sessions;
CREATE TRIGGER trg_session_complete
  AFTER UPDATE OF ended_at ON mirror_sessions
  FOR EACH ROW
  WHEN (OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL)
  EXECUTE FUNCTION update_profile_after_session();


-- Recalculate calibration effectiveness after session analysis
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

DROP TRIGGER IF EXISTS trg_recalibrate ON mirror_sessions;
CREATE TRIGGER trg_recalibrate
  AFTER UPDATE OF approach_effectiveness ON mirror_sessions
  FOR EACH ROW
  WHEN (NEW.approach_effectiveness IS NOT NULL)
  EXECUTE FUNCTION recalculate_calibration();


-- ─── VIEWS ──────────────────────────────────────────────────────────────

-- User's full mirror profile with cognitive map and top patterns
CREATE OR REPLACE VIEW mirror_user_intelligence AS
SELECT
  p.id,
  p.display_name,
  p.language,
  p.total_descents,
  p.deepest_level,
  p.current_streak,
  p.longest_streak,
  p.last_descent_at,
  cm.intellectualizer_score,
  cm.externalizer_score,
  cm.agency_score,
  cm.depth_tolerance_score,
  cm.primary_defense,
  cm.opening_approach,
  cm.confidence_score AS cognitive_map_confidence,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'name', pat.pattern_name,
      'category', pat.blind_spot_category,
      'occurrences', pat.occurrence_count,
      'status', pat.status
    ) ORDER BY pat.occurrence_count DESC)
    FROM mirror_patterns pat
    WHERE pat.user_id = p.id AND pat.status != 'integrated'
    LIMIT 5
  ) AS active_patterns,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'approach', cal.approach,
      'effectiveness', ROUND(cal.avg_authenticity::numeric, 1),
      'depth', ROUND(cal.avg_depth_reached::numeric, 1),
      'uses', cal.times_used
    ) ORDER BY cal.avg_authenticity DESC)
    FROM mirror_calibration cal
    WHERE cal.user_id = p.id AND cal.times_used >= 2
  ) AS effective_approaches
FROM mirror_profiles p
LEFT JOIN mirror_cognitive_map cm ON cm.user_id = p.id;


-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────

ALTER TABLE mirror_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_cognitive_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_emergence_log ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own data
DO $$ BEGIN
  DROP POLICY IF EXISTS profiles_own ON mirror_profiles;
  CREATE POLICY profiles_own ON mirror_profiles
    FOR ALL USING (auth.uid() = id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS sessions_own ON mirror_sessions;
  CREATE POLICY sessions_own ON mirror_sessions
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS entries_own ON mirror_entries;
  CREATE POLICY entries_own ON mirror_entries
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS patterns_own ON mirror_patterns;
  CREATE POLICY patterns_own ON mirror_patterns
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS calibration_own ON mirror_calibration;
  CREATE POLICY calibration_own ON mirror_calibration
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS cognitive_map_own ON mirror_cognitive_map;
  CREATE POLICY cognitive_map_own ON mirror_cognitive_map
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS emergence_own ON mirror_emergence_log;
  CREATE POLICY emergence_own ON mirror_emergence_log
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA COMPLETE
--
-- Tables: 7
--   mirror_profiles        — who they are
--   mirror_sessions        — each descent
--   mirror_entries         — each exchange
--   mirror_patterns        — what recurs
--   mirror_calibration     — what works for them
--   mirror_cognitive_map   — shape of how they think
--   mirror_emergence_log   — moments of breakthrough
--
-- Enums: 6
-- Functions: 2
-- Triggers: 2
-- Views: 1
-- RLS Policies: 7
-- ═══════════════════════════════════════════════════════════════════════════
