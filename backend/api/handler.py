"""Vercel serverless handler for CropShield FastAPI application."""
import sys
import os
from pathlib import Path

# Add parent directory to path so we can import from backend/
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI

app = FastAPI(title="CropShield API", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/market-meta")
def market_meta():
    from market_data import get_market_meta
    return get_market_meta()

@app.get("/crops")
def list_crops():
    return {"crops": []}

@app.get("/")
def root():
    return {"status": "ok", "service": "CropShield"}
