import json
from pathlib import Path

# Load the India locations data
with open(Path(__file__).parent / "india_locations.json", encoding="utf-8") as f:
    locations = json.load(f)

print(f"Total locations: {len(locations)}")
print(f"First entry: {locations[0]}")
print(f"First entry keys: {list(locations[0].keys())}")
print(f"First districts (first 3): {locations[0].get('districts', [])[:3]}")

# Test the get_market_meta logic
states = [
    {
        "name": entry["state"], 
        "districts": sorted(entry.get("districts", []), key=str.casefold)
    }
    for entry in sorted(locations, key=lambda item: item.get("state", "").casefold())
]

print(f"\nStates count: {len(states)}")
print(f"First state: {states[0]['name']}")
print(f"First state districts: {states[0]['districts'][:3]}")