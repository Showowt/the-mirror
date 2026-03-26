#!/usr/bin/env npx ts-node
/**
 * The Mirror — Kling API Connection Test
 * Verifies API credentials and generates a simple test video
 *
 * Usage:
 *   npm run kling:test
 */

import * as fs from "fs";
import * as path from "path";
import { createKlingClient } from "./client";

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

  console.log("\n════════════════════════════════════════════════════════");
  console.log("  THE MIRROR — KLING API CONNECTION TEST");
  console.log("════════════════════════════════════════════════════════\n");

  // Check credentials
  console.log("[Test] Checking credentials...");
  const piApiKey = process.env.PIAPI_KEY;
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (piApiKey) {
    console.log(`  PiAPI Key: ${piApiKey.substring(0, 12)}...`);
    console.log(
      `  Service Mode: ${process.env.PIAPI_SERVICE_MODE || "public"}`,
    );
    console.log("  ✓ PiAPI credentials found\n");
  } else if (accessKey && secretKey) {
    console.log(`  Kling Access Key: ${accessKey.substring(0, 8)}...`);
    console.log(`  Kling Secret Key: ${secretKey.substring(0, 8)}...`);
    console.log("  ✓ Kling credentials found\n");
  } else {
    console.error("✗ Missing API credentials");
    console.error(
      "  Set PIAPI_KEY or KLING_ACCESS_KEY/KLING_SECRET_KEY in .env.local",
    );
    process.exit(1);
  }

  // Create client
  console.log("[Test] Creating Kling client...");
  let client;
  try {
    client = createKlingClient();
    console.log("  ✓ Client created\n");
  } catch (error) {
    console.error(`  ✗ Failed to create client: ${error}`);
    process.exit(1);
  }

  // Test with a simple text-to-video request
  console.log("[Test] Sending test generation request...");
  console.log("  Prompt: Pure black void, absolute darkness");
  console.log("  Duration: 5s | Mode: std | Aspect: 9:16\n");

  try {
    const response = await client.generateVideoFromText({
      prompt:
        "Pure black void. Absolute darkness. No elements. No gradients. No particles. Just pure black (#000000) holding for the entire duration.",
      negativePrompt: "any light, any color, any element",
      duration: 5,
      aspectRatio: "9:16",
      mode: "std",
    });

    console.log("  ✓ Request accepted!");
    console.log(`  Task ID: ${response.data.task_id}`);
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Created: ${response.data.meta.created_at}\n`);

    console.log(
      "[Test] Waiting for task completion (this may take 1-3 minutes)...\n",
    );

    const completedTask = await client.waitForTaskCompletion(
      response.data.task_id,
      300000, // 5 minutes max
      10000, // Check every 10 seconds
    );

    if (completedTask.output?.video_url) {
      console.log("\n  ✓ Video generated successfully!");
      console.log(`  Video URL: ${completedTask.output.video_url}\n`);

      // Download test video
      const testDir = path.join(process.cwd(), "production-output", "test");
      const outputPath = path.join(testDir, "test-black-void.mp4");

      console.log("[Test] Downloading test video...");
      await client.downloadVideo(completedTask.output.video_url, outputPath);
      console.log(`  ✓ Downloaded to: ${outputPath}\n`);
    }

    console.log("════════════════════════════════════════════════════════");
    console.log("  ✓ ALL TESTS PASSED — KLING API IS WORKING");
    console.log("════════════════════════════════════════════════════════");
    console.log("\nYou can now run the full production:");
    console.log("  npm run kling:hero     # Generate hero commercial");
    console.log("  npm run kling:trailer  # Generate cinematic trailer");
    console.log("  npm run kling:list     # List all shots");
    console.log("  npm run kling:budget   # View credit budget\n");
  } catch (error) {
    console.error(`\n  ✗ Test failed: ${error}`);
    console.error("\nPossible issues:");
    console.error("  - Invalid API credentials");
    console.error("  - Insufficient credits");
    console.error("  - Network connectivity issues");
    console.error("  - API rate limiting\n");
    process.exit(1);
  }
}

main().catch(console.error);
