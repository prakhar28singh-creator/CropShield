"""Vercel serverless handler for CropShield FastAPI application."""
import json
from pathlib import Path
from fastapi import FastAPI

app = FastAPI(title="CropShield API", version="1.0.0")

# Load India locations data at module load time
INDIA_LOCATIONS = []
locations_path = Path(__file__).parent.parent / "india_locations.json"
if locations_path.exists():
    with open(locations_path, encoding="utf-8") as f:
        INDIA_LOCATIONS = json.load(f)

@app.get("/health")
def health():
    return {"status": "ok"}

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
        "demo_notice": "DEMO DATA — Synthetic prototype prices and bundled monthly history; not live or official market data."
    }

@app.get("/crops")
def list_crops():
    return {"crops": []}

@app.get("/")
def root():
    return {"status": "ok", "service": "CropShield"}