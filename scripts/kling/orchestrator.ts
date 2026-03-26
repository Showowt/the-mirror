#!/usr/bin/env npx ts-node
/**
 * The Mirror — Kling Production Orchestrator
 * Manages the complete cinematic video generation pipeline
 *
 * Usage:
 *   npx ts-node scripts/kling/orchestrator.ts --deliverable hero
 *   npx ts-node scripts/kling/orchestrator.ts --deliverable trailer
 *   npx ts-node scripts/kling/orchestrator.ts --shot hero-04-stillness --variants 5
 *   npx ts-node scripts/kling/orchestrator.ts --resume
 */

import * as fs from "fs";
import * as path from "path";
import { createKlingClient, KlingClient } from "./client";
import {
  HERO_SHOTS,
  TRAILER_SHOTS,
  ALL_SHOTS,
  calculateCreditBudget,
} from "./shots";
import { Shot, ProductionStatus, ProductionRun } from "./types";

// Configuration
const OUTPUT_DIR = path.join(process.cwd(), "production-output");
const STATE_FILE = path.join(OUTPUT_DIR, "production-state.json");
const MAX_CONCURRENT_TASKS = 3;
const POLL_INTERVAL_MS = 15000; // 15 seconds
const MAX_WAIT_PER_TASK_MS = 900000; // 15 minutes

interface OrchestratorState {
  currentRun: ProductionRun | null;
  completedTasks: Record<string, ProductionStatus>;
  failedTasks: Record<string, ProductionStatus>;
  pendingTasks: string[];
}

class ProductionOrchestrator {
  private client: KlingClient;
  private state: OrchestratorState;

  constructor() {
    this.client = createKlingClient();
    this.state = this.loadState();
  }

  /**
   * Load saved production state or create new
   */
  private loadState(): OrchestratorState {
    if (fs.existsSync(STATE_FILE)) {
      console.log("[Orchestrator] Loading existing production state...");
      const data = fs.readFileSync(STATE_FILE, "utf-8");
      return JSON.parse(data);
    }

    return {
      currentRun: null,
      completedTasks: {},
      failedTasks: {},
      pendingTasks: [],
    };
  }

  /**
   * Save current state to disk
   */
  private saveState(): void {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Display credit budget for a production run
   */
  displayBudget(): void {
    const budget = calculateCreditBudget();
    console.log("\n════════════════════════════════════════════════════════");
    console.log("  THE MIRROR — KLING PRODUCTION CREDIT BUDGET");
    console.log("════════════════════════════════════════════════════════\n");

    for (const item of budget.breakdown) {
      console.log(`  ${item.category}`);
      console.log(`    Images: ${item.images} × 1 credit = ${item.images}`);
      console.log(
        `    Videos: ${item.videos} × 20 credits = ${item.videos * 20}`,
      );
      console.log(`    Subtotal: ${item.credits} credits`);
      console.log("");
    }

    console.log("────────────────────────────────────────────────────────");
    console.log(`  TOTAL IMAGES: ${budget.stills}`);
    console.log(`  TOTAL VIDEOS: ${budget.videos}`);
    console.log(`  TOTAL CREDITS: ${budget.totalCredits}`);
    console.log("════════════════════════════════════════════════════════\n");
  }

  /**
   * Generate a single shot
   */
  async generateShot(
    shot: Shot,
    variantIndex?: number,
  ): Promise<ProductionStatus> {
    const id =
      variantIndex !== undefined ? `${shot.id}_v${variantIndex}` : shot.id;

    console.log(`\n[Orchestrator] Generating: ${shot.name} (${id})`);
    console.log(
      `  Mode: ${shot.mode} | Duration: ${shot.duration}s | Aspect: ${shot.aspectRatio}`,
    );
    console.log(
      `  Critical: ${shot.criticalShot} | Variants: ${shot.variants || 1}`,
    );

    const status: ProductionStatus = {
      shot,
      status: "generating",
      attempts: 1,
      createdAt: new Date().toISOString(),
    };

    try {
      const result = await this.client.generateFromShot(
        shot,
        OUTPUT_DIR,
        variantIndex,
      );

      status.taskId = result.taskId;
      status.status = "generating";

      console.log(`  Task ID: ${result.taskId}`);
      console.log(`  Initial Status: ${result.status}`);

      // Poll for completion
      const completedTask = await this.client.waitForTaskCompletion(
        result.taskId,
        MAX_WAIT_PER_TASK_MS,
        POLL_INTERVAL_MS,
      );

      if (completedTask.output?.video_url) {
        const filename =
          variantIndex !== undefined
            ? `${shot.id}_v${variantIndex}.mp4`
            : `${shot.id}.mp4`;
        const outputPath = path.join(OUTPUT_DIR, shot.deliverable, filename);

        await this.client.downloadVideo(
          completedTask.output.video_url,
          outputPath,
        );

        status.status = "completed";
        status.videoUrl = completedTask.output.video_url;
        status.localPath = outputPath;
        status.completedAt = new Date().toISOString();

        console.log(`  ✓ Completed: ${outputPath}`);
      } else {
        throw new Error("No video URL in completed task");
      }
    } catch (error) {
      status.status = "failed";
      status.error = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Failed: ${status.error}`);
    }

    // Save state after each shot
    if (status.status === "completed") {
      this.state.completedTasks[id] = status;
    } else {
      this.state.failedTasks[id] = status;
    }
    this.saveState();

    return status;
  }

  /**
   * Generate all variants for a shot
   */
  async generateShotWithVariants(shot: Shot): Promise<ProductionStatus[]> {
    const results: ProductionStatus[] = [];
    const variantCount = shot.criticalShot ? shot.variants || 1 : 1;

    for (let i = 0; i < variantCount; i++) {
      const variantIndex = variantCount > 1 ? i : undefined;
      const result = await this.generateShot(shot, variantIndex);
      results.push(result);
    }

    return results;
  }

  /**
   * Run production for a specific deliverable
   */
  async runDeliverable(
    deliverable: "hero" | "trailer",
  ): Promise<ProductionStatus[]> {
    const shots = deliverable === "hero" ? HERO_SHOTS : TRAILER_SHOTS;
    const results: ProductionStatus[] = [];

    console.log("\n════════════════════════════════════════════════════════");
    console.log(`  THE MIRROR — ${deliverable.toUpperCase()} PRODUCTION`);
    console.log("════════════════════════════════════════════════════════\n");
    console.log(`  Total Shots: ${shots.length}`);
    console.log(
      `  Critical Shots: ${shots.filter((s) => s.criticalShot).length}`,
    );
    console.log("");

    // Initialize production run
    this.state.currentRun = {
      id: `${deliverable}-${Date.now()}`,
      deliverable,
      shots: [],
      startedAt: new Date().toISOString(),
      totalCreditsUsed: 0,
    };

    for (const shot of shots) {
      // Skip if already completed
      if (this.state.completedTasks[shot.id]) {
        console.log(`[Orchestrator] Skipping ${shot.id} (already completed)`);
        continue;
      }

      const shotResults = await this.generateShotWithVariants(shot);
      results.push(...shotResults);
      this.state.currentRun.shots.push(...shotResults);
    }

    // Finalize run
    this.state.currentRun.completedAt = new Date().toISOString();
    this.saveState();

    // Print summary
    this.printSummary(results);

    return results;
  }

  /**
   * Generate a specific shot by ID
   */
  async runSingleShot(
    shotId: string,
    variants?: number,
  ): Promise<ProductionStatus[]> {
    const shot = ALL_SHOTS.find((s) => s.id === shotId);

    if (!shot) {
      throw new Error(`Shot not found: ${shotId}`);
    }

    // Override variant count if specified
    if (variants !== undefined) {
      shot.variants = variants;
      shot.criticalShot = variants > 1;
    }

    console.log("\n════════════════════════════════════════════════════════");
    console.log(`  THE MIRROR — SINGLE SHOT GENERATION`);
    console.log("════════════════════════════════════════════════════════\n");
    console.log(`  Shot: ${shot.name} (${shot.id})`);
    console.log(`  Variants: ${shot.variants || 1}`);
    console.log("");

    const results = await this.generateShotWithVariants(shot);
    this.printSummary(results);

    return results;
  }

  /**
   * Resume failed or pending tasks
   */
  async resume(): Promise<ProductionStatus[]> {
    const results: ProductionStatus[] = [];
    const failedIds = Object.keys(this.state.failedTasks);

    if (failedIds.length === 0) {
      console.log("[Orchestrator] No failed tasks to resume.");
      return results;
    }

    console.log("\n════════════════════════════════════════════════════════");
    console.log("  THE MIRROR — RESUMING FAILED TASKS");
    console.log("════════════════════════════════════════════════════════\n");
    console.log(`  Failed Tasks: ${failedIds.length}`);
    console.log("");

    for (const id of failedIds) {
      const failedStatus = this.state.failedTasks[id];
      const shot = failedStatus.shot;

      // Extract variant index from ID if present
      const variantMatch = id.match(/_v(\d+)$/);
      const variantIndex = variantMatch
        ? parseInt(variantMatch[1], 10)
        : undefined;

      // Retry
      console.log(`[Orchestrator] Retrying: ${shot.name} (${id})`);
      const result = await this.generateShot(shot, variantIndex);

      if (result.status === "completed") {
        // Remove from failed tasks
        delete this.state.failedTasks[id];
        this.saveState();
      }

      results.push(result);
    }

    this.printSummary(results);
    return results;
  }

  /**
   * Print production summary
   */
  private printSummary(results: ProductionStatus[]): void {
    const completed = results.filter((r) => r.status === "completed");
    const failed = results.filter((r) => r.status === "failed");

    console.log("\n════════════════════════════════════════════════════════");
    console.log("  PRODUCTION SUMMARY");
    console.log("════════════════════════════════════════════════════════\n");
    console.log(`  Completed: ${completed.length}`);
    console.log(`  Failed: ${failed.length}`);
    console.log(`  Total: ${results.length}`);

    if (completed.length > 0) {
      console.log("\n  Completed Files:");
      for (const r of completed) {
        console.log(`    ✓ ${r.localPath}`);
      }
    }

    if (failed.length > 0) {
      console.log("\n  Failed Tasks:");
      for (const r of failed) {
        console.log(`    ✗ ${r.shot.id}: ${r.error}`);
      }
      console.log("\n  Run with --resume to retry failed tasks.");
    }

    console.log("\n════════════════════════════════════════════════════════\n");
  }

  /**
   * List all shots
   */
  listShots(): void {
    console.log("\n════════════════════════════════════════════════════════");
    console.log("  THE MIRROR — SHOT LIST");
    console.log("════════════════════════════════════════════════════════\n");

    console.log("  HERO COMMERCIAL (8 shots):");
    for (const shot of HERO_SHOTS) {
      const status = this.state.completedTasks[shot.id]
        ? "✓"
        : this.state.failedTasks[shot.id]
          ? "✗"
          : "○";
      const critical = shot.criticalShot ? `[${shot.variants}v]` : "";
      console.log(`    ${status} ${shot.number}. ${shot.name} ${critical}`);
      console.log(`       ID: ${shot.id}`);
    }

    console.log("\n  CINEMATIC TRAILER (12 shots):");
    for (const shot of TRAILER_SHOTS) {
      const status = this.state.completedTasks[shot.id]
        ? "✓"
        : this.state.failedTasks[shot.id]
          ? "✗"
          : "○";
      const critical = shot.criticalShot ? `[${shot.variants}v]` : "";
      console.log(`    ${status} ${shot.number}. ${shot.name} ${critical}`);
      console.log(`       ID: ${shot.id}`);
    }

    console.log("\n════════════════════════════════════════════════════════\n");
  }

  /**
   * Get production status
   */
  getStatus(): void {
    const completed = Object.keys(this.state.completedTasks).length;
    const failed = Object.keys(this.state.failedTasks).length;
    const total = ALL_SHOTS.length;

    console.log("\n════════════════════════════════════════════════════════");
    console.log("  THE MIRROR — PRODUCTION STATUS");
    console.log("════════════════════════════════════════════════════════\n");
    console.log(`  Completed: ${completed}/${total}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Remaining: ${total - completed}`);

    if (this.state.currentRun) {
      console.log(`\n  Current Run: ${this.state.currentRun.id}`);
      console.log(`  Started: ${this.state.currentRun.startedAt}`);
    }

    console.log("\n════════════════════════════════════════════════════════\n");
  }
}

// CLI Interface
async function main() {
  // Load environment variables
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  }

  const args = process.argv.slice(2);
  const orchestrator = new ProductionOrchestrator();

  // Parse arguments
  let command = "help";
  let deliverable: "hero" | "trailer" | undefined;
  let shotId: string | undefined;
  let variants: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--deliverable" && args[i + 1]) {
      command = "deliverable";
      deliverable = args[i + 1] as "hero" | "trailer";
      i++;
    } else if (args[i] === "--shot" && args[i + 1]) {
      command = "shot";
      shotId = args[i + 1];
      i++;
    } else if (args[i] === "--variants" && args[i + 1]) {
      variants = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--resume") {
      command = "resume";
    } else if (args[i] === "--status") {
      command = "status";
    } else if (args[i] === "--list") {
      command = "list";
    } else if (args[i] === "--budget") {
      command = "budget";
    } else if (args[i] === "--help" || args[i] === "-h") {
      command = "help";
    }
  }

  // Execute command
  switch (command) {
    case "deliverable":
      if (!deliverable) {
        console.error("Error: --deliverable requires 'hero' or 'trailer'");
        process.exit(1);
      }
      await orchestrator.runDeliverable(deliverable);
      break;

    case "shot":
      if (!shotId) {
        console.error("Error: --shot requires a shot ID");
        process.exit(1);
      }
      await orchestrator.runSingleShot(shotId, variants);
      break;

    case "resume":
      await orchestrator.resume();
      break;

    case "status":
      orchestrator.getStatus();
      break;

    case "list":
      orchestrator.listShots();
      break;

    case "budget":
      orchestrator.displayBudget();
      break;

    case "help":
    default:
      console.log(`
════════════════════════════════════════════════════════
  THE MIRROR — KLING PRODUCTION ORCHESTRATOR
════════════════════════════════════════════════════════

Usage:
  npx ts-node scripts/kling/orchestrator.ts [command]

Commands:
  --deliverable hero|trailer   Generate all shots for a deliverable
  --shot <id>                  Generate a specific shot by ID
  --variants <n>               Number of variants (use with --shot)
  --resume                     Retry failed tasks
  --status                     Show production status
  --list                       List all shots with status
  --budget                     Display credit budget
  --help                       Show this help message

Examples:
  # Generate hero commercial
  npx ts-node scripts/kling/orchestrator.ts --deliverable hero

  # Generate trailer
  npx ts-node scripts/kling/orchestrator.ts --deliverable trailer

  # Generate specific shot with 5 variants
  npx ts-node scripts/kling/orchestrator.ts --shot hero-04-stillness --variants 5

  # Resume failed tasks
  npx ts-node scripts/kling/orchestrator.ts --resume

  # Check status
  npx ts-node scripts/kling/orchestrator.ts --status

════════════════════════════════════════════════════════
      `);
  }
}

main().catch(console.error);
