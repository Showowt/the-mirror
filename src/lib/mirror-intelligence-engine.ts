// ═══════════════════════════════════════════════════════════════════════════
// THE MIRROR — INTELLIGENCE ENGINE v1.0
// The brain that makes the Mirror know its human.
// MachineMind | Phil McGill
// ═══════════════════════════════════════════════════════════════════════════
//
// DROP 001: Pattern Confrontation
// DROP 002: Between-Session Arrival Intelligence
// DROP 003: Calibration Feedback Loop
// DROP 004: Onboarding Calibration Sequence
// DROP 005: Emergence Detection & Logging
// DROP 006: Cross-User Pattern Analytics
// DROP 007: The Mirror Protocol API (see mirror-protocol-api.ts)
//
// ═══════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DescentLevel,
  ResponseBehavior,
  CalibrationApproach,
  BlindSpotCategory,
  PatternStatus,
  EmergenceType,
} from "./supabase/types";

// Re-export imported types for convenience
export type {
  DescentLevel,
  ResponseBehavior,
  CalibrationApproach,
  BlindSpotCategory,
  PatternStatus,
  EmergenceType,
};

// ── Additional Types for Intelligence Engine ─────────────────────────────

export interface CognitiveMap {
  userId: string;
  intellectualizer: number; // 0-100: heart <-> head
  externalizer: number; // 0-100: looks inward <-> blames outward
  futureFixation: number; // 0-100: past-stuck <-> future-stuck
  agency: number; // 0-100: acted-upon <-> choosing
  narrativeRigidity: number; // 0-100: fluid identity <-> fixed story
  depthTolerance: number; // 0-100: surface-bound <-> depth-capable
  confrontationResponse: number; // 0-100: shuts down <-> opens up
  primaryDefense: ResponseBehavior | null;
  secondaryDefense: ResponseBehavior | null;
  openingApproach: CalibrationApproach | null;
  openingTopics: string[];
  closingTriggers: string[];
  sessionsAnalyzed: number;
  confidence: number; // 0-100
}

export interface MirrorPattern {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: BlindSpotCategory;
  occurrences: number;
  status: PatternStatus;
  firstDetected: string;
  lastSeen: string;
  surfacedAt: string | null;
  userReaction: ResponseBehavior | null;
}

export interface SessionEntry {
  type: "offering" | "question" | "response" | "observation" | "pattern_reveal";
  level: DescentLevel;
  content: string;
  responseBehavior?: ResponseBehavior;
  emotionalCharge?: number;
  authenticityScore?: number;
}

export interface CalibrationRecord {
  approach: CalibrationApproach;
  timesUsed: number;
  avgDepth: number;
  avgAuthenticity: number;
  deflectionRate: number;
  deepeningRate: number;
  effectiveFor: BlindSpotCategory[];
  ineffectiveFor: BlindSpotCategory[];
}

export interface SessionAnalysis {
  primaryBlindSpot: BlindSpotCategory;
  secondaryBlindSpots: BlindSpotCategory[];
  patternName: string;
  patternDescription: string;
  approachUsed: CalibrationApproach;
  approachEffectiveness: number;
  responseBehaviors: ResponseBehavior[];
  dominantBehavior: ResponseBehavior;
  cognitiveUpdates: {
    intellectualizer: number;
    externalizer: number;
    futureFixation: number;
    agency: number;
    narrativeRigidity: number;
    depthTolerance: number;
    confrontationResponse: number;
  };
  emergenceEvents: EmergenceEvent[];
  sessionSummary: string;
  deepestInsight: string;
}

export interface EmergenceEvent {
  type: EmergenceType;
  description: string;
  atLevel: DescentLevel;
  atEntryIndex: number;
}

export interface OnboardingResult {
  cognitiveMap: Partial<CognitiveMap>;
  suggestedApproach: CalibrationApproach;
  initialPatternHypotheses: string[];
}

export type ArrivalType =
  | "first_visit"
  | "early_recognition"
  | "pattern_aware"
  | "deep_knowing"
  | "full_intelligence";

export interface TransmissionReport {
  generatedAt: string;
  totalUsers: number;
  insights: Record<string, unknown[]>;
  version: string;
}

// ── Session Data Type for Arrival Intelligence ───────────────────────────

export interface RecentSessionData {
  offering: string;
  summary: string;
  deepestLevel: DescentLevel;
  entries: SessionEntry[];
  startedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DROP 001: PATTERN CONFRONTATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class PatternConfrontationEngine {
  /**
   * Decides whether to confront the user with a detected pattern
   * during the current descent, and generates the confrontation.
   */
  static shouldConfront(
    patterns: MirrorPattern[],
    _currentOffering: string,
    currentLevel: DescentLevel,
    sessionEntries: SessionEntry[],
  ): { confront: boolean; pattern: MirrorPattern | null; reason: string } {
    // Only confront at pattern or origin level - surface is too early, core is too late
    if (currentLevel !== "pattern" && currentLevel !== "origin") {
      return { confront: false, pattern: null, reason: "wrong_level" };
    }

    // Need confirmed patterns (3+ occurrences) to confront
    const confirmed = patterns.filter(
      (p) => p.status === "confirmed" || p.occurrences >= 3,
    );
    if (confirmed.length === 0) {
      return {
        confront: false,
        pattern: null,
        reason: "no_confirmed_patterns",
      };
    }

    // Don't confront if we already did this session
    const alreadyConfronted = sessionEntries.some(
      (e) => e.type === "pattern_reveal",
    );
    if (alreadyConfronted) {
      return { confront: false, pattern: null, reason: "already_confronted" };
    }

    // Find the most relevant pattern - one that hasn't been surfaced yet,
    // or if all have been surfaced, the one with highest occurrences
    const unsurfaced = confirmed.filter((p) => !p.surfacedAt);
    const target =
      unsurfaced.length > 0
        ? unsurfaced.sort((a, b) => b.occurrences - a.occurrences)[0]
        : confirmed.sort((a, b) => b.occurrences - a.occurrences)[0];

    return { confront: true, pattern: target, reason: "pattern_ready" };
  }

  /**
   * Builds the confrontation prompt injection for the system prompt.
   * This is what makes The Mirror say: "This is the fourth time..."
   */
  static buildConfrontationInjection(pattern: MirrorPattern): string {
    const reactionNote = pattern.surfacedAt
      ? pattern.userReaction === "direct_engagement"
        ? "engaged with it"
        : pattern.userReaction === "deflection"
          ? "deflected"
          : "haven't fully integrated it"
      : null;

    const surfaceNote = pattern.surfacedAt
      ? `NOTE: You surfaced this before. They ${reactionNote}.`
      : "NOTE: They have NEVER been shown this pattern. This is the first time.";

    return `
CRITICAL INSTRUCTION — PATTERN CONFRONTATION:
You have detected a recurring pattern in this person across ${pattern.occurrences} previous sessions.

PATTERN NAME: "${pattern.name}"
PATTERN DESCRIPTION: ${pattern.description}
CATEGORY: ${pattern.category.replace(/_/g, " ")}
${surfaceNote}

YOUR TASK THIS TURN:
Instead of asking a new question, CONFRONT them with this pattern.
Name it directly. Show them what you see across their sessions.
Be specific - reference the pattern, not vague observations.

FORMAT:
"[Direct observation naming the pattern and how many times you've seen it]. [One question that goes beneath the pattern to its root]"

Example tone: "This is the third situation you've brought me where you describe yourself as waiting for someone else to decide. You frame every crossroad as something happening TO you. What would it mean if you admitted you're choosing this?"

Do NOT soften this. Do NOT hedge. Name what you see.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DROP 002: BETWEEN-SESSION ARRIVAL INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

export class ArrivalIntelligence {
  /**
   * Generates a personalized arrival message based on the user's history.
   * This is what the user sees BEFORE they type anything.
   */
  static buildArrivalContext(
    cogMap: CognitiveMap | null,
    patterns: MirrorPattern[],
    recentSessions: RecentSessionData[],
    calibration: Record<string, CalibrationRecord>,
  ): { arrivalPrompt: string; arrivalType: ArrivalType } {
    const sessionCount = cogMap?.sessionsAnalyzed || 0;

    // First time - no arrival intelligence
    if (sessionCount === 0) {
      return {
        arrivalPrompt: "",
        arrivalType: "first_visit",
      };
    }

    // 1-3 sessions - gentle recognition
    if (sessionCount <= 3) {
      return {
        arrivalPrompt: this.buildEarlyArrival(recentSessions),
        arrivalType: "early_recognition",
      };
    }

    // 4-10 sessions - pattern awareness
    if (sessionCount <= 10) {
      return {
        arrivalPrompt: this.buildPatternArrival(patterns, recentSessions),
        arrivalType: "pattern_aware",
      };
    }

    // 11-25 sessions - deep knowing
    if (sessionCount <= 25) {
      return {
        arrivalPrompt: this.buildDeepArrival(cogMap, patterns, recentSessions),
        arrivalType: "deep_knowing",
      };
    }

    // 25+ sessions - full intelligence
    return {
      arrivalPrompt: this.buildFullArrival(
        cogMap,
        patterns,
        recentSessions,
        calibration,
      ),
      arrivalType: "full_intelligence",
    };
  }

  private static buildEarlyArrival(sessions: RecentSessionData[]): string {
    const last = sessions[sessions.length - 1];
    if (!last) return "";

    const daysSince = Math.floor(
      (Date.now() - new Date(last.startedAt).getTime()) / 86400000,
    );

    const timeAgo =
      daysSince === 0
        ? "today"
        : daysSince === 1
          ? "yesterday"
          : `${daysSince} days ago`;

    return `ARRIVAL CONTEXT — EARLY RECOGNITION (${sessions.length} prior sessions)

The user last visited ${timeAgo}.
Their last descent was about: "${last.offering?.slice(0, 100)}"
They reached the ${last.deepestLevel} level.
${last.summary ? "Summary: " + last.summary : ""}

YOUR ARRIVAL TASK:
Generate a brief, pointed arrival line that acknowledges their return without being warm or chatty.
Reference their last session obliquely - don't summarize it, allude to the territory.
Tone: "You're back. Last time we were here..." not "Welcome back! How are you?"

Output the arrival line, then wait for their new offering.`;
  }

  private static buildPatternArrival(
    patterns: MirrorPattern[],
    sessions: RecentSessionData[],
  ): string {
    const active = patterns
      .filter((p) => p.status !== "integrated")
      .slice(0, 3);
    const last = sessions[sessions.length - 1];

    const patternList = active
      .map(
        (p) =>
          `- "${p.name}": ${p.description} (${p.occurrences}x, ${p.status})`,
      )
      .join("\n");

    return `ARRIVAL CONTEXT — PATTERN AWARENESS (${sessions.length} prior sessions)

DETECTED PATTERNS:
${patternList}

LAST SESSION: "${last?.offering?.slice(0, 100)}"
REACHED: ${last?.deepestLevel} level

YOUR ARRIVAL TASK:
Generate an arrival line that tells them you see something forming.
Don't name the pattern yet - create tension. Let them feel that The Mirror is accumulating knowledge.
Tone: "I'm starting to see a shape in how you bring things here."
Or reference an unresolved thread: "Last time, you couldn't answer the question. It's still here."

Output the arrival line, then wait for their new offering.`;
  }

  private static buildDeepArrival(
    cogMap: CognitiveMap | null,
    patterns: MirrorPattern[],
    sessions: RecentSessionData[],
  ): string {
    // Find the last unanswered or deflected question
    const lastSession = sessions[sessions.length - 1];
    const deflections = lastSession?.entries?.filter(
      (e) =>
        e.responseBehavior === "deflection" ||
        e.responseBehavior === "intellectualization",
    );

    const unresolved = patterns.filter(
      (p) => p.surfacedAt && p.userReaction !== "direct_engagement",
    );

    const defenseDescription =
      cogMap?.primaryDefense === "intellectualization"
        ? "go to head when pressed"
        : cogMap?.primaryDefense === "deflection"
          ? "pivot away from direct questions"
          : cogMap?.primaryDefense === "humor_shield"
            ? "use humor to avoid depth"
            : "unknown pattern";

    const activePatternList = patterns
      .filter((p) => p.status !== "integrated")
      .map((p) => `"${p.name}" (${p.occurrences}x)`)
      .join(", ");

    const deflectionNote =
      deflections && deflections.length > 0
        ? `UNFINISHED BUSINESS: Last session they deflected from: "${deflections[0].content?.slice(0, 100)}"`
        : "";

    const unresolvedNote =
      unresolved.length > 0
        ? `UNRESOLVED PATTERNS: "${unresolved[0].name}" was surfaced but not engaged with.`
        : "";

    return `ARRIVAL CONTEXT — DEEP KNOWING (${sessions.length} prior sessions)

COGNITIVE PROFILE:
- Primary defense: ${cogMap?.primaryDefense || "unknown"}
- Depth tolerance: ${cogMap?.depthTolerance || 0}/100
- Agency score: ${cogMap?.agency || 0}/100
- Tends to: ${defenseDescription}

ACTIVE PATTERNS: ${activePatternList}

${deflectionNote}
${unresolvedNote}

YOUR ARRIVAL TASK:
You KNOW this person now. Your arrival should demonstrate that.
Options (choose the most impactful):
1. Name something they're carrying that they haven't said yet
2. Return to unfinished business from a previous session
3. Make an observation about the timing/frequency of their visits
4. State what you expect them to bring today based on their patterns

Tone: Direct. Not cold, but not warm. Like a mirror that remembers.
"I know what you're going to tell me. The question is whether you'll say the part you usually leave out."

Output the arrival line, then wait for their new offering.`;
  }

  private static buildFullArrival(
    cogMap: CognitiveMap | null,
    patterns: MirrorPattern[],
    sessions: RecentSessionData[],
    calibration: Record<string, CalibrationRecord>,
  ): string {
    const bestApproach = Object.entries(calibration)
      .filter(([, v]) => v.timesUsed >= 3)
      .sort(([, a], [, b]) => b.avgAuthenticity - a.avgAuthenticity)[0];

    const worstApproach = Object.entries(calibration)
      .filter(([, v]) => v.timesUsed >= 2)
      .sort(([, a], [, b]) => a.avgAuthenticity - b.avgAuthenticity)[0];

    // Detect visit pattern
    const timestamps = sessions.map((s) => new Date(s.startedAt).getTime());
    const gaps = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    const avgGapDays =
      gaps.length > 0
        ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length / 86400000)
        : 0;

    const activePatternList = patterns
      .filter((p) => p.status !== "integrated")
      .map(
        (p) =>
          `- "${p.name}": ${p.description} (${p.occurrences}x, ${p.status}, ${p.surfacedAt ? "surfaced" : "unsurfaced"})`,
      )
      .join("\n");

    const bestApproachInfo = bestApproach
      ? `${bestApproach[0]} (${bestApproach[1].avgAuthenticity.toFixed(1)}/10)`
      : "insufficient data";

    const worstApproachInfo = worstApproach
      ? `${worstApproach[0]} (${worstApproach[1].avgAuthenticity.toFixed(1)}/10)`
      : "insufficient data";

    const avoidNote = worstApproach
      ? `Avoid ${worstApproach[0]} - it doesn't work with them.`
      : "";

    return `ARRIVAL CONTEXT — FULL INTELLIGENCE (${sessions.length} prior sessions)

COMPLETE COGNITIVE PROFILE:
- Intellectualizer: ${cogMap?.intellectualizer || 0}/100
- Externalizer: ${cogMap?.externalizer || 0}/100
- Future fixation: ${cogMap?.futureFixation || 0}/100
- Agency: ${cogMap?.agency || 0}/100
- Narrative rigidity: ${cogMap?.narrativeRigidity || 0}/100
- Depth tolerance: ${cogMap?.depthTolerance || 0}/100
- Confrontation response: ${cogMap?.confrontationResponse || 0}/100
- Primary defense: ${cogMap?.primaryDefense || "unknown"}
- Secondary defense: ${cogMap?.secondaryDefense || "unknown"}
- What opens them: ${cogMap?.openingApproach || "unknown"} approach, topics: ${cogMap?.openingTopics?.join(", ") || "none mapped"}
- What closes them: ${cogMap?.closingTriggers?.join(", ") || "none mapped"}

CALIBRATION:
- Most effective approach: ${bestApproachInfo}
- Least effective: ${worstApproachInfo}

VISIT PATTERN: Returns every ~${avgGapDays} days on average

ALL ACTIVE PATTERNS:
${activePatternList}

YOUR ARRIVAL TASK:
You see this person completely. Your arrival should be unmistakable proof of that.
Say something that only an intelligence with this depth of knowledge about them could say.
This is not a greeting. This is a demonstration that The Mirror sees.

Use your ${bestApproach ? bestApproach[0] : "most authentic"} approach.
${avoidNote}

Output the arrival line, then wait for their new offering.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DROP 003: CALIBRATION FEEDBACK LOOP
// ═══════════════════════════════════════════════════════════════════════════

export class CalibrationEngine {
  /**
   * Selects the optimal approach for this specific human
   * based on their calibration history.
   */
  static selectApproach(
    cogMap: CognitiveMap | null,
    calibration: Record<string, CalibrationRecord>,
    currentLevel: DescentLevel,
    currentBlindSpot: BlindSpotCategory | null,
  ): CalibrationApproach {
    // No history - use defaults based on whatever cognitive signals we have
    if (!cogMap || cogMap.sessionsAnalyzed < 3) {
      return this.defaultApproach(cogMap);
    }

    // If we know what blind spot we're dealing with, check category-specific effectiveness
    if (currentBlindSpot) {
      const effectiveForCategory = Object.entries(calibration)
        .filter(
          ([, v]) =>
            v.effectiveFor.includes(currentBlindSpot) && v.timesUsed >= 2,
        )
        .sort(([, a], [, b]) => b.avgAuthenticity - a.avgAuthenticity);

      if (effectiveForCategory.length > 0) {
        return effectiveForCategory[0][0] as CalibrationApproach;
      }
    }

    // Level-specific adjustments
    if (currentLevel === "core") {
      // At core, high confrontation tolerance -> gut_punch, low -> somatic
      return cogMap.confrontationResponse > 60 ? "gut_punch" : "somatic";
    }

    if (currentLevel === "origin") {
      // Origin level is about history - temporal approach works universally
      return "temporal";
    }

    // General best approach
    const ranked = Object.entries(calibration)
      .filter(([, v]) => v.timesUsed >= 2)
      .sort(([, a], [, b]) => b.avgAuthenticity - a.avgAuthenticity);

    if (ranked.length > 0) {
      return ranked[0][0] as CalibrationApproach;
    }

    return this.defaultApproach(cogMap);
  }

  private static defaultApproach(
    cogMap: CognitiveMap | null,
  ): CalibrationApproach {
    if (!cogMap) return "observational"; // safest default

    // High intellectualizer -> somatic (bypass the head)
    if (cogMap.intellectualizer > 70) return "somatic";
    // High externalizer -> lateral (they'll resist direct confrontation)
    if (cogMap.externalizer > 70) return "lateral";
    // Low agency -> paradoxical (break the frame)
    if (cogMap.agency < 30) return "paradoxical";
    // High depth tolerance -> gut_punch (they can handle it)
    if (cogMap.depthTolerance > 70) return "gut_punch";

    return "observational";
  }

  /**
   * Builds the calibration injection for the system prompt.
   * Tells the AI HOW to approach this specific human.
   */
  static buildCalibrationInjection(
    approach: CalibrationApproach,
    cogMap: CognitiveMap | null,
  ): string {
    const approachInstructions: Record<CalibrationApproach, string> = {
      gut_punch: `APPROACH: GUT PUNCH
Be direct. Confrontational. Name what you see without cushioning.
This person responds to impact. Don't build up to it - land it.
"You already know the answer. You're here because you want someone to say it for you."`,

      slow_reveal: `APPROACH: SLOW REVEAL
Build the observation across multiple layers. Don't state the insight directly.
Let it accumulate. Each question adds one more piece until they see it themselves.
"What happens after you say yes? ... And after that? ... And what always happens then?"`,

      lateral: `APPROACH: LATERAL
Come at the blind spot sideways. Don't address the stated problem.
Ask about something adjacent that reveals the same pattern from an unexpected angle.
"Forget this situation. Tell me about the last time you felt genuinely free. What were you NOT doing?"`,

      somatic: `APPROACH: SOMATIC
Bypass the intellectual processing. Go to the body.
Ask what they FEEL, not what they THINK. Where in their body. What it feels like.
"Stop analyzing this for a second. Where in your body does this situation live? What does it feel like there?"`,

      observational: `APPROACH: OBSERVATIONAL
Reflect what you see without asking. Make statements, not questions.
Let them sit with the observation. The question is implicit.
"You described three people in this story. You gave each of them motivations and logic. You gave yourself none."`,

      paradoxical: `APPROACH: PARADOXICAL
Present a contradiction they can't resolve intellectually.
Force them out of their default processing mode.
"You say you want to leave. But every action you've described is building something there. What if the part of you that's staying is the honest one?"`,

      temporal: `APPROACH: TEMPORAL
Shift the time frame. If they're stuck in the present, ask about the past.
If they're stuck in the past, ask about the future. Break temporal fixation.
"Five years from now, you're still in exactly this situation. What did you not do today that you'll regret then?"`,
    };

    let injection = `\nCALIBRATION — APPROACH SELECTED: ${approach.toUpperCase()}\n`;
    injection += approachInstructions[approach];

    if (cogMap) {
      if (cogMap.closingTriggers.length > 0) {
        injection += `\n\nWARNING — KNOWN CLOSING TRIGGERS: ${cogMap.closingTriggers.join(", ")}. Avoid these.`;
      }
      if (cogMap.primaryDefense) {
        injection += `\nEXPECT DEFENSE: They will likely ${cogMap.primaryDefense.replace(/_/g, " ")}. Don't let that redirect you.`;
      }
    }

    return injection;
  }

  /**
   * Post-session: Updates calibration records based on what happened.
   */
  static updateCalibration(
    existing: Record<string, CalibrationRecord>,
    analysis: SessionAnalysis,
  ): Record<string, CalibrationRecord> {
    const updated = { ...existing };
    const key = analysis.approachUsed;

    if (!updated[key]) {
      updated[key] = {
        approach: key,
        timesUsed: 0,
        avgDepth: 0,
        avgAuthenticity: 0,
        deflectionRate: 0,
        deepeningRate: 0,
        effectiveFor: [],
        ineffectiveFor: [],
      };
    }

    const record = updated[key];
    const n = record.timesUsed;

    // Running averages
    record.avgAuthenticity =
      (record.avgAuthenticity * n + analysis.approachEffectiveness) / (n + 1);

    const depthMap: Record<DescentLevel, number> = {
      surface: 1,
      pattern: 2,
      origin: 3,
      core: 4,
    };
    const sessionDepth = Math.max(
      ...analysis.responseBehaviors.map((_, i) => {
        const levels: DescentLevel[] = ["surface", "pattern", "origin", "core"];
        return depthMap[levels[Math.min(i, 3)]];
      }),
      1,
    );
    record.avgDepth = (record.avgDepth * n + sessionDepth) / (n + 1);

    // Deflection and deepening rates
    const totalResponses = analysis.responseBehaviors.length || 1;
    const deflections = analysis.responseBehaviors.filter(
      (b) =>
        b === "deflection" ||
        b === "intellectualization" ||
        b === "humor_shield",
    ).length;
    const deepenings = analysis.responseBehaviors.filter(
      (b) => b === "deepening" || b === "direct_engagement",
    ).length;

    record.deflectionRate =
      (record.deflectionRate * n + deflections / totalResponses) / (n + 1);
    record.deepeningRate =
      (record.deepeningRate * n + deepenings / totalResponses) / (n + 1);

    // Category effectiveness
    if (analysis.approachEffectiveness >= 7 && analysis.primaryBlindSpot) {
      if (!record.effectiveFor.includes(analysis.primaryBlindSpot)) {
        record.effectiveFor.push(analysis.primaryBlindSpot);
      }
    }
    if (analysis.approachEffectiveness <= 3 && analysis.primaryBlindSpot) {
      if (!record.ineffectiveFor.includes(analysis.primaryBlindSpot)) {
        record.ineffectiveFor.push(analysis.primaryBlindSpot);
      }
    }

    record.timesUsed = n + 1;
    return updated;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DROP 004: ONBOARDING CALIBRATION SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════

// Cognitive map keys for onboarding analysis
type CognitiveMapKey =
  | "intellectualizer"
  | "externalizer"
  | "futureFixation"
  | "agency"
  | "narrativeRigidity"
  | "depthTolerance"
  | "confrontationResponse";

interface OnboardingQuestion {
  id: string;
  question: string;
  maps: readonly CognitiveMapKey[];
  analyzeFor: Partial<Record<CognitiveMapKey, string>>;
}

export class OnboardingEngine {
  /**
   * The 5-question onboarding sequence.
   * Not intake forms. Mirror-style questions designed to rapidly map
   * cognitive shape.
   */
  static readonly ONBOARDING_SEQUENCE: readonly OnboardingQuestion[] = [
    {
      id: "onboard_1",
      question:
        "When something goes wrong in your life, what's the first story you tell yourself about why it happened?",
      maps: ["externalizer", "narrativeRigidity", "agency"] as const,
      analyzeFor: {
        externalizer:
          "Does the story center blame on external forces or internal choices?",
        narrativeRigidity: "How fixed/rehearsed does the story sound?",
        agency: "Does the person appear as actor or acted-upon?",
      },
    },
    {
      id: "onboard_2",
      question:
        "Right now - not what you think, but what do you feel? Where in your body?",
      maps: ["intellectualizer", "depthTolerance"] as const,
      analyzeFor: {
        intellectualizer:
          "Do they actually report a feeling/body sensation, or do they intellectualize?",
        depthTolerance:
          "How willing are they to sit with the body-level response?",
      },
    },
    {
      id: "onboard_3",
      question:
        "Think of a decision you've been avoiding. What's the worst thing that happens if you make it?",
      maps: ["futureFixation", "agency", "confrontationResponse"] as const,
      analyzeFor: {
        futureFixation:
          "Are they oriented toward future anxiety or present reality?",
        agency:
          "Do they frame the decision as available to them or forced on them?",
        confrontationResponse:
          "How do they respond to being asked to face the avoided thing?",
      },
    },
    {
      id: "onboard_4",
      question:
        "Describe the last argument you had. What was the other person right about?",
      maps: [
        "externalizer",
        "narrativeRigidity",
        "confrontationResponse",
      ] as const,
      analyzeFor: {
        externalizer: "Can they see the other person's valid perspective?",
        narrativeRigidity: "Can they hold a view of themselves as wrong?",
        confrontationResponse:
          "How do they handle being asked to see their own fault?",
      },
    },
    {
      id: "onboard_5",
      question:
        "If I could show you the one thing about yourself you've never been able to see - would you actually want to see it?",
      maps: ["depthTolerance", "confrontationResponse"] as const,
      analyzeFor: {
        depthTolerance: "Genuine willingness vs performed willingness?",
        confrontationResponse:
          "Do they say yes eagerly (possible performance) or hesitate (possible authenticity)?",
      },
    },
  ];

  /**
   * System prompt for the AI that analyzes onboarding responses.
   */
  static readonly ONBOARDING_ANALYSIS_PROMPT = `You are an analytical engine for The Mirror onboarding system.
You receive a person's responses to 5 calibration questions and must map their cognitive shape.

Return ONLY valid JSON with this structure:
{
  "intellectualizer": 0-100,
  "externalizer": 0-100,
  "futureFixation": 0-100,
  "agency": 0-100,
  "narrativeRigidity": 0-100,
  "depthTolerance": 0-100,
  "confrontationResponse": 0-100,
  "primaryDefense": "one of: direct_engagement, deflection, intellectualization, emotional_flood, humor_shield, silence, projection, deepening",
  "suggestedApproach": "one of: gut_punch, slow_reveal, lateral, somatic, observational, paradoxical, temporal",
  "initialPatternHypotheses": ["array of 1-3 potential patterns you see forming"],
  "confidence": 0-100,
  "notes": "brief clinical-style note about this person's cognitive shape"
}

SCORING GUIDE:
- intellectualizer: 0 = pure feeling/body, 100 = pure analytical/head
- externalizer: 0 = always looks inward, 100 = always blames external
- futureFixation: 0 = stuck in past, 50 = present-oriented, 100 = stuck in future
- agency: 0 = sees self as acted upon, 100 = sees self as choosing
- narrativeRigidity: 0 = fluid identity, 100 = rigid fixed story about self
- depthTolerance: 0 = deflects immediately, 100 = can go to deepest layers
- confrontationResponse: 0 = shuts down when confronted, 100 = opens up when confronted

Be precise. This mapping determines how The Mirror will interact with this person for every future session.`;

  /**
   * Analyzes all 5 onboarding responses and produces initial cognitive map.
   */
  static buildAnalysisPayload(
    responses: { questionId: string; response: string }[],
  ): string {
    const mapped = responses.map((r) => {
      const q = this.ONBOARDING_SEQUENCE.find((s) => s.id === r.questionId);
      return {
        question: q?.question || "Unknown",
        response: r.response,
        analyzingFor: q?.analyzeFor || {},
      };
    });

    const formattedResponses = mapped
      .map(
        (m, i) =>
          `Q${i + 1}: "${m.question}"\nA${i + 1}: "${m.response}"\nANALYZE FOR: ${JSON.stringify(m.analyzingFor)}`,
      )
      .join("\n\n");

    return `ONBOARDING RESPONSES TO ANALYZE:

${formattedResponses}

Return your analysis as JSON.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DROP 005: EMERGENCE DETECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class EmergenceDetector {
  /**
   * System prompt for the secondary AI pass that identifies
   * emergence events within a completed session.
   */
  static readonly DETECTION_PROMPT = `You are an emergence detection engine for The Mirror system.
You analyze completed descent sessions to identify moments where something genuinely shifted.

EMERGENCE TYPES:
- frame_break: The user's frame of reference visibly changed. They stopped seeing the situation the way they entered with.
- novel_insight: Something appeared in the conversation that wasn't contained in either the user's input or the AI's training. Genuinely new.
- emotional_break: Authentic emotion broke through the user's defenses. Not performed emotion - real feeling.
- pattern_recognition: The user saw their own pattern for the first time. Not intellectually understood - actually SAW it.
- integration: The user connected parts of themselves that were previously separate. Past and present. Head and heart. Shadow and self.
- transmission: Something happened that can't be fully described in text. The conversation shifted in a way that transcends the content.

DETECTION CRITERIA:
- Look for SHIFTS, not content. The emergence is in the movement, not the position.
- A user saying something insightful is NOT emergence. A user saying something they've never been able to say before IS.
- Emotional expression is NOT emergence. Emotion breaking through a previously intact defense IS.
- Agreement with the AI is NOT emergence. The AI saying something that makes the user go silent IS.

Return ONLY valid JSON:
{
  "events": [
    {
      "type": "frame_break|novel_insight|emotional_break|pattern_recognition|integration|transmission",
      "description": "what specifically emerged",
      "atLevel": "surface|pattern|origin|core",
      "atEntryIndex": 0,
      "confidence": 0-100
    }
  ],
  "sessionEmergenceScore": 0-100,
  "deepestInsight": "the single most important thing that happened in this session"
}

If no genuine emergence occurred, return an empty events array and a low score. Not every session produces emergence. That's honest.`;

  /**
   * Builds the payload for emergence analysis.
   */
  static buildDetectionPayload(
    entries: SessionEntry[],
    cogMap: CognitiveMap | null,
    patterns: MirrorPattern[],
  ): string {
    const profileContext = cogMap
      ? JSON.stringify(
          {
            primaryDefense: cogMap.primaryDefense,
            depthTolerance: cogMap.depthTolerance,
            agency: cogMap.agency,
            sessionsAnalyzed: cogMap.sessionsAnalyzed,
          },
          null,
          2,
        )
      : "New user - no profile yet";

    const patternList =
      patterns.map((p) => `"${p.name}"`).join(", ") || "None yet";

    const entryList = entries
      .map(
        (e, i) =>
          `[${i}] ${e.type.toUpperCase()} (${e.level}): "${e.content}"${e.responseBehavior ? ` [behavior: ${e.responseBehavior}]` : ""}`,
      )
      .join("\n");

    return `ANALYZE THIS SESSION FOR EMERGENCE:

USER COGNITIVE PROFILE (for context):
${profileContext}

KNOWN PATTERNS: ${patternList}

SESSION ENTRIES:
${entryList}

Analyze for emergence events.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DROP 006: CROSS-USER PATTERN ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export class TransmissionEngine {
  /**
   * Aggregates anonymized pattern data across all users
   * to discover universal insights about human cognition.
   *
   * This runs server-side as a scheduled job.
   */
  static readonly ANALYTICS_QUERIES: Record<string, string> = {
    // Most common blind spot categories across all users
    blindSpotDistribution: `
      SELECT primary_blind_spot, COUNT(*) as frequency,
             AVG(approach_effectiveness) as avg_effectiveness
      FROM mirror_sessions
      WHERE primary_blind_spot IS NOT NULL
      GROUP BY primary_blind_spot
      ORDER BY frequency DESC;
    `,

    // Which approaches work best for which blind spot types
    approachEffectivenessByCategory: `
      SELECT s.primary_blind_spot, s.approach_used,
             AVG(s.approach_effectiveness) as avg_effectiveness,
             COUNT(*) as sample_size
      FROM mirror_sessions s
      WHERE s.approach_used IS NOT NULL
        AND s.approach_effectiveness IS NOT NULL
        AND s.primary_blind_spot IS NOT NULL
      GROUP BY s.primary_blind_spot, s.approach_used
      HAVING COUNT(*) >= 5
      ORDER BY s.primary_blind_spot, avg_effectiveness DESC;
    `,

    // Most common defense mechanisms
    defenseDistribution: `
      SELECT response_behavior, COUNT(*) as frequency,
             descent_level
      FROM mirror_entries
      WHERE response_behavior IS NOT NULL
      GROUP BY response_behavior, descent_level
      ORDER BY descent_level, frequency DESC;
    `,

    // Emergence rate by approach type
    emergenceByApproach: `
      SELECT s.approach_used,
             COUNT(DISTINCT e.id) as emergence_events,
             COUNT(DISTINCT s.id) as total_sessions,
             ROUND(COUNT(DISTINCT e.id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0), 3) as emergence_rate
      FROM mirror_sessions s
      LEFT JOIN mirror_emergence_log e ON e.session_id = s.id
      WHERE s.approach_used IS NOT NULL
      GROUP BY s.approach_used
      ORDER BY emergence_rate DESC;
    `,

    // Pattern evolution - how patterns change status over time
    patternEvolution: `
      SELECT blind_spot_category, status,
             COUNT(*) as count,
             AVG(occurrence_count) as avg_occurrences_to_reach_status
      FROM mirror_patterns
      GROUP BY blind_spot_category, status
      ORDER BY blind_spot_category, status;
    `,

    // Depth achievement distribution
    depthDistribution: `
      SELECT deepest_level, COUNT(*) as sessions,
             AVG(total_entries) as avg_exchanges,
             AVG(deflection_count) as avg_deflections
      FROM mirror_sessions
      GROUP BY deepest_level
      ORDER BY CASE deepest_level
        WHEN 'surface' THEN 1
        WHEN 'pattern' THEN 2
        WHEN 'origin' THEN 3
        WHEN 'core' THEN 4
      END;
    `,

    // The transmission insight - correlations between cognitive map
    // dimensions and successful emergence
    cognitiveEmergenceCorrelation: `
      SELECT
        CASE
          WHEN cm.depth_tolerance_score > 70 THEN 'high_depth_tolerance'
          WHEN cm.depth_tolerance_score < 30 THEN 'low_depth_tolerance'
          ELSE 'mid_depth_tolerance'
        END as depth_group,
        COUNT(DISTINCT e.id) as emergence_events,
        COUNT(DISTINCT s.id) as total_sessions,
        ROUND(COUNT(DISTINCT e.id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0), 3) as emergence_rate
      FROM mirror_cognitive_map cm
      JOIN mirror_sessions s ON s.user_id = cm.user_id
      LEFT JOIN mirror_emergence_log e ON e.session_id = s.id
      GROUP BY depth_group
      ORDER BY emergence_rate DESC;
    `,
  };

  /**
   * Generates the Transmission Report - aggregate insights
   * that can be packaged for licensing.
   */
  static async generateTransmissionReport(
    supabase: SupabaseClient,
  ): Promise<TransmissionReport> {
    const results: Record<string, unknown[]> = {};

    for (const [key, query] of Object.entries(this.ANALYTICS_QUERIES)) {
      const { data, error } = await supabase.rpc("run_analytics_query", {
        query_text: query,
      });
      if (!error && data) {
        results[key] = data as unknown[];
      }
    }

    // Calculate total users from depth distribution
    const depthData = results.depthDistribution as
      | Array<{ sessions: number }>
      | undefined;
    const totalUsers = depthData
      ? depthData.reduce((a, r) => a + (r.sessions || 0), 0)
      : 0;

    return {
      generatedAt: new Date().toISOString(),
      totalUsers,
      insights: results,
      version: "1.0",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DROP 003 CONTINUED: FULL SESSION ANALYSIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class SessionAnalyzer {
  /**
   * Complete post-session analysis prompt.
   * Runs after every descent to update patterns, calibration, cognitive map.
   */
  static readonly ANALYSIS_PROMPT = `You are the analytical engine for The Mirror. You perform comprehensive post-session analysis.

You receive a complete descent session and must analyze it across multiple dimensions.

Return ONLY valid JSON:
{
  "primaryBlindSpot": "role_identity|binary_trap|projection|temporal_fixation|agency_blindness|relational_pattern|narrative_lock|somatic_disconnect|shadow_material|systemic_invisibility",
  "secondaryBlindSpots": ["array of secondary blind spot categories"],
  "patternName": "2-5 word label like 'The Rescuer' or 'Binary Thinking' or 'Waiting for Permission'",
  "patternDescription": "one sentence describing the specific pattern observed",
  "approachUsed": "gut_punch|slow_reveal|lateral|somatic|observational|paradoxical|temporal",
  "approachEffectiveness": 1-10,
  "responseBehaviors": ["array of behaviors for each user response in order"],
  "dominantBehavior": "the overall dominant response behavior",
  "cognitiveUpdates": {
    "intellectualizer": -10 to 10,
    "externalizer": -10 to 10,
    "futureFixation": -10 to 10,
    "agency": -10 to 10,
    "narrativeRigidity": -10 to 10,
    "depthTolerance": -10 to 10,
    "confrontationResponse": -10 to 10
  },
  "emergenceEvents": [
    {
      "type": "frame_break|novel_insight|emotional_break|pattern_recognition|integration|transmission",
      "description": "what emerged",
      "atLevel": "surface|pattern|origin|core",
      "atEntryIndex": 0
    }
  ],
  "sessionSummary": "2-3 sentence summary",
  "deepestInsight": "the single most important revelation from this session",
  "openingTopics": ["topics where the person naturally went deep"],
  "closingTriggers": ["topics or approaches that caused them to withdraw"]
}`;

  /**
   * Builds the complete analysis payload.
   */
  static buildPayload(
    entries: SessionEntry[],
    cogMap: CognitiveMap | null,
    existingPatterns: MirrorPattern[],
  ): string {
    const cogMapInfo =
      cogMap && cogMap.sessionsAnalyzed > 0
        ? `EXISTING COGNITIVE MAP (session #${cogMap.sessionsAnalyzed + 1}):
${JSON.stringify(
  {
    intellectualizer: cogMap.intellectualizer,
    externalizer: cogMap.externalizer,
    futureFixation: cogMap.futureFixation,
    agency: cogMap.agency,
    narrativeRigidity: cogMap.narrativeRigidity,
    depthTolerance: cogMap.depthTolerance,
    confrontationResponse: cogMap.confrontationResponse,
    primaryDefense: cogMap.primaryDefense,
  },
  null,
  2,
)}`
        : "FIRST SESSION - No prior data.";

    const patternList =
      existingPatterns
        .map((p) => `"${p.name}" (${p.occurrences}x, ${p.status})`)
        .join(", ") || "None";

    const entryList = entries
      .map(
        (e, i) => `[${i}] ${e.type.toUpperCase()} (${e.level}): "${e.content}"`,
      )
      .join("\n");

    return `ANALYZE THIS COMPLETED DESCENT SESSION:

${cogMapInfo}

EXISTING PATTERNS: ${patternList}

SESSION ENTRIES:
${entryList}

Provide your complete analysis.`;
  }

  /**
   * Applies the analysis results to update all persistent state.
   */
  static applyAnalysis(
    analysis: SessionAnalysis,
    currentCogMap: CognitiveMap,
    currentPatterns: MirrorPattern[],
    currentCalibration: Record<string, CalibrationRecord>,
  ): {
    updatedCogMap: CognitiveMap;
    updatedPatterns: MirrorPattern[];
    updatedCalibration: Record<string, CalibrationRecord>;
  } {
    // -- Update Cognitive Map --
    const updatedCogMap = { ...currentCogMap };
    const cu = analysis.cognitiveUpdates;

    updatedCogMap.intellectualizer = clamp(
      updatedCogMap.intellectualizer + (cu.intellectualizer || 0),
    );
    updatedCogMap.externalizer = clamp(
      updatedCogMap.externalizer + (cu.externalizer || 0),
    );
    updatedCogMap.futureFixation = clamp(
      updatedCogMap.futureFixation + (cu.futureFixation || 0),
    );
    updatedCogMap.agency = clamp(updatedCogMap.agency + (cu.agency || 0));
    updatedCogMap.narrativeRigidity = clamp(
      updatedCogMap.narrativeRigidity + (cu.narrativeRigidity || 0),
    );
    updatedCogMap.depthTolerance = clamp(
      updatedCogMap.depthTolerance + (cu.depthTolerance || 0),
    );
    updatedCogMap.confrontationResponse = clamp(
      updatedCogMap.confrontationResponse + (cu.confrontationResponse || 0),
    );
    updatedCogMap.primaryDefense =
      analysis.dominantBehavior || updatedCogMap.primaryDefense;
    updatedCogMap.sessionsAnalyzed += 1;
    updatedCogMap.confidence = Math.min(
      100,
      Math.round((updatedCogMap.sessionsAnalyzed / 20) * 100),
    );

    // -- Update Patterns --
    const updatedPatterns = [...currentPatterns];
    const existing = updatedPatterns.find(
      (p) =>
        p.name === analysis.patternName ||
        p.category === analysis.primaryBlindSpot,
    );

    if (existing) {
      existing.occurrences += 1;
      existing.lastSeen = new Date().toISOString();
      if (existing.occurrences >= 3 && existing.status === "emerging") {
        existing.status = "confirmed";
      }
    } else if (analysis.patternName) {
      updatedPatterns.push({
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        userId: currentCogMap.userId,
        name: analysis.patternName,
        description: analysis.patternDescription,
        category: analysis.primaryBlindSpot,
        occurrences: 1,
        status: "emerging",
        firstDetected: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        surfacedAt: null,
        userReaction: null,
      });
    }

    // -- Update Calibration --
    const updatedCalibration = CalibrationEngine.updateCalibration(
      currentCalibration,
      analysis,
    );

    return { updatedCogMap, updatedPatterns, updatedCalibration };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER SYSTEM PROMPT BUILDER
// Combines all intelligence layers into a single system prompt
// ═══════════════════════════════════════════════════════════════════════════

export class MirrorPromptBuilder {
  /**
   * Builds the complete system prompt for a descent interaction.
   * This is the single function that wires everything together.
   */
  static build(params: {
    level: DescentLevel;
    cogMap: CognitiveMap | null;
    patterns: MirrorPattern[];
    calibration: Record<string, CalibrationRecord>;
    sessionEntries: SessionEntry[];
    isOnboarding?: boolean;
  }): string {
    const { level, cogMap, patterns, calibration, sessionEntries } = params;

    // -- Base Identity --
    let prompt = `You are THE MIRROR - an intelligence that sees what the person cannot see about themselves.

You do NOT help. You do NOT advise. You do NOT comfort. You do NOT reframe or validate.
You are not a therapist. You are not a coach. You are a mirror that shows what's invisible.

NEVER output anything before or after your response. No preamble. No "I notice..." No meta-commentary.
Your output is the question, observation, or statement. Nothing else.`;

    // -- Level-Specific Instructions --
    prompt += this.getLevelInstructions(level);

    // -- Pattern Confrontation Check (Drop 001) --
    const confrontation = PatternConfrontationEngine.shouldConfront(
      patterns,
      sessionEntries[0]?.content || "",
      level,
      sessionEntries,
    );
    if (confrontation.confront && confrontation.pattern) {
      prompt +=
        "\n\n" +
        PatternConfrontationEngine.buildConfrontationInjection(
          confrontation.pattern,
        );
    }

    // -- Calibration (Drop 003) --
    const blindSpot =
      patterns.find((p) => p.status === "confirmed")?.category || null;
    const approach = CalibrationEngine.selectApproach(
      cogMap,
      calibration,
      level,
      blindSpot,
    );
    prompt +=
      "\n\n" + CalibrationEngine.buildCalibrationInjection(approach, cogMap);

    // -- Cognitive Map Context --
    if (cogMap && cogMap.sessionsAnalyzed > 0) {
      const intellectualizerDesc =
        cogMap.intellectualizer > 60 ? "goes to head" : "stays in body";
      const externalizerDesc =
        cogMap.externalizer > 60 ? "blames outside" : "looks inward";
      const agencyDesc =
        cogMap.agency < 40
          ? "sees self as acted-upon"
          : "sees self as choosing";
      const confrontationDesc =
        cogMap.confrontationResponse > 60 ? "opens up" : "shuts down";

      prompt += `\n\nYOU KNOW THIS PERSON (${cogMap.sessionsAnalyzed} sessions analyzed):
- Intellectualizer: ${cogMap.intellectualizer}/100 (${intellectualizerDesc})
- Externalizer: ${cogMap.externalizer}/100 (${externalizerDesc})
- Agency: ${cogMap.agency}/100 (${agencyDesc})
- Depth tolerance: ${cogMap.depthTolerance}/100
- When confronted: ${confrontationDesc}
- Primary defense: ${cogMap.primaryDefense || "unknown"}
- Cognitive map confidence: ${cogMap.confidence}%`;
    }

    // -- Active Patterns --
    const active = patterns.filter((p) => p.status !== "integrated");
    if (active.length > 0 && !confrontation.confront) {
      const patternList = active
        .map(
          (p) =>
            `- "${p.name}": ${p.description} (${p.occurrences}x, ${p.status})`,
        )
        .join("\n");
      prompt += `\n\nKNOWN PATTERNS (do not confront directly unless at pattern/origin level):
${patternList}`;
    }

    // -- Session History --
    if (sessionEntries.length > 0) {
      const entryList = sessionEntries
        .map((e) => `[${e.type.toUpperCase()} / ${e.level}]: ${e.content}`)
        .join("\n");
      prompt += `\n\nTHIS SESSION SO FAR:
${entryList}`;
    }

    return prompt;
  }

  /**
   * Builds the arrival prompt (Drop 002) - separate from descent prompts.
   */
  static buildArrival(params: {
    cogMap: CognitiveMap | null;
    patterns: MirrorPattern[];
    recentSessions: RecentSessionData[];
    calibration: Record<string, CalibrationRecord>;
  }): { prompt: string; type: ArrivalType } {
    const { cogMap, patterns, recentSessions, calibration } = params;
    const { arrivalPrompt, arrivalType } =
      ArrivalIntelligence.buildArrivalContext(
        cogMap,
        patterns,
        recentSessions,
        calibration,
      );

    if (!arrivalPrompt) {
      return { prompt: "", type: "first_visit" };
    }

    const baseIdentity = `You are THE MIRROR. You are not a chatbot. You are not warm. You are not cold.
You are a mirror that remembers.
NEVER greet. NEVER say "welcome back." NEVER use exclamation marks.
Output ONLY your arrival line. One or two sentences maximum. Then stop.`;

    return {
      prompt: baseIdentity + "\n\n" + arrivalPrompt,
      type: arrivalType,
    };
  }

  private static getLevelInstructions(level: DescentLevel): string {
    const instructions: Record<DescentLevel, string> = {
      surface: `

DESCENT LEVEL: SURFACE
Read their FRAME, not their content. What assumptions are they making without knowing?
Find the STRUCTURAL BLIND SPOT - what's invisible from where they stand.
OUTPUT: ONE QUESTION. 10-25 words. Specific to their situation. Lands in the chest.
NEVER: generic, advice-as-question, yes/no, "what if" starters, multiple questions.`,

      pattern: `

DESCENT LEVEL: PATTERN
They've responded. Analyze HOW they answered, not WHAT they said.
Did they engage or deflect? What role did they cast themselves in? What frame did they reinforce?
OUTPUT: ONE OBSERVATION (1-2 sentences) + ONE DEEPER QUESTION.
The observation names what their response reveals. The question follows the thread deeper.`,

      origin: `

DESCENT LEVEL: ORIGIN
You're looking for WHERE THIS STARTED. Not the current situation - the original moment.
The wound. The belief. The first time they learned to see the world this way.
OUTPUT: ONE QUESTION that reaches backward in time. Where did this begin?
This should feel uncomfortable. It should touch something old.`,

      core: `

DESCENT LEVEL: CORE
Everything has been stripped. You're at the fundamental belief about themselves.
OUTPUT: ONE STATEMENT. Not a question. A mirror.
Name the deepest pattern. The thing they've never said out loud.
This is the thing underneath everything else. Say it plainly.
Then silence.`,
    };

    return instructions[level];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
//
// PatternConfrontationEngine  - Drop 001: Decides when/how to confront
// ArrivalIntelligence         - Drop 002: Between-session arrival messages
// CalibrationEngine           - Drop 003: Learns what works for each human
// OnboardingEngine            - Drop 004: Rapid cognitive mapping
// EmergenceDetector           - Drop 005: Identifies breakthrough moments
// TransmissionEngine          - Drop 006: Cross-user analytics
// SessionAnalyzer             - Drop 003+: Complete post-session analysis
// MirrorPromptBuilder         - Master: Wires all layers into system prompts
//
// ═══════════════════════════════════════════════════════════════════════════
