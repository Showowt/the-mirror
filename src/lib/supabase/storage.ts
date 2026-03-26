// ═══════════════════════════════════════════════════════════════
// THE MIRROR v3 — LOCAL STORAGE LAYER
// For anonymous users - persists across sessions
// ═══════════════════════════════════════════════════════════════

import type {
  LocalMirrorProfile,
  LocalMirrorSession,
  LocalMirrorPattern,
  LocalCognitiveMap,
  LocalCalibration,
} from "./types";

const STORAGE_KEYS = {
  profile: "mirror:profile:v3",
  sessions: "mirror:sessions:v3",
  patterns: "mirror:patterns:v3",
  cognitiveMap: "mirror:cognitive_map:v3",
  calibration: "mirror:calibration:v3",
} as const;

// ─── PROFILE ────────────────────────────────────────────────────

export function getProfile(): LocalMirrorProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.profile);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: LocalMirrorProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  } catch {
    console.error("[Mirror] Failed to save profile");
  }
}

export function createDefaultProfile(): LocalMirrorProfile {
  return {
    id: crypto.randomUUID(),
    displayName: null,
    language: "en",
    totalDescents: 0,
    deepestLevel: "surface",
    currentStreak: 0,
    longestStreak: 0,
    lastDescentAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── SESSIONS ───────────────────────────────────────────────────

export function getSessions(): LocalMirrorSession[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.sessions);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: LocalMirrorSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
  } catch {
    console.error("[Mirror] Failed to save sessions");
  }
}

export function addSession(session: LocalMirrorSession): void {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
}

// ─── PATTERNS ───────────────────────────────────────────────────

export function getPatterns(): LocalMirrorPattern[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.patterns);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePatterns(patterns: LocalMirrorPattern[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.patterns, JSON.stringify(patterns));
  } catch {
    console.error("[Mirror] Failed to save patterns");
  }
}

export function upsertPattern(pattern: LocalMirrorPattern): void {
  const patterns = getPatterns();
  const existingIndex = patterns.findIndex((p) => p.name === pattern.name);

  if (existingIndex >= 0) {
    patterns[existingIndex] = {
      ...patterns[existingIndex],
      occurrences: patterns[existingIndex].occurrences + 1,
      lastSeen: new Date().toISOString(),
      status:
        patterns[existingIndex].occurrences >= 2 ? "confirmed" : "emerging",
    };
  } else {
    patterns.push(pattern);
  }

  savePatterns(patterns);
}

// ─── COGNITIVE MAP ──────────────────────────────────────────────

export function getCognitiveMap(): LocalCognitiveMap {
  if (typeof window === "undefined") {
    return createDefaultCognitiveMap();
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.cognitiveMap);
    return data ? JSON.parse(data) : createDefaultCognitiveMap();
  } catch {
    return createDefaultCognitiveMap();
  }
}

export function saveCognitiveMap(map: LocalCognitiveMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.cognitiveMap, JSON.stringify(map));
  } catch {
    console.error("[Mirror] Failed to save cognitive map");
  }
}

export function createDefaultCognitiveMap(): LocalCognitiveMap {
  return {
    intellectualizer: 50,
    externalizer: 50,
    agencyScore: 50,
    depthTolerance: 50,
    primaryDefense: null,
    tendencies: [],
    sessionsAnalyzed: 0,
    confidence: 0,
  };
}

export function updateCognitiveMap(
  updates: Partial<{
    intellectualizer: number;
    externalizer: number;
    agency: number;
    depthTolerance: number;
  }>,
  newDefense?: string,
): void {
  const map = getCognitiveMap();

  // Apply updates with clamping
  if (updates.intellectualizer !== undefined) {
    map.intellectualizer = Math.max(
      0,
      Math.min(100, map.intellectualizer + updates.intellectualizer),
    );
  }
  if (updates.externalizer !== undefined) {
    map.externalizer = Math.max(
      0,
      Math.min(100, map.externalizer + updates.externalizer),
    );
  }
  if (updates.agency !== undefined) {
    map.agencyScore = Math.max(
      0,
      Math.min(100, map.agencyScore + updates.agency),
    );
  }
  if (updates.depthTolerance !== undefined) {
    map.depthTolerance = Math.max(
      0,
      Math.min(100, map.depthTolerance + updates.depthTolerance),
    );
  }

  if (newDefense) {
    map.primaryDefense = newDefense as LocalCognitiveMap["primaryDefense"];
  }

  map.sessionsAnalyzed += 1;
  map.confidence = Math.min(100, Math.floor((map.sessionsAnalyzed / 20) * 100));

  saveCognitiveMap(map);
}

// ─── CALIBRATION ────────────────────────────────────────────────

export function getCalibration(): LocalCalibration {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEYS.calibration);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveCalibration(calibration: LocalCalibration): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.calibration, JSON.stringify(calibration));
  } catch {
    console.error("[Mirror] Failed to save calibration");
  }
}

export function updateCalibration(
  approach: string,
  effectiveness: number,
  depth: number,
): void {
  const calibration = getCalibration();

  if (calibration[approach]) {
    const existing = calibration[approach];
    const newUses = existing.uses + 1;
    calibration[approach] = {
      uses: newUses,
      effectiveness:
        (existing.effectiveness * existing.uses + effectiveness) / newUses,
      depth: (existing.depth * existing.uses + depth) / newUses,
    };
  } else {
    calibration[approach] = {
      uses: 1,
      effectiveness,
      depth,
    };
  }

  saveCalibration(calibration);
}

// ─── CLEAR ALL ──────────────────────────────────────────────────

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    console.error("[Mirror] Failed to clear data");
  }
}

// ─── MIGRATION (from v2 localStorage format) ────────────────────

export function migrateFromV2(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const oldVault = localStorage.getItem("mirror-vault-v3");
    if (!oldVault) return false;

    const vault = JSON.parse(oldVault);
    if (!vault.cards || !Array.isArray(vault.cards)) return false;

    // Convert old cards to new session format
    const sessions: LocalMirrorSession[] = vault.cards.map(
      (card: {
        id: string;
        date: string;
        situation_preview: string;
        question1: string;
        question2: string;
        pattern_name: string;
        pattern_revealed: string;
        lang: string;
      }) => ({
        id: card.id,
        startedAt: card.date,
        endedAt: card.date,
        offering: card.situation_preview,
        deepestLevel: card.question2 ? "origin" : "pattern",
        entries: [
          {
            type: "offering" as const,
            level: "surface" as const,
            content: card.situation_preview,
            timestamp: card.date,
          },
          {
            type: "question" as const,
            level: "surface" as const,
            content: card.question1,
            timestamp: card.date,
          },
          ...(card.question2
            ? [
                {
                  type: "question" as const,
                  level: "origin" as const,
                  content: card.question2,
                  timestamp: card.date,
                },
              ]
            : []),
        ],
        summary: card.pattern_revealed,
        primaryBlindSpot: null,
      }),
    );

    // Convert patterns
    const patternMap = new Map<string, LocalMirrorPattern>();
    vault.cards.forEach(
      (card: {
        pattern_name: string;
        date: string;
        pattern_revealed: string;
      }) => {
        const name = card.pattern_name;
        if (patternMap.has(name)) {
          const existing = patternMap.get(name)!;
          existing.occurrences += 1;
          existing.lastSeen = card.date;
        } else {
          patternMap.set(name, {
            name,
            description: card.pattern_revealed || "",
            category: null,
            occurrences: 1,
            status: "emerging",
            firstDetected: card.date,
            lastSeen: card.date,
          });
        }
      },
    );

    // Create profile
    const profile: LocalMirrorProfile = {
      id: crypto.randomUUID(),
      displayName: null,
      language: (vault.cards[0]?.lang as "en" | "es") || "en",
      totalDescents: sessions.length,
      deepestLevel: sessions.reduce(
        (max: string, s: LocalMirrorSession) =>
          s.deepestLevel === "core" ||
          (s.deepestLevel === "origin" && max !== "core")
            ? s.deepestLevel
            : max,
        "surface",
      ) as LocalMirrorProfile["deepestLevel"],
      currentStreak: 0,
      longestStreak: 0,
      lastDescentAt: sessions[sessions.length - 1]?.startedAt || null,
      createdAt: sessions[0]?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save migrated data
    saveProfile(profile);
    saveSessions(sessions);
    savePatterns(Array.from(patternMap.values()));

    // Mark old data as migrated (don't delete in case user wants to roll back)
    localStorage.setItem("mirror-vault-v3-migrated", "true");

    return true;
  } catch (e) {
    console.error("[Mirror] Migration failed:", e);
    return false;
  }
}
