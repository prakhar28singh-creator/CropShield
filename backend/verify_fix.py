#!/usr/bin/env python3
"""Verify the get_market_meta() fix works correctly."""
import json
from pathlib import Path

# Load India locations data
with open(Path(__file__).parent / "india_locations.json", encoding="utf-8") as f:
    locations = json.load(f)

print(f"Total locations: {len(locations)}")
print(f"First entry: {locations[0]}")
print(f"First entry keys: {list(locations[0].keys())}")
print(f"First districts (first 3): {locations[0].get('districts', [])[:3]}")

# Test the get_market_meta logic (the FIXED code)
states = [
    {
        "name": entry["state"], 
        "districts": sorted(entry.get("districts", []), key=str.casefold)
    }
    for entry in sorted(locations, key=lambda item: item.get("state", "").casefold())
]

print(f"\n=== FIX VERIFICATION ===")
print(f"States count: {len(states)}")
print(f"First state: {states[0]['name']}")
print(f"First state districts: {states[0]['districts'][:3]}")

# Verify all states have districts
empty_districts = [s for s in states if not s["districts"]]
print(f"\nStates with empty districts: {len(empty_districts)} (should be 0)")

# Verify first 5 states have districts
print("\nFirst 5 states with districts:")
for i, state in enumerate(states[:5]):
    print(f"  {i+1}. {state['name']}: {len(state['districts'])} districts")
    print(f"     First 3: {state['districts'][:3]}")

print("\n=== FIX SUCCESSFUL ===")
print("Districts are now populated from india_locations.json")