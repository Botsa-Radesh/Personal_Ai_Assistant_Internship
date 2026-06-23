#!/usr/bin/env node
/**
 * Daily Report - Scheduled delivery to Discord at 8 AM.
 * Run via cron: 0 8 * * * cd /mnt/c/Users/botsa/email-collector && node scripts/daily-report-cron.mjs
 */

import { execSync } from "child_process";
import { getDailyReport } from "../agents/summary-agent.mjs";

const CHANNEL_ID = "1516680999772094617";

async function sendDailyReport() {
  console.log(`[${new Date().toISOString()}] Generating daily report...`);

  try {
    const report = await getDailyReport();

    // Send via OpenClaw
    const escaped = report.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    execSync(
      `openclaw message send --channel discord --target "channel:${CHANNEL_ID}" --message "${escaped}"`,
      {
        stdio: "inherit",
        timeout: 15000,
        env: { ...process.env, PATH: `/home/radesh/.bun/bin:/usr/bin:/bin:${process.env.PATH || ""}` },
      }
    );

    console.log("✅ Daily report sent to Discord");
  } catch (err) {
    console.error("Failed to send daily report:", err.message);

    // Fallback: try a simpler message
    try {
      execSync(
        `openclaw message send --channel discord --target "channel:${CHANNEL_ID}" --message "⚠️ Daily report generation failed. Ask me 'give me my daily report' to try manually."`,
        { stdio: "ignore", timeout: 10000 }
      );
    } catch {}
  }
}

await sendDailyReport();
