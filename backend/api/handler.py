"""Vercel serverless handler for CropShield FastAPI application."""
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
