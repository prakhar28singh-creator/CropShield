"""Vercel serverless handler for CropShield FastAPI application."""
import json
import os
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
    
    crops = [
        {"key": k, "display_name": v.get("display_name", k)}
        for k, v in CROP_PROFILES.items()
    ]
    
    return {
        "states": states,
        "crops": crops,
        "demo_notice": "DEMO DATA — Synthetic prototype prices and bundled monthly history; not live or official market data."
    }


# Load crop profiles at module load time
CROP_PROFILES = {}
crop_profiles_path = Path(__file__).parent.parent / "risk_engine.py"
# We'll load CROP_PROFILES dynamically to avoid circular imports
# For now, return empty crops if risk_engine can't be imported
try:
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from risk_engine import CROP_PROFILES
except:
    CROP_PROFILES = {}


@app.get("/crops")
def list_crops():
    crops = [
        {"key": k, "display_name": v.get("display_name", k)}
        for k, v in CROP_PROFILES.items()
    ]
    return {"crops": crops}


@app.get("/")
def root():
    return {"status": "ok", "service": "CropShield"}
