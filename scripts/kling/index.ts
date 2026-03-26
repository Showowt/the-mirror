/**
 * The Mirror — Kling AI Production Engine
 * Complete video generation pipeline for The Mirror campaign
 *
 * Architecture:
 *   - types.ts: Type definitions and visual DNA constants
 *   - shots.ts: Complete shot library with 14-dimension prompts
 *   - client.ts: Kling API client with JWT authentication
 *   - orchestrator.ts: Production runner with state management
 *   - test-api.ts: API connection tester
 *
 * Usage:
 *   npm run kling:test     # Test API connection
 *   npm run kling:budget   # View credit budget
 *   npm run kling:list     # List all shots
 *   npm run kling:hero     # Generate hero commercial
 *   npm run kling:trailer  # Generate cinematic trailer
 *   npm run kling:status   # Check production status
 *   npm run kling:resume   # Retry failed tasks
 *
 * Single Shot:
 *   npm run kling -- --shot hero-04-stillness --variants 5
 */

export * from "./types";
export * from "./shots";
export * from "./client";
