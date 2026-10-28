import json
from pathlib import Path

filepath = Path(__file__).parent / "india_locations.json"
with open(filepath, encoding="utf-8") as f:
    data = json.load(f)

print("Total:", len(data))
print("First state:", data[0]["state"])
print("First districts sample:", data[0].get("districts", [])[:3])

# Test the FIXED logic
states = [
    {"name": e["state"], "districts": sorted(e.get("districts", []), key=str.casefold)}
    for e in sorted(data, key=lambda x: x.get("state", "").casefold())
]

print("\n=== FIX VERIFICATION ===")
print("States count:", len(states))
print("First state districts count:", len(states[0]["districts"]))
empty = [s for s in states if not s["districts"]]
print("States with empty districts:", len(empty))
print("\nFix working correctly!" if len(empty) == 0 else "\nFix NOT working")