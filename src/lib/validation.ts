// ═══════════════════════════════════════════════════════════════
// THE MIRROR — INPUT VALIDATION SCHEMAS (ZOD)
// ZDBS Security: All API inputs validated before processing
// ═══════════════════════════════════════════════════════════════

import { z } from "zod";

// ═══ MIRROR API SCHEMAS ═══

export const MirrorV3RequestSchema = z.object({
  system: z
    .string()
    .min(50, "System prompt too short")
    .max(10000, "System prompt too long"),
  content: z
    .string()
    .min(10, "Please share more about what you're carrying")
    .max(5000, "Message too long"),
});

export const MirrorRequestSchema = z.object({
  level: z.enum(["question", "observation", "deeper", "card"]),
  situation: z
    .string()
    .min(20, "Tell me more — at least 20 characters")
    .max(3000, "That's a lot to carry — please keep it under 3000 characters"),
  question1: z.string().optional(),
  answer: z.string().optional(),
  observation: z.string().optional(),
  question2: z.string().optional(),
  lang: z.enum(["en", "es"]).optional().default("en"),
});

// ═══ MIRROR PROTOCOL API SCHEMAS ═══

export const DescentLevelSchema = z.enum([
  "surface",
  "pattern",
  "origin",
  "core",
]);

export const CognitiveMapSchema = z
  .object({
    intellectualizer: z.number().min(0).max(100).default(50),
    externalizer: z.number().min(0).max(100).default(50),
    futureFixator: z.number().min(0).max(100).default(50),
    narrativeRigidity: z.number().min(0).max(100).default(50),
    depthTolerance: z.number().min(0).max(100).default(50),
    confrontationResponse: z.number().min(0).max(100).default(50),
    agencyLevel: z.number().min(0).max(100).default(50),
  })
  .nullable()
  .optional();

export const PatternSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(["emerging", "confirmed", "integrated"]).default("emerging"),
});

export const MirrorProtocolReflectSchema = z.object({
  userInput: z
    .string()
    .min(5, "Share at least 5 characters")
    .max(5000, "Please keep it under 5000 characters"),
  level: DescentLevelSchema.optional().default("surface"),
  cognitiveMap: CognitiveMapSchema,
  patterns: z.array(PatternSchema).optional().default([]),
  externalUserId: z.string().max(255).optional(),
});

export const MirrorProtocolAnalyzeSchema = z.object({
  sessionEntries: z
    .array(
      z.object({
        role: z.enum(["mirror", "user"]),
        content: z.string().min(1).max(5000),
        level: DescentLevelSchema.optional(),
        timestamp: z.string().optional(),
      }),
    )
    .min(1, "At least one entry required")
    .max(100, "Too many entries"),
  cognitiveMap: CognitiveMapSchema,
  patterns: z.array(PatternSchema).optional().default([]),
  externalUserId: z.string().max(255).optional(),
});

export const MirrorProtocolOnboardSchema = z.object({
  responses: z
    .array(
      z.object({
        questionId: z.string().min(1).max(50),
        answer: z.string().min(10).max(2000),
      }),
    )
    .min(1)
    .max(10),
  externalUserId: z.string().max(255).optional(),
});

export const MirrorProtocolCalibrateSchema = z.object({
  cognitiveMap: CognitiveMapSchema,
  patterns: z.array(PatternSchema).optional().default([]),
  calibrationHistory: z
    .record(
      z.string(),
      z.object({
        timesUsed: z.number().min(0),
        effectivenessScore: z.number().min(0).max(100),
        avgDepthReached: z.number().min(0).max(4),
      }),
    )
    .optional()
    .default({}),
});

// ═══ TRANSCRIPTION SCHEMA ═══

export const TranscribeRequestSchema = z.object({
  language: z
    .enum(["en", "es", "zh", "pt", "hi", "ar", "fr", "de", "ja", "ko", "auto"])
    .optional()
    .default("auto"),
});

// ═══ HELPER FUNCTIONS ═══

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; error: string; details: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Create human-readable error message
  const firstError = result.error.issues[0];
  const errorMessage = firstError?.message || "Invalid request";

  return {
    success: false,
    error: errorMessage,
    details: result.error.issues,
  };
}

// Type exports
export type MirrorV3Request = z.infer<typeof MirrorV3RequestSchema>;
export type MirrorRequest = z.infer<typeof MirrorRequestSchema>;
export type MirrorProtocolReflect = z.infer<typeof MirrorProtocolReflectSchema>;
export type MirrorProtocolAnalyze = z.infer<typeof MirrorProtocolAnalyzeSchema>;
export type MirrorProtocolOnboard = z.infer<typeof MirrorProtocolOnboardSchema>;
export type MirrorProtocolCalibrate = z.infer<
  typeof MirrorProtocolCalibrateSchema
>;
export type DescentLevel = z.infer<typeof DescentLevelSchema>;
export type CognitiveMap = z.infer<typeof CognitiveMapSchema>;
export type Pattern = z.infer<typeof PatternSchema>;
