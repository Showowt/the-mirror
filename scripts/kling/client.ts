/**
 * The Mirror — Kling AI API Client
 * Supports both PiAPI (recommended) and Official Kling API
 *
 * PiAPI Endpoints:
 * - Create Task: POST /api/v1/task
 * - Get Task: GET /api/v1/task/{task_id}
 *
 * Official Kling Endpoints:
 * - Text-to-Video: POST /v1/videos/text2video
 * - Image-to-Video: POST /v1/videos/image2video
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Shot, KlingTask, KlingResponse, CameraControl } from "./types";

// Configuration
const PIAPI_BASE_URL = "https://api.piapi.ai";
const KLING_API_BASE_URL = "https://api.klingai.com";
const TOKEN_EXPIRATION_SECONDS = 1800;
const TOKEN_BUFFER_SECONDS = 300;

type ApiProvider = "piapi" | "kling";

interface KlingConfig {
  provider: ApiProvider;
  // PiAPI config
  piApiKey?: string;
  serviceMode?: "public" | "private"; // private = host-your-account
  // Official Kling config
  accessKey?: string;
  secretKey?: string;
}

interface GenerateVideoOptions {
  prompt: string;
  negativePrompt?: string;
  duration: 5 | 10;
  aspectRatio: "16:9" | "9:16" | "1:1";
  mode: "std" | "pro";
  model?: string;
  cfgScale?: number;
  cameraControl?: CameraControl;
  imageUrl?: string;
  imageTailUrl?: string;
  callbackUrl?: string;
}

interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  model?: string;
  imageCount?: number;
}

// PiAPI Response Types
interface PiApiResponse {
  code: number;
  data: PiApiTask;
  message: string;
}

interface PiApiTask {
  task_id: string;
  model: string;
  task_type: string;
  status: "Pending" | "Processing" | "Completed" | "Failed" | "Staged";
  input: Record<string, unknown>;
  output?: {
    video_url?: string;
    works?: Array<{
      video?: { resource?: { resource?: string } };
    }>;
  };
  meta: {
    created_at: string;
    started_at?: string;
    ended_at?: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

class KlingClient {
  private provider: ApiProvider;
  private piApiKey?: string;
  private serviceMode: "public" | "private";
  private accessKey?: string;
  private secretKey?: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: KlingConfig) {
    this.provider = config.provider;
    this.piApiKey = config.piApiKey;
    this.serviceMode = config.serviceMode || "public";
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
  }

  /**
   * Generate JWT token for official Kling API
   */
  private generateKlingToken(): string {
    if (!this.accessKey || !this.secretKey) {
      throw new Error("Missing Kling credentials");
    }

    const now = Math.floor(Date.now() / 1000);

    if (this.cachedToken && this.tokenExpiresAt > now + TOKEN_BUFFER_SECONDS) {
      return this.cachedToken;
    }

    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      iss: this.accessKey,
      exp: now + TOKEN_EXPIRATION_SECONDS,
      nbf: now - 5,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(signatureInput)
      .digest("base64url");

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    this.cachedToken = token;
    this.tokenExpiresAt = now + TOKEN_EXPIRATION_SECONDS;

    return token;
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Make request to PiAPI
   */
  private async piApiRequest<T>(
    method: "GET" | "POST",
    endpoint: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.piApiKey) {
      throw new Error("Missing PiAPI key");
    }

    const url = `${PIAPI_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "x-api-key": this.piApiKey,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    console.log(`[PiAPI] ${method} ${endpoint}`);

    const response = await fetch(url, options);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`PiAPI Error: ${response.status} - ${text}`);
    }

    return JSON.parse(text) as T;
  }

  /**
   * Make request to official Kling API
   */
  private async klingRequest<T>(
    method: "GET" | "POST",
    endpoint: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const token = this.generateKlingToken();
    const url = `${KLING_API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    console.log(`[Kling API] ${method} ${endpoint}`);

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kling API Error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Generate video from text prompt
   */
  async generateVideoFromText(
    options: GenerateVideoOptions,
  ): Promise<{ taskId: string; status: string }> {
    if (this.provider === "piapi") {
      const body = {
        model: "kling",
        task_type: "video_generation",
        input: {
          prompt: options.prompt,
          negative_prompt: options.negativePrompt || "",
          cfg_scale: options.cfgScale?.toString() || "0.5",
          duration: options.duration,
          aspect_ratio: options.aspectRatio,
          mode: options.mode,
          version: "2.1", // Use stable version
        },
        config: {
          service_mode: this.serviceMode,
        },
      };

      if (options.cameraControl) {
        (body.input as Record<string, unknown>).camera_control =
          options.cameraControl;
      }

      const response = await this.piApiRequest<PiApiResponse>(
        "POST",
        "/api/v1/task",
        body,
      );

      return {
        taskId: response.data.task_id,
        status: response.data.status,
      };
    } else {
      const body: Record<string, unknown> = {
        model: options.model || "kling-v1",
        prompt: options.prompt,
        duration: options.duration.toString(),
        aspect_ratio: options.aspectRatio,
        mode: options.mode,
      };

      if (options.negativePrompt) body.negative_prompt = options.negativePrompt;
      if (options.cfgScale !== undefined) body.cfg_scale = options.cfgScale;
      if (options.cameraControl) body.camera_control = options.cameraControl;

      const response = await this.klingRequest<KlingResponse>(
        "POST",
        "/v1/videos/text2video",
        body,
      );

      return {
        taskId: response.data.task_id,
        status: response.data.status,
      };
    }
  }

  /**
   * Generate video from image
   */
  async generateVideoFromImage(
    options: GenerateVideoOptions & { imageUrl: string },
  ): Promise<{ taskId: string; status: string }> {
    if (this.provider === "piapi") {
      const body = {
        model: "kling",
        task_type: "video_generation",
        input: {
          prompt: options.prompt,
          negative_prompt: options.negativePrompt || "",
          image_url: options.imageUrl,
          image_tail_url: options.imageTailUrl,
          cfg_scale: options.cfgScale?.toString() || "0.5",
          duration: options.duration,
          aspect_ratio: options.aspectRatio,
          mode: options.mode,
          version: "2.1",
        },
        config: {
          service_mode: this.serviceMode,
        },
      };

      const response = await this.piApiRequest<PiApiResponse>(
        "POST",
        "/api/v1/task",
        body,
      );

      return {
        taskId: response.data.task_id,
        status: response.data.status,
      };
    } else {
      const body: Record<string, unknown> = {
        model: options.model || "kling-v1",
        image: options.imageUrl,
        prompt: options.prompt,
        duration: options.duration.toString(),
        aspect_ratio: options.aspectRatio,
        mode: options.mode,
      };

      if (options.negativePrompt) body.negative_prompt = options.negativePrompt;
      if (options.imageTailUrl) body.tail_image = options.imageTailUrl;

      const response = await this.klingRequest<KlingResponse>(
        "POST",
        "/v1/videos/image2video",
        body,
      );

      return {
        taskId: response.data.task_id,
        status: response.data.status,
      };
    }
  }

  /**
   * Query task status
   */
  async getTaskStatus(taskId: string): Promise<{
    status: "Pending" | "Processing" | "Completed" | "Failed" | "Staged";
    videoUrl?: string;
    error?: string;
  }> {
    if (this.provider === "piapi") {
      const response = await this.piApiRequest<PiApiResponse>(
        "GET",
        `/api/v1/task/${taskId}`,
      );

      let videoUrl: string | undefined;

      // PiAPI returns video URL in different places
      if (response.data.output?.video_url) {
        videoUrl = response.data.output.video_url;
      } else if (response.data.output?.works?.[0]?.video?.resource?.resource) {
        videoUrl = response.data.output.works[0].video.resource.resource;
      }

      return {
        status: response.data.status,
        videoUrl,
        error: response.data.error?.message,
      };
    } else {
      const response = await this.klingRequest<KlingResponse>(
        "GET",
        `/v1/videos/text2video/${taskId}`,
      );

      return {
        status: response.data.status,
        videoUrl: response.data.output?.video_url,
        error: response.data.error?.message,
      };
    }
  }

  /**
   * Poll for task completion
   */
  async waitForTaskCompletion(
    taskId: string,
    maxWaitMs: number = 600000,
    pollIntervalMs: number = 10000,
  ): Promise<{ videoUrl: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getTaskStatus(taskId);

      console.log(`[${this.provider}] Task ${taskId}: ${result.status}`);

      if (result.status === "Completed") {
        if (!result.videoUrl) {
          throw new Error("Task completed but no video URL found");
        }
        return { videoUrl: result.videoUrl };
      }

      if (result.status === "Failed") {
        throw new Error(`Task failed: ${result.error || "Unknown error"}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Task ${taskId} timed out after ${maxWaitMs}ms`);
  }

  /**
   * Download video from URL
   */
  async downloadVideo(videoUrl: string, outputPath: string): Promise<string> {
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`[Download] Saved to ${outputPath}`);

    return outputPath;
  }

  /**
   * Generate video from shot definition
   */
  async generateFromShot(
    shot: Shot,
    outputDir: string,
    variantIndex?: number,
  ): Promise<{
    taskId: string;
    status: string;
    localPath: string;
  }> {
    const variantSuffix = variantIndex !== undefined ? `_v${variantIndex}` : "";
    const filename = `${shot.id}${variantSuffix}.mp4`;
    const outputPath = path.join(outputDir, shot.deliverable, filename);

    let result: { taskId: string; status: string };

    if (shot.imageUrl) {
      result = await this.generateVideoFromImage({
        prompt: shot.prompt,
        negativePrompt: shot.negativePrompt,
        duration: shot.duration as 5 | 10,
        aspectRatio: shot.aspectRatio,
        mode: shot.mode,
        imageUrl: shot.imageUrl,
        imageTailUrl: shot.imageTailUrl,
        cameraControl: shot.cameraControl,
      });
    } else {
      result = await this.generateVideoFromText({
        prompt: shot.prompt,
        negativePrompt: shot.negativePrompt,
        duration: shot.duration as 5 | 10,
        aspectRatio: shot.aspectRatio,
        mode: shot.mode,
        cameraControl: shot.cameraControl,
      });
    }

    return {
      taskId: result.taskId,
      status: result.status,
      localPath: outputPath,
    };
  }

  /**
   * Get provider name
   */
  getProvider(): ApiProvider {
    return this.provider;
  }
}

/**
 * Create a configured Kling client from environment variables
 */
export function createKlingClient(): KlingClient {
  // Check for PiAPI first (preferred)
  const piApiKey = process.env.PIAPI_KEY;
  if (piApiKey) {
    const serviceMode =
      (process.env.PIAPI_SERVICE_MODE as "public" | "private") || "public";
    console.log(`[Client] Using PiAPI (${serviceMode} mode)`);
    return new KlingClient({
      provider: "piapi",
      piApiKey,
      serviceMode,
    });
  }

  // Fall back to official Kling API
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (accessKey && secretKey) {
    console.log("[Client] Using official Kling API");
    return new KlingClient({
      provider: "kling",
      accessKey,
      secretKey,
    });
  }

  throw new Error(
    "Missing API credentials. Set PIAPI_KEY or KLING_ACCESS_KEY/KLING_SECRET_KEY",
  );
}

export { KlingClient };
export type {
  KlingConfig,
  GenerateVideoOptions,
  GenerateImageOptions,
  ApiProvider,
};
