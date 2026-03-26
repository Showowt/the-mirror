// ═══════════════════════════════════════════════════════════════
// THE MIRROR v3 — DATABASE TYPES
// Generated from mirror schema
// ═══════════════════════════════════════════════════════════════

export type DescentLevel = "surface" | "pattern" | "origin" | "core";

export type EntryType =
  | "offering"
  | "question"
  | "response"
  | "observation"
  | "pattern_reveal";

export type ResponseBehavior =
  | "direct_engagement"
  | "deflection"
  | "intellectualization"
  | "emotional_flood"
  | "humor_shield"
  | "silence"
  | "projection"
  | "deepening"
  | "minimization"
  | "avoidance"
  | "rationalization";

export type PatternStatus =
  | "emerging"
  | "confirmed"
  | "acknowledged"
  | "integrated";

export type CalibrationApproach =
  | "gut_punch"
  | "slow_reveal"
  | "lateral"
  | "somatic"
  | "observational"
  | "paradoxical"
  | "temporal";

export type BlindSpotCategory =
  | "role_identity"
  | "binary_trap"
  | "projection"
  | "temporal_fixation"
  | "agency_blindness"
  | "relational_pattern"
  | "narrative_lock"
  | "somatic_disconnect"
  | "shadow_material"
  | "systemic_invisibility"
  | "perfectionism_shield"
  | "helper_syndrome"
  | "achievement_addiction"
  | "comparison_trap"
  | "control_illusion"
  | "intimacy_avoidance";

export type EmergenceType =
  | "frame_break"
  | "novel_insight"
  | "emotional_break"
  | "pattern_recognition"
  | "integration"
  | "transmission";

// ─── TABLE TYPES ────────────────────────────────────────────────

export interface MirrorProfile {
  id: string;
  display_name: string | null;
  language: "en" | "es";
  total_descents: number;
  deepest_level: DescentLevel;
  current_streak: number;
  longest_streak: number;
  last_descent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MirrorSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  deepest_level: DescentLevel;
  initial_offering: string;
  offering_frame: Record<string, unknown> | null;
  crisis_detected: boolean;
  total_entries: number;
  deflection_count: number;
  deepening_count: number;
  session_summary: string | null;
  primary_blind_spot: BlindSpotCategory | null;
  secondary_blind_spots: BlindSpotCategory[];
  approach_used: CalibrationApproach | null;
  approach_effectiveness: number | null;
  created_at: string;
}

export interface MirrorEntry {
  id: string;
  session_id: string;
  user_id: string;
  entry_type: EntryType;
  descent_level: DescentLevel;
  sequence_num: number;
  content: string;
  response_behavior: ResponseBehavior | null;
  emotional_charge: number | null;
  authenticity_score: number | null;
  subtext: string | null;
  frame_shift: boolean;
  created_at: string;
}

export interface MirrorPattern {
  id: string;
  user_id: string;
  pattern_name: string;
  pattern_description: string;
  blind_spot_category: BlindSpotCategory | null;
  first_detected_at: string;
  last_seen_at: string;
  occurrence_count: number;
  evidence_session_ids: string[];
  status: PatternStatus;
  surfaced_at: string | null;
  surfaced_in_session: string | null;
  user_reaction: ResponseBehavior | null;
  evolving_into: string | null;
  created_at: string;
  updated_at: string;
}

export interface MirrorCalibration {
  id: string;
  user_id: string;
  approach: CalibrationApproach;
  times_used: number;
  avg_depth_reached: number;
  avg_authenticity: number;
  deflection_rate: number;
  deepening_rate: number;
  effective_for_categories: BlindSpotCategory[];
  ineffective_for_categories: BlindSpotCategory[];
  created_at: string;
  updated_at: string;
}

export interface MirrorCognitiveMap {
  id: string;
  user_id: string;
  intellectualizer_score: number;
  externalizer_score: number;
  future_fixation_score: number;
  agency_score: number;
  narrative_rigidity_score: number;
  depth_tolerance_score: number;
  confrontation_response: number;
  primary_defense: ResponseBehavior | null;
  secondary_defense: ResponseBehavior | null;
  opening_approach: CalibrationApproach | null;
  opening_topics: string[];
  closing_triggers: string[];
  sessions_analyzed: number;
  last_updated: string;
  confidence_score: number;
  created_at: string;
}

export interface MirrorEmergenceLog {
  id: string;
  user_id: string;
  session_id: string;
  entry_id: string | null;
  description: string;
  emergence_type: EmergenceType | null;
  led_to_pattern_change: boolean;
  user_reported_impact: string | null;
  created_at: string;
}

// ─── VIEW TYPES ─────────────────────────────────────────────────

export interface MirrorUserIntelligence {
  id: string;
  display_name: string | null;
  language: "en" | "es";
  total_descents: number;
  deepest_level: DescentLevel;
  current_streak: number;
  longest_streak: number;
  last_descent_at: string | null;
  intellectualizer_score: number | null;
  externalizer_score: number | null;
  agency_score: number | null;
  depth_tolerance_score: number | null;
  primary_defense: ResponseBehavior | null;
  opening_approach: CalibrationApproach | null;
  cognitive_map_confidence: number | null;
  active_patterns: Array<{
    name: string;
    category: BlindSpotCategory;
    occurrences: number;
    status: PatternStatus;
  }> | null;
  effective_approaches: Array<{
    approach: CalibrationApproach;
    effectiveness: number;
    depth: number;
    uses: number;
  }> | null;
}

// ─── LOCAL STORAGE TYPES (for anonymous users) ──────────────────

export interface LocalMirrorProfile {
  id: string;
  displayName: string | null;
  language: "en" | "es";
  totalDescents: number;
  deepestLevel: DescentLevel;
  currentStreak: number;
  longestStreak: number;
  lastDescentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMirrorSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  offering: string;
  deepestLevel: DescentLevel;
  entries: LocalMirrorEntry[];
  summary: string | null;
  primaryBlindSpot: BlindSpotCategory | null;
}

export interface LocalMirrorEntry {
  type: EntryType;
  level: DescentLevel;
  content: string;
  timestamp: string;
}

export interface LocalMirrorPattern {
  name: string;
  description: string;
  category: BlindSpotCategory | null;
  occurrences: number;
  status: PatternStatus;
  firstDetected: string;
  lastSeen: string;
}

export interface LocalCognitiveMap {
  intellectualizer: number;
  externalizer: number;
  agencyScore: number;
  depthTolerance: number;
  primaryDefense: ResponseBehavior | null;
  tendencies: string[];
  sessionsAnalyzed: number;
  confidence: number;
}

export interface LocalCalibration {
  [approach: string]: {
    uses: number;
    effectiveness: number;
    depth: number;
  };
}

// ─── DESCENT LEVEL CONFIG ───────────────────────────────────────

export const DESCENT_LEVELS: Record<
  DescentLevel,
  {
    name: string;
    nameEs: string;
    depth: number;
    color: string;
  }
> = {
  surface: {
    name: "Surface",
    nameEs: "Superficie",
    depth: 1,
    color: "#8a8a8a",
  },
  pattern: { name: "Pattern", nameEs: "Patrón", depth: 2, color: "#6b7fd7" },
  origin: { name: "Origin", nameEs: "Origen", depth: 3, color: "#9b59b6" },
  core: { name: "Core", nameEs: "Núcleo", depth: 4, color: "#c0392b" },
};
