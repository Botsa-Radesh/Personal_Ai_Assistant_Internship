#!/usr/bin/env python3
"""Set Google API key in GBrain config from OpenClaw auth profiles."""
import json
import os

# Read Google API key from OpenClaw
auth_path = os.path.expanduser("~/.openclaw/agents/main/agent/auth-profiles.json")
with open(auth_path, "r") as f:
    auth = json.load(f)

google_key = auth["profiles"]["google:default"]["key"]

# Update GBrain config with the key
gbrain_config_path = os.path.expanduser("~/.gbrain/config.json")
with open(gbrain_config_path, "r") as f:
    config = json.load(f)

config["google_api_key"] = google_key

with open(gbrain_config_path, "w") as f:
    json.dump(config, f, indent=2)

print(f"✅ Set GOOGLE API key in GBrain config (key: {google_key[:8]}...)")
