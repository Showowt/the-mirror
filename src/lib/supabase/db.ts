// ═══════════════════════════════════════════════════════════════
// THE MIRROR v3 — DATABASE OPERATIONS
// Handles Supabase CRUD for authenticated users
// ═══════════════════════════════════════════════════════════════

import { getSupabaseClient } from "./client";
import type {
  DescentLevel,
  BlindSpotCategory,
  ResponseBehavior,
  CalibrationApproach,
  PatternStatus,
  LocalMirrorSession,
  LocalMirrorPattern,
  LocalCognitiveMap,
} from "./types";

const supabase = () => getSupabaseClient();

// ─── PROFILE ────────────────────────────────────────────────────

export async function getOrCreateProfile(
  userId: string,
  language: "en" | "es" = "en",
) {
  const { data, error } = await supabase()
    .from("mirror_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // Profile doesn't exist, create it
    const { data: newProfile, error: createError } = await supabase()
      .from("mirror_profiles")
      .insert({
        id: userId,
        language,
        total_descents: 0,
        deepest_level: "surface",
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("[Mirror DB] Failed to create profile:", createError);
      return null;
    }

    // Also create cognitive map
    await supabase().from("mirror_cognitive_map").insert({ user_id: userId });

    return newProfile;
  }

  if (error) {
    console.error("[Mirror DB] Failed to get profile:", error);
    return null;
  }

  return data;
}

export async function updateProfileLanguage(
  userId: string,
  language: "en" | "es",
) {
  const { error } = await supabase()
    .from("mirror_profiles")
    .update({ language, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("[Mirror DB] Failed to update language:", error);
  }
}

// ─── SESSIONS ───────────────────────────────────────────────────

export async function createSession(
  userId: string,
  initialOffering: string,
  crisisDetected: boolean = false,
) {
  const { data, error } = await supabase()
    .from("mirror_sessions")
    .insert({
      user_id: userId,
      initial_offering: initialOffering,
      crisis_detected: crisisDetected,
      deepest_level: "surface",
    })
    .select()
    .single();

  if (error) {
    console.error("[Mirror DB] Failed to create session:", error);
    return null;
  }

  return data;
}

export async function updateSession(
  sessionId: string,
  updates: {
    ended_at?: string;
    deepest_level?: DescentLevel;
    total_entries?: number;
    deflection_count?: number;
    deepening_count?: number;
    session_summary?: string;
    primary_blind_spot?: BlindSpotCategory;
    secondary_blind_spots?: BlindSpotCategory[];
    approach_used?: CalibrationApproach;
    approach_effectiveness?: number;
  },
) {
  const { error } = await supabase()
    .from("mirror_sessions")
    .update(updates)
    .eq("id", sessionId);

  if (error) {
    console.error("[Mirror DB] Failed to update session:", error);
  }
}

export async function getSessions(userId: string, limit: number = 50) {
  const { data, error } = await supabase()
    .from("mirror_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Mirror DB] Failed to get sessions:", error);
    return [];
  }

  return data || [];
}

// ─── ENTRIES ────────────────────────────────────────────────────

export async function createEntry(
  sessionId: string,
  userId: string,
  entryType:
    | "offering"
    | "question"
    | "response"
    | "observation"
    | "pattern_reveal",
  descentLevel: DescentLevel,
  sequenceNum: number,
  content: string,
  analysis?: {
    response_behavior?: ResponseBehavior;
    emotional_charge?: number;
    authenticity_score?: number;
    subtext?: string;
    frame_shift?: boolean;
  },
) {
  const { data, error } = await supabase()
    .from("mirror_entries")
    .insert({
      session_id: sessionId,
      user_id: userId,
      entry_type: entryType,
      descent_level: descentLevel,
      sequence_num: sequenceNum,
      content,
      ...analysis,
    })
    .select()
    .single();

  if (error) {
    console.error("[Mirror DB] Failed to create entry:", error);
    return null;
  }

  return data;
}

export async function getSessionEntries(sessionId: string) {
  const { data, error } = await supabase()
    .from("mirror_entries")
    .select("*")
    .eq("session_id", sessionId)
    .order("sequence_num", { ascending: true });

  if (error) {
    console.error("[Mirror DB] Failed to get entries:", error);
    return [];
  }

  return data || [];
}

// ─── PATTERNS ───────────────────────────────────────────────────

export async function getPatterns(userId: string) {
  const { data, error } = await supabase()
    .from("mirror_patterns")
    .select("*")
    .eq("user_id", userId)
    .order("occurrence_count", { ascending: false });

  if (error) {
    console.error("[Mirror DB] Failed to get patterns:", error);
    return [];
  }

  return data || [];
}

export async function upsertPattern(
  userId: string,
  patternName: string,
  patternDescription: string,
  blindSpotCategory?: BlindSpotCategory,
  sessionId?: string,
) {
  // Check if pattern exists
  const { data: existing } = await supabase()
    .from("mirror_patterns")
    .select("*")
    .eq("user_id", userId)
    .eq("pattern_name", patternName)
    .single();

  if (existing) {
    // Update existing pattern
    const newCount = existing.occurrence_count + 1;
    const newStatus: PatternStatus = newCount >= 3 ? "confirmed" : "emerging";
    const evidenceIds = [...(existing.evidence_session_ids || [])];
    if (sessionId && !evidenceIds.includes(sessionId)) {
      evidenceIds.push(sessionId);
    }

    const { error } = await supabase()
      .from("mirror_patterns")
      .update({
        occurrence_count: newCount,
        last_seen_at: new Date().toISOString(),
        status: newStatus,
        evidence_session_ids: evidenceIds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("[Mirror DB] Failed to update pattern:", error);
    }

    return { ...existing, occurrence_count: newCount, status: newStatus };
  } else {
    // Create new pattern
    const { data, error } = await supabase()
      .from("mirror_patterns")
      .insert({
        user_id: userId,
        pattern_name: patternName,
        pattern_description: patternDescription,
        blind_spot_category: blindSpotCategory,
        evidence_session_ids: sessionId ? [sessionId] : [],
      })
      .select()
      .single();

    if (error) {
      console.error("[Mirror DB] Failed to create pattern:", error);
      return null;
    }

    return data;
  }
}

// ─── COGNITIVE MAP ──────────────────────────────────────────────

export async function getCognitiveMap(userId: string) {
  const { data, error } = await supabase()
    .from("mirror_cognitive_map")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[Mirror DB] Failed to get cognitive map:", error);
  }

  return data;
}

export async function updateCognitiveMap(
  userId: string,
  updates: {
    intellectualizer_score?: number;
    externalizer_score?: number;
    future_fixation_score?: number;
    agency_score?: number;
    narrative_rigidity_score?: number;
    depth_tolerance_score?: number;
    confrontation_response?: number;
    primary_defense?: ResponseBehavior;
    secondary_defense?: ResponseBehavior;
    opening_approach?: CalibrationApproach;
    opening_topics?: string[];
    closing_triggers?: string[];
    sessions_analyzed?: number;
    confidence_score?: number;
  },
) {
  const { data: existing } = await supabase()
    .from("mirror_cognitive_map")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const { error } = await supabase()
      .from("mirror_cognitive_map")
      .update({
        ...updates,
        last_updated: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[Mirror DB] Failed to update cognitive map:", error);
    }
  } else {
    const { error } = await supabase()
      .from("mirror_cognitive_map")
      .insert({
        user_id: userId,
        ...updates,
      });

    if (error) {
      console.error("[Mirror DB] Failed to create cognitive map:", error);
    }
  }
}

// ─── CALIBRATION ────────────────────────────────────────────────

export async function getCalibration(userId: string) {
  const { data, error } = await supabase()
    .from("mirror_calibration")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("[Mirror DB] Failed to get calibration:", error);
    return [];
  }

  return data || [];
}

// ─── USER INTELLIGENCE VIEW ─────────────────────────────────────

export async function getUserIntelligence(userId: string) {
  const { data, error } = await supabase()
    .from("mirror_user_intelligence")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[Mirror DB] Failed to get user intelligence:", error);
    return null;
  }

  return data;
}

// ─── SYNC FROM LOCAL STORAGE ────────────────────────────────────

export async function syncFromLocalStorage(
  userId: string,
  localSessions: LocalMirrorSession[],
  localPatterns: LocalMirrorPattern[],
  localCogMap: LocalCognitiveMap,
) {
  console.log("[Mirror DB] Syncing local data to Supabase...");

  // Sync sessions
  for (const session of localSessions) {
    // Check if session already synced (by checking if offering matches)
    const { data: existing } = await supabase()
      .from("mirror_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("initial_offering", session.offering)
      .single();

    if (!existing) {
      const { data: newSession } = await supabase()
        .from("mirror_sessions")
        .insert({
          user_id: userId,
          started_at: session.startedAt,
          ended_at: session.endedAt,
          initial_offering: session.offering,
          deepest_level: session.deepestLevel,
          session_summary: session.summary,
          primary_blind_spot: session.primaryBlindSpot,
        })
        .select()
        .single();

      if (newSession) {
        // Sync entries
        for (let i = 0; i < session.entries.length; i++) {
          const entry = session.entries[i];
          await supabase().from("mirror_entries").insert({
            session_id: newSession.id,
            user_id: userId,
            entry_type: entry.type,
            descent_level: entry.level,
            sequence_num: i,
            content: entry.content,
          });
        }
      }
    }
  }

  // Sync patterns
  for (const pattern of localPatterns) {
    await upsertPattern(
      userId,
      pattern.name,
      pattern.description,
      pattern.category || undefined,
    );
  }

  // Sync cognitive map
  if (localCogMap.sessionsAnalyzed > 0) {
    await updateCognitiveMap(userId, {
      intellectualizer_score: localCogMap.intellectualizer,
      externalizer_score: localCogMap.externalizer,
      agency_score: localCogMap.agencyScore,
      depth_tolerance_score: localCogMap.depthTolerance,
      primary_defense: localCogMap.primaryDefense || undefined,
      sessions_analyzed: localCogMap.sessionsAnalyzed,
      confidence_score: localCogMap.confidence,
    });
  }

  console.log("[Mirror DB] Sync complete");
}
