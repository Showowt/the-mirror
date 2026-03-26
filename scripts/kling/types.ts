/**
 * The Mirror — Kling AI Production Engine
 * Type definitions for cinematic video generation
 */

export interface Shot {
  id: string;
  name: string;
  deliverable: "hero" | "trailer" | "story" | "cutdown";
  number: number;
  duration: number; // seconds
  aspectRatio: "9:16" | "16:9" | "1:1";
  mode: "std" | "pro";
  version: "2.5" | "2.6";
  purpose: string;
  prompt: string;
  negativePrompt: string;
  imageUrl?: string; // For image-to-video
  imageTailUrl?: string; // End frame
  cameraControl?: CameraControl;
  generateStillFirst: boolean;
  criticalShot: boolean; // Generate multiple variants
  variants?: number; // Number of variants to generate for critical shots
}

export interface CameraControl {
  type: "simple" | "custom";
  config: {
    horizontal: number; // -10 to 10
    vertical: number;
    pan: number;
    tilt: number;
    roll: number;
    zoom: number; // -10 to 10
  };
}

export interface KlingTaskInput {
  prompt: string;
  negative_prompt?: string;
  cfg_scale?: string;
  duration: 5 | 10;
  aspect_ratio: "16:9" | "9:16" | "1:1";
  mode: "std" | "pro";
  version: string;
  image_url?: string;
  image_tail_url?: string;
  camera_control?: CameraControl;
  enable_audio?: boolean;
}

export interface KlingTask {
  task_id: string;
  model: string;
  task_type: string;
  status: "Pending" | "Processing" | "Completed" | "Failed" | "Staged";
  input: KlingTaskInput;
  output?: {
    video_url?: string;
    image_url?: string;
  };
  meta: {
    created_at: string;
    started_at?: string;
    ended_at?: string;
    usage?: {
      type: string;
      frozen: number;
      consume: number;
    };
  };
  error?: {
    code: number;
    message: string;
  };
}

export interface KlingResponse {
  code: number;
  data: KlingTask;
  message: string;
}

export interface ProductionStatus {
  shot: Shot;
  taskId?: string;
  status: "pending" | "generating" | "completed" | "failed";
  videoUrl?: string;
  localPath?: string;
  attempts: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface ProductionRun {
  id: string;
  deliverable: string;
  shots: ProductionStatus[];
  startedAt: string;
  completedAt?: string;
  totalCreditsUsed: number;
}

export interface TextCard {
  id: string;
  text: string;
  duration: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  horizontalRule: boolean;
  fadeInDuration: number;
}

export const VISUAL_DNA = {
  darkness: "70-90% black per frame",
  lightSources: [
    "phone screens",
    "single practical lamps",
    "rim light",
    "candle flicker",
  ],
  typography: "white serif on black",
  faceOcclusion: "phone glow illuminates half, shadow on other half",
  motion: "slow and deliberate, controlled dolly or static",
  soundtrack: "room tone, single breath, one piano note",
  feeling: "voyeuristic intimacy, private self-confrontation",
  references: {
    directors: [
      "David Fincher (Mindhunter)",
      "Denis Villeneuve (Arrival)",
      "Spike Jonze (Her)",
      "A24",
    ],
    dps: ["Roger Deakins", "Bradford Young", "Hoyte van Hoytema"],
    colorScience:
      "Bleach bypass, desaturated, cool midtones, warm highlights on skin. Kodak Vision3 500T",
  },
} as const;

export const DESIGN_TOKENS = {
  colors: {
    void: "#000000",
    warmWhite: "#F5F0EB",
    warmLamp: "3200K",
    coolAmbient: "6500K",
    phoneGlow: "5500K-6000K",
  },
  fonts: {
    serif: "Cormorant Garamond",
    body: "DM Sans",
  },
} as const;
