#!/usr/bin/env node
/**
 * Process a meeting audio recording.
 * 
 * Usage:
 *   node scripts/process-meeting.mjs <audio-file> [--title "Meeting Title"] [--participants "Alice, Bob"] [--platform "Google Meet"]
 * 
 * Examples:
 *   node scripts/process-meeting.mjs recording.mp3 --title "Sprint Planning" --participants "Alice, Bob, Charlie"
 *   node scripts/process-meeting.mjs meeting.webm --title "1:1 with Manager" --platform "Teams"
 * 
 * Supported formats: .mp3, .wav, .ogg, .m4a, .webm, .opus
 * 
 * Pipeline:
 *   Audio → Gemini Transcription → Gemini Analysis → GBrain Storage
 */

import fs from "fs";
import { processMeetingAudio } from "../agents/meeting-processor.mjs";

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help") {
  console.log(`
Meeting Processor - Transcribe and analyze meeting recordings

Usage:
  node scripts/process-meeting.mjs <audio-file> [options]

Options:
  --title <title>           Meeting title
  --participants <names>    Comma-separated participant names
  --platform <platform>     Platform (Google Meet, Teams, Zoom)
  --date <date>             Meeting date (ISO format or readable)

Examples:
  node scripts/process-meeting.mjs recording.mp3 --title "Sprint Planning"
  node scripts/process-meeting.mjs meeting.webm --title "1:1" --participants "Alice, Bob"
  `);
  process.exit(0);
}

const audioFile = args[0];

if (!fs.existsSync(audioFile)) {
  console.error(`Error: File not found: ${audioFile}`);
  process.exit(1);
}

// Parse options
const metadata = {
  title: "",
  participants: "",
  platform: "",
  date: new Date().toISOString(),
};

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--title" && args[i + 1]) {
    metadata.title = args[++i];
  } else if (args[i] === "--participants" && args[i + 1]) {
    metadata.participants = args[++i];
  } else if (args[i] === "--platform" && args[i + 1]) {
    metadata.platform = args[++i];
  } else if (args[i] === "--date" && args[i + 1]) {
    metadata.date = args[++i];
  }
}

console.log("🎤 Meeting Processor");
console.log("=".repeat(50));
console.log(`File: ${audioFile}`);
console.log(`Title: ${metadata.title || "(will be auto-detected)"}`);
console.log(`Participants: ${metadata.participants || "(will be auto-detected)"}`);
console.log(`Platform: ${metadata.platform || "Unknown"}`);
console.log("=".repeat(50));
console.log("");

try {
  const result = await processMeetingAudio(audioFile, metadata);

  console.log("\n✅ Meeting processed successfully!\n");
  console.log("=".repeat(50));
  console.log(`Meeting ID: ${result.id}`);
  console.log(`\n## Summary`);
  console.log(result.analysis.summary);
  console.log(`\n## Action Items`);
  (result.analysis.actionItems || []).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item}`);
  });
  console.log(`\n## Decisions`);
  (result.analysis.decisions || []).forEach((d, i) => {
    console.log(`  ${i + 1}. ${d}`);
  });
  console.log(`\n## Topics`);
  (result.analysis.topics || []).forEach(t => {
    console.log(`  - ${t}`);
  });
  console.log("\n" + "=".repeat(50));
  console.log("✅ Stored in GBrain for future meeting preparation.");
} catch (err) {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
}
