#!/usr/bin/env python3
"""Extract credentials from OpenClaw to populate .env file."""
import json
import os

# Get Gemini API key
auth_path = os.path.expanduser("~/.openclaw/agents/main/agent/auth-profiles.json")
with open(auth_path) as f:
    auth = json.load(f)

gemini_key = auth["profiles"]["google:default"]["key"]

# Get Discord token from OpenClaw config
config_path = os.path.expanduser("~/.openclaw/openclaw.json")
with open(config_path) as f:
    config = json.load(f)

discord_token = config["channels"]["discord"]["token"]

print(f"GEMINI_API_KEY={gemini_key}")
print(f"DISCORD_TOKEN={discord_token}")
