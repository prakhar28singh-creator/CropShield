from fastapi import FastAPI
import json
from pathlib import Path

app = FastAPI(title="CropShield API", version="1.0.0")

# Load India locations from same directory
INDIA_LOCATIONS = []
locations_path = Path(__file__).parent / "india_locations.json"
if locations_path.exists():
    with open(locations_path, encoding="utf-8") as f:
        INDIA_LOCATIONS = json.load(f)
    print(f"Loaded {len(INDIA_LOCATIONS)} locations")
else:
    INDIA_LOCATIONS = [
        {"state": "Andaman and Nicobar Islands", "districts": ["Nicobars", "North And Middle Andaman", "South Andamans"]},
        {"state": "Andhra Pradesh", "districts": ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu"]},
        {"state": "Arunachal Pradesh", "districts": ["Anjaw", "Changlang", "Dibang Valley"]}
    ]

@app.get("/health")
def health():
    return {"status": "ok", "locations_loaded": len(INDIA_LOCATIONS)}

@app.get("/market-meta")
def market_meta():
    states = [
        {
            "name": entry["state"],
            "districts": sorted(entry.get("districts", []), key=str.casefold)
        }
        for entry in sorted(INDIA_LOCATIONS, key=lambda item: item.get("state", "").casefold())
    ]
    
    return {
        "states": states,
        "crops": [],
        "demo_notice": "DEMO Data — Synthetic prototype prices"
    }

@app.get("/crops")
def list_crops():
    return {"crops": []}

@app.get("/")
def root():
    return {"status": "ok", "service": "CropShield", "locations_count": len(INDIA_LOCATIONS)}
