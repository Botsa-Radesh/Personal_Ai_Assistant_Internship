#!/usr/bin/env python3
"""Remove invalid intents key from Discord config."""
import json
import os

config_path = os.path.expanduser("~/.openclaw/openclaw.json")

with open(config_path, "r") as f:
    config = json.load(f)

# Remove the invalid intents key
if "intents" in config["channels"]["discord"]:
    del config["channels"]["discord"]["intents"]
    print("Removed invalid intents key")

with open(config_path, "w") as f:
    json.dump(config, f, indent=2)

print("✅ Config fixed")
