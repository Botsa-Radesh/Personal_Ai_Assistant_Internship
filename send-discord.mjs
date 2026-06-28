import fs from "fs";
import { spawnSync } from "child_process";
import { config } from "./config.mjs";

const CHANNEL_ID = config.discord.channelId || "1516680999772094617";

const today = new Date().toISOString().split("T")[0];
const digestFile = `./data/digests/${today}.md`;

if (!fs.existsSync(digestFile)) {
  console.log("No digest found.");
  process.exit(1);
}

const digest = fs.readFileSync(digestFile, "utf8");

async function sendDiscordMessage(channelId, text) {
  const token = config.discord.token;
  if (!token) {
    throw new Error("DISCORD_TOKEN not set in environment configuration");
  }

  // Split message into 2000-character chunks for Discord's limits
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 2000) {
      chunks.push(remaining);
      break;
    }
    let splitIndex = remaining.lastIndexOf("\n", 2000);
    if (splitIndex === -1 || splitIndex < 1000) {
      splitIndex = remaining.lastIndexOf(" ", 2000);
    }
    if (splitIndex === -1) {
      splitIndex = 2000;
    }
    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trimStart();
  }

  for (const chunk of chunks) {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: chunk }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Discord API error (${res.status}): ${errText}`);
    }
  }
}

if (config.discord.token) {
  console.log("Directly sending digest to Discord via REST API...");
  try {
    await sendDiscordMessage(CHANNEL_ID, digest);
    console.log("✅ Digest sent to Discord");
  } catch (err) {
    console.error("❌ Failed to send digest:", err.message);
    process.exit(1);
  }
} else {
  console.log("DISCORD_TOKEN not set. Falling back to OpenClaw CLI...");
  const result = spawnSync(
    "openclaw",
    [
      "message",
      "send",
      "--channel",
      "discord",
      "--target",
      `channel:${CHANNEL_ID}`,
      "--message",
      digest
    ],
    { stdio: "inherit" }
  );
  if (result.status === 0) {
    console.log("✅ Digest sent to Discord");
  } else {
    process.exit(result.status || 1);
  }
}

