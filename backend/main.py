import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, date, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import init_db, get_db
from models import BatchCreate, BatchResponse, AssessmentResponse
from risk_engine import assess_risk, CROP_PROFILES, calculate_storage_days
from market_data import get_market_prices, get_market_meta, is_valid_location
from decision_engine import calculate_decision

IS_PRODUCTION = os.getenv("APP_ENV", "development").lower() == "production"
ENABLE_API_DOCS = os.getenv("ENABLE_API_DOCS", str(not IS_PRODUCTION)).lower() in {"1", "true", "yes"}
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
PASSWORD_ITERATIONS = 600_000


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


app = FastAPI(
    title="CropShield API",
    version="1.0.0",
    docs_url="/docs" if ENABLE_API_DOCS else None,
    redoc_url=None,
    openapi_url="/openapi.json" if ENABLE_API_DOCS else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {"status": "ok", "service": "CropShield"}


@app.get("/health")
def health():
    conn = get_db()
    try:
        conn.execute("SELECT 1")
    finally:
        conn.close()
    return {"status": "ok"}


@app.get("/crops")
def list_crops():
    return {
        "crops": [
            {"key": k, "display_name": v["display_name"]}
            for k, v in CROP_PROFILES.items()
        ]
    }


# ─── Farmer auth (simple token auth for hackathon MVP) ───

class FarmerRegister(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8, max_length=128)
    village: str = ""
    state: str = ""
    district: str = ""


class FarmerLogin(BaseModel):
    phone: str
    password: str = Field(..., max_length=128)


def _hash_password(password: str, salt: str, iterations: int = PASSWORD_ITERATIONS) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), iterations).hex()


def _public_farmer(row) -> dict:
    return {
        "id": row["id"], "name": row["name"], "phone": row["phone"],
        "village": row["village"] or "", "state": row["state"] or "",
        "district": row["district"] or "",
    }


def _require_farmer(authorization: Optional[str] = None) -> dict:
    """Resolve the logged-in farmer from `Authorization: Bearer <token>`."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login required. Please register or log in as a farmer.")
    token = authorization[len("Bearer "):].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Login required. Please register or log in as a farmer.")
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM farmers WHERE auth_token=?", (token,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
        return dict(row)
    finally:
        conn.close()


def _owns(batch: dict, farmer: dict) -> bool:
    return batch.get("farmer_id") == farmer["id"]


@app.post("/farmers/register")
def register_farmer(body: FarmerRegister):
    if body.state and body.district and not is_valid_location(body.state, body.district):
        raise HTTPException(status_code=422, detail="Choose a district in the selected state or union territory.")
    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM farmers WHERE phone=?", (body.phone.strip(),)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="This phone number is already registered. Please log in.")
        salt = secrets.token_hex(16)
        token = secrets.token_hex(32)
        conn.execute(
            "INSERT INTO farmers (name, phone, password_hash, password_salt, password_iterations, village, state, district, auth_token, created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?)",
            (body.name.strip(), body.phone.strip(), _hash_password(body.password, salt, PASSWORD_ITERATIONS),
             salt, PASSWORD_ITERATIONS, body.village.strip(), body.state.strip(), body.district.strip(),
             token, _utc_now_iso()),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM farmers WHERE phone=?", (body.phone.strip(),)).fetchone()
        return {"token": token, "farmer": _public_farmer(row)}
    finally:
        conn.close()


@app.post("/farmers/login")
def login_farmer(body: FarmerLogin):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM farmers WHERE phone=?", (body.phone.strip(),)).fetchone()
        if not row or not hmac.compare_digest(
            _hash_password(body.password, row["password_salt"], row["password_iterations"]),
            row["password_hash"],
        ):
            raise HTTPException(status_code=401, detail="Invalid phone number or password.")
        token = secrets.token_hex(32)
        conn.execute("UPDATE farmers SET auth_token=? WHERE id=?", (token, row["id"]))
        conn.commit()
        row = conn.execute("SELECT * FROM farmers WHERE id=?", (row["id"],)).fetchone()
        return {"token": token, "farmer": _public_farmer(row)}
    finally:
        conn.close()


@app.get("/farmers/me")
def farmer_me(authorization: Optional[str] = Header(default=None)):
    farmer = _require_farmer(authorization)
    return {"farmer": _public_farmer(farmer)}


@app.post("/batches", response_model=BatchResponse)
def create_batch(batch: BatchCreate, authorization: Optional[str] = Header(default=None)):
    farmer = _require_farmer(authorization)
    if not is_valid_location(batch.state, batch.district):
        raise HTTPException(status_code=422, detail="Choose a district in the selected state or union territory.")
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO batches (
                farmer_id, farmer_name, crop, variety, quantity_kg, harvest_date,
                location, state, district, storage_type, temperature_c, humidity_pct,
                intended_sell_date, visible_condition, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                farmer["id"], batch.farmer_name, batch.crop, batch.variety, batch.quantity_kg,
                batch.harvest_date, batch.location, batch.state, batch.district, batch.storage_type,
                batch.temperature_c, batch.humidity_pct, batch.intended_sell_date,
                batch.visible_condition, _utc_now_iso(),
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM batches WHERE id=?", (c.lastrowid,)).fetchone()
        return dict(row)
    finally:
        conn.close()


@app.get("/batches")
def list_batches(authorization: Optional[str] = Header(default=None)):
    farmer = _require_farmer(authorization)
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM batches WHERE farmer_id=? ORDER BY id DESC",
            (farmer["id"],),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.get("/batches/{batch_id}")
def get_batch(batch_id: int, authorization: Optional[str] = Header(default=None)):
    farmer = _require_farmer(authorization)
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM batches WHERE id=?", (batch_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Batch not found")
        batch = dict(row)
        if not _owns(batch, farmer):
            raise HTTPException(status_code=403, detail="This batch belongs to another farmer.")
        return batch
    finally:
        conn.close()


def _run_full_assessment(batch: dict, days_to_store: int) -> dict:
    """Pure computation — no DB writes. Used by both assess and compute endpoints."""
    risk = assess_risk(
        crop=batch["crop"],
        storage_type=batch["storage_type"],
        harvest_date_str=batch["harvest_date"],
        temperature_c=batch["temperature_c"],
        humidity_pct=batch["humidity_pct"],
        quantity_kg=batch["quantity_kg"],
        visible_condition=batch["visible_condition"] or "fresh",
    )
    prices = get_market_prices(batch["crop"], batch["district"], batch.get("state") or None)
    decision = calculate_decision(
        quantity_kg=batch["quantity_kg"],
        risk_assessment=risk,
        market_prices=prices,
        days_to_sell_if_stored=days_to_store,
        crop=batch["crop"],
    )
    return {"risk": risk, "market_prices": prices, "decision": decision}


@app.post("/batches/{batch_id}/assess")
def assess_batch(batch_id: int, days_to_store: int = 7, authorization: Optional[str] = Header(default=None)):
    farmer = _require_farmer(authorization)
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM batches WHERE id=?", (batch_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Batch not found")
        batch = dict(row)
        if not _owns(batch, farmer):
            raise HTTPException(status_code=403, detail="This batch belongs to another farmer.")

        result = _run_full_assessment(batch, days_to_store)
        risk = result["risk"]
        prices = result["market_prices"]
        decision = result["decision"]

        # Delete previous assessments for this batch (avoid duplicate rows on re-assess)
        conn.execute("DELETE FROM assessments WHERE batch_id=?", (batch_id,))

        now = _utc_now_iso()
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO assessments (
                batch_id, risk_score, risk_category, risk_factors,
                quantity_at_risk_kg, recommended_actions,
                sell_now_return, store_return,
                recommendation, recommendation_reason, assumptions, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                batch_id,
                risk["risk_score"],
                risk["risk_category"],
                json.dumps(risk["risk_factors"]),
                risk["quantity_at_risk_kg"],
                json.dumps(risk["recommended_actions"]),
                decision["sell_now_return"],
                decision["store_return"],
                decision["recommendation"],
                decision["recommendation_reason"],
                json.dumps(decision["assumptions"]),
                now,
            ),
        )
        conn.commit()
        assessment_id = c.lastrowid

        return {
            "assessment_id": assessment_id,
            "batch": batch,
            "risk": risk,
            "market_prices": prices,
            "decision": decision,
        }
    finally:
        conn.close()


@app.post("/batches/{batch_id}/compute")
def compute_assessment(batch_id: int, days_to_store: int = 7, authorization: Optional[str] = Header(default=None)):
    """Pure computation endpoint — no DB writes. For live recalculate on the UI."""
    farmer = _require_farmer(authorization)
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM batches WHERE id=?", (batch_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Batch not found")
        batch = dict(row)
        if not _owns(batch, farmer):
            raise HTTPException(status_code=403, detail="This batch belongs to another farmer.")
        return _run_full_assessment(batch, days_to_store)
    finally:
        conn.close()


@app.get("/batches/{batch_id}/assessments")
def get_assessments(batch_id: int, authorization: Optional[str] = Header(default=None)):
    farmer = _require_farmer(authorization)
    conn = get_db()
    try:
        brow = conn.execute("SELECT * FROM batches WHERE id=?", (batch_id,)).fetchone()
        if not brow:
            raise HTTPException(status_code=404, detail="Batch not found")
        if not _owns(dict(brow), farmer):
            raise HTTPException(status_code=403, detail="This batch belongs to another farmer.")
        rows = conn.execute(
            "SELECT * FROM assessments WHERE batch_id=? ORDER BY id DESC",
            (batch_id,)
        ).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["risk_factors"] = json.loads(d["risk_factors"])
            d["recommended_actions"] = json.loads(d["recommended_actions"])
            d["assumptions"] = json.loads(d["assumptions"])
            results.append(d)
        return results
    finally:
        conn.close()


@app.get("/market-prices/{crop}")
def market_prices(crop: str, district: str = None, state: str = None, market: str = None):
    return get_market_prices(crop, district, state, market)


@app.get("/market-meta")
def market_meta():
    return get_market_meta()


@app.get("/dashboard/summary")
def dashboard_summary(authorization: Optional[str] = Header(default=None)):
    farmer = _require_farmer(authorization)
    conn = get_db()
    try:
        batches = conn.execute(
            "SELECT * FROM batches WHERE farmer_id=?",
            (farmer["id"],),
        ).fetchall()
        total_batches = len(batches)

        # Re-run risk fresh for each batch (dates move over time, stale scores are wrong)
        high_risk = 0
        medium_risk = 0
        total_at_risk_kg = 0.0
        total_loss_inr = 0.0

        for b in batches:
            batch = dict(b)
            risk = assess_risk(
                crop=batch["crop"],
                storage_type=batch["storage_type"],
                harvest_date_str=batch["harvest_date"],
                temperature_c=batch["temperature_c"],
                humidity_pct=batch["humidity_pct"],
                quantity_kg=batch["quantity_kg"],
                visible_condition=batch["visible_condition"] or "fresh",
            )
            prices = get_market_prices(batch["crop"], batch["district"], batch.get("state") or None)
            price_per_kg = prices["markets"][0]["price_per_kg"] if prices["markets"] else 10.0
            loss_value = risk["quantity_at_risk_kg"] * price_per_kg

            if risk["risk_category"] == "High":
                high_risk += 1
            elif risk["risk_category"] == "Medium":
                medium_risk += 1

            total_at_risk_kg += risk["quantity_at_risk_kg"]
            total_loss_inr += loss_value

        latest_prices = {}
        for crop in CROP_PROFILES:
            p = get_market_prices(crop)
            if p["markets"]:
                latest_prices[crop] = {
                    "modal_price": p["markets"][0]["modal_price"],
                    "market": p["markets"][0]["market"],
                }

        return {
            "total_batches": total_batches,
            "high_risk_batches": high_risk,
            "medium_risk_batches": medium_risk,
            "total_at_risk_kg": round(total_at_risk_kg, 1),
            "estimated_loss_inr": round(total_loss_inr, 0),
            "latest_prices": latest_prices,
        }
    finally:
        conn.close()
