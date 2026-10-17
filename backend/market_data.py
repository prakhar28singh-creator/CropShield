"""
Sample mandi price data for demonstration.
Clearly labeled as demo/sample data based on typical AGMARKNET price ranges.
All prices are in INR per quintal (100 kg).
"""

import hashlib
import json
from datetime import date, timedelta
from pathlib import Path

DEMO_NOTICE = "DEMO DATA — Sample prices based on typical AGMARKNET ranges. Not live market data."
SOURCE_LABEL = "Sample data (typical AGMARKNET ranges)"
INDIA_LOCATIONS = json.loads(
    Path(__file__).with_name("india_locations.json").read_text(encoding="utf-8")
)

CROP_DISPLAY = {
    "tomato": "Tomato",
    "potato": "Potato",
    "onion": "Onion",
    "wheat": "Wheat",
}

MANDI_DATA = {
    "tomato": [
        {"market": "Azadpur (Delhi)", "district": "North Delhi", "state": "Delhi",
         "min_price": 800, "max_price": 1400, "modal_price": 1100,
         "arrivals_tonnes": 320, "distance_km": 0, "transport_cost_per_quintal": 0},
        {"market": "Nashik", "district": "Nashik", "state": "Maharashtra",
         "min_price": 500, "max_price": 900, "modal_price": 700,
         "arrivals_tonnes": 850, "distance_km": 180, "transport_cost_per_quintal": 120},
        {"market": "Kolar", "district": "Kolar", "state": "Karnataka",
         "min_price": 600, "max_price": 1000, "modal_price": 800,
         "arrivals_tonnes": 410, "distance_km": 95, "transport_cost_per_quintal": 80},
        {"market": "Madanapalle", "district": "Chittoor", "state": "Andhra Pradesh",
         "min_price": 550, "max_price": 950, "modal_price": 750,
         "arrivals_tonnes": 290, "distance_km": 220, "transport_cost_per_quintal": 150},
        {"market": "Pune", "district": "Pune", "state": "Maharashtra",
         "min_price": 700, "max_price": 1200, "modal_price": 950,
         "arrivals_tonnes": 175, "distance_km": 140, "transport_cost_per_quintal": 100},
        {"market": "Hubli", "district": "Dharwad", "state": "Karnataka",
         "min_price": 650, "max_price": 1050, "modal_price": 850,
         "arrivals_tonnes": 120, "distance_km": 75, "transport_cost_per_quintal": 65},
    ],
    "potato": [
        {"market": "Agra", "district": "Agra", "state": "Uttar Pradesh",
         "min_price": 400, "max_price": 700, "modal_price": 550,
         "arrivals_tonnes": 1200, "distance_km": 0, "transport_cost_per_quintal": 0},
        {"market": "Kanpur", "district": "Kanpur", "state": "Uttar Pradesh",
         "min_price": 450, "max_price": 750, "modal_price": 600,
         "arrivals_tonnes": 680, "distance_km": 80, "transport_cost_per_quintal": 55},
        {"market": "Jalandhar", "district": "Jalandhar", "state": "Punjab",
         "min_price": 500, "max_price": 800, "modal_price": 650,
         "arrivals_tonnes": 540, "distance_km": 200, "transport_cost_per_quintal": 130},
        {"market": "Patna", "district": "Patna", "state": "Bihar",
         "min_price": 480, "max_price": 720, "modal_price": 600,
         "arrivals_tonnes": 390, "distance_km": 420, "transport_cost_per_quintal": 200},
        {"market": "Kolkata", "district": "Kolkata", "state": "West Bengal",
         "min_price": 520, "max_price": 820, "modal_price": 670,
         "arrivals_tonnes": 310, "distance_km": 520, "transport_cost_per_quintal": 250},
    ],
    "onion": [
        {"market": "Lasalgaon", "district": "Nashik", "state": "Maharashtra",
         "min_price": 700, "max_price": 1200, "modal_price": 950,
         "arrivals_tonnes": 2100, "distance_km": 0, "transport_cost_per_quintal": 0},
        {"market": "Pimpalgaon", "district": "Nashik", "state": "Maharashtra",
         "min_price": 680, "max_price": 1150, "modal_price": 900,
         "arrivals_tonnes": 1400, "distance_km": 35, "transport_cost_per_quintal": 30},
        {"market": "Solapur", "district": "Solapur", "state": "Maharashtra",
         "min_price": 750, "max_price": 1300, "modal_price": 1000,
         "arrivals_tonnes": 890, "distance_km": 250, "transport_cost_per_quintal": 160},
        {"market": "Hubli", "district": "Dharwad", "state": "Karnataka",
         "min_price": 800, "max_price": 1400, "modal_price": 1100,
         "arrivals_tonnes": 420, "distance_km": 180, "transport_cost_per_quintal": 120},
        {"market": "Bangalore", "district": "Bangalore", "state": "Karnataka",
         "min_price": 900, "max_price": 1500, "modal_price": 1200,
         "arrivals_tonnes": 280, "distance_km": 300, "transport_cost_per_quintal": 200},
    ],
    "wheat": [
        {"market": "Ludhiana", "district": "Ludhiana", "state": "Punjab",
         "min_price": 2050, "max_price": 2300, "modal_price": 2175,
         "arrivals_tonnes": 4500, "distance_km": 0, "transport_cost_per_quintal": 0},
        {"market": "Amritsar", "district": "Amritsar", "state": "Punjab",
         "min_price": 2040, "max_price": 2280, "modal_price": 2150,
         "arrivals_tonnes": 3800, "distance_km": 50, "transport_cost_per_quintal": 35},
        {"market": "Karnal", "district": "Karnal", "state": "Haryana",
         "min_price": 2060, "max_price": 2320, "modal_price": 2190,
         "arrivals_tonnes": 3200, "distance_km": 180, "transport_cost_per_quintal": 110},
        {"market": "Bhopal", "district": "Bhopal", "state": "Madhya Pradesh",
         "min_price": 2000, "max_price": 2250, "modal_price": 2125,
         "arrivals_tonnes": 2100, "distance_km": 450, "transport_cost_per_quintal": 220},
    ],
}

PRICE_HISTORY = {
    "tomato": [
        {"days_ago": 14, "modal_price": 950},
        {"days_ago": 12, "modal_price": 1020},
        {"days_ago": 10, "modal_price": 1080},
        {"days_ago": 8, "modal_price": 980},
        {"days_ago": 6, "modal_price": 1050},
        {"days_ago": 4, "modal_price": 1150},
        {"days_ago": 2, "modal_price": 1100},
        {"days_ago": 0, "modal_price": 1100},
    ],
    "potato": [
        {"days_ago": 14, "modal_price": 520},
        {"days_ago": 12, "modal_price": 530},
        {"days_ago": 10, "modal_price": 545},
        {"days_ago": 8, "modal_price": 540},
        {"days_ago": 6, "modal_price": 555},
        {"days_ago": 4, "modal_price": 560},
        {"days_ago": 2, "modal_price": 550},
        {"days_ago": 0, "modal_price": 550},
    ],
    "onion": [
        {"days_ago": 14, "modal_price": 850},
        {"days_ago": 12, "modal_price": 880},
        {"days_ago": 10, "modal_price": 920},
        {"days_ago": 8, "modal_price": 970},
        {"days_ago": 6, "modal_price": 1000},
        {"days_ago": 4, "modal_price": 980},
        {"days_ago": 2, "modal_price": 960},
        {"days_ago": 0, "modal_price": 950},
    ],
    "wheat": [
        {"days_ago": 14, "modal_price": 2140},
        {"days_ago": 12, "modal_price": 2150},
        {"days_ago": 10, "modal_price": 2160},
        {"days_ago": 8, "modal_price": 2170},
        {"days_ago": 6, "modal_price": 2175},
        {"days_ago": 4, "modal_price": 2180},
        {"days_ago": 2, "modal_price": 2175},
        {"days_ago": 0, "modal_price": 2175},
    ],
}


FUTURE_PRICE_ESTIMATES = {
    "tomato": {
        "7_days": {"price": 1050, "confidence": "low", "note": "Tomato prices are highly volatile"},
        "14_days": {"price": 980, "confidence": "low", "note": "Seasonal supply expected to increase"},
        "30_days": {"price": 900, "confidence": "very_low", "note": "Unreliable beyond 2 weeks for perishables"},
    },
    "potato": {
        "7_days": {"price": 570, "confidence": "medium", "note": "Stable demand expected"},
        "14_days": {"price": 590, "confidence": "medium", "note": "Post-festival demand may lift prices"},
        "30_days": {"price": 600, "confidence": "low", "note": "Winter storage stock release uncertain"},
    },
    "onion": {
        "7_days": {"price": 970, "confidence": "medium", "note": "Supply from Nashik steady"},
        "14_days": {"price": 1000, "confidence": "low", "note": "Export demand variable"},
        "30_days": {"price": 1050, "confidence": "very_low", "note": "Highly sensitive to export policy"},
    },
    "wheat": {
        "7_days": {"price": 2180, "confidence": "high", "note": "MSP supports price floor"},
        "14_days": {"price": 2190, "confidence": "high", "note": "Government procurement active"},
        "30_days": {"price": 2200, "confidence": "medium", "note": "Depends on procurement targets"},
    },
}


# Typical demo modal prices (Rs/quintal) for fallback synthesis.
SEED_PRICES = {
    "tomato": 1100, "potato": 550, "onion": 950, "wheat": 2175,
    "rice": 2250, "maize": 2150, "cotton": 7150, "soybean": 4550,
    "groundnut": 6350, "sugarcane": 340, "gram": 5400, "jute": 2550,
}

# Common spelling variants for known places (case-insensitive).
PLACE_ALIASES = {
    "nasik": "nashik", "banglore": "bangalore", "bangaluru": "bangalore",
    "bengaluru": "bangalore", "calcutta": "kolkata", "madras": "chennai",
    "bombay": "mumbai", "allahabad": "prayagraj", "gurgaon": "gurugram",
}


def _norm_place(s: str) -> str:
    """Lowercase, strip suffixes/extra words, and resolve common spellings."""
    s = (s or "").strip().lower().replace(",", " ")
    s = " ".join(s.split())
    for suffix in (" district", " dist", " mandi", " market", " apmc"):
        if s.endswith(suffix):
            s = s[: -len(suffix)].strip()
    return PLACE_ALIASES.get(s, s)


def _stable_hash(s: str) -> int:
    return int(hashlib.md5(s.encode("utf-8")).hexdigest(), 16)


def _synthesize_rows(crop_key: str, district: str, state: str) -> list:
    """Clearly-labeled demo market rows for a locality with no curated entry.
    Deterministic per crop+district so repeated calls return the same prices."""
    base = SEED_PRICES.get(crop_key, 2600)
    place = (district or "").strip() or (state or "").strip() or "Nearby"
    st = (state or "").strip() or "India"
    h = _stable_hash(f"{crop_key}|{place}")

    def jitter(i: int) -> float:  # deterministic -5%..+5%
        return (((h >> (i * 5)) % 11) - 5) / 100.0

    specs = [
        (f"{place} APMC Yard", 0, 0, 1.0),
        (f"{place} Rural Market", 18, 22, 1.0 + jitter(1)),
        (f"{st} State Mandi", 95, 70, 1.0 + jitter(2)),
    ]
    rows = []
    for i, (name, dist_km, cost, mult) in enumerate(specs):
        modal = max(50, round(base * mult / 5) * 5)
        rows.append({
            "market": name, "district": place.title(), "state": st,
            "min_price": round(modal * 0.9), "max_price": round(modal * 1.12),
            "modal_price": modal, "arrivals_tonnes": 60 + ((h >> (i * 3)) % 500),
            "distance_km": dist_km, "transport_cost_per_quintal": cost,
        })
    return rows


def _synthesize_history(crop_key: str, modal_today: float) -> list:
    """14-day demo price history ending at today's modal price."""
    h = _stable_hash(f"{crop_key}|history")
    pts = []
    for days_ago in (14, 12, 10, 8, 6, 4, 2, 0):
        wob = (((h >> days_ago) % 9) - 4) / 200.0  # +-2%
        pts.append({"days_ago": days_ago, "modal_price": round(modal_today * (1 + wob))})
    pts[-1]["modal_price"] = round(modal_today)
    return pts


def _synthesize_estimates(crop_key: str, modal_today: float) -> dict:
    """Generic demo 7/14/30-day outlook for crops without curated estimates."""
    note = "Generic demo outlook (sample data)"
    return {
        "7_days": {"price": round(modal_today * 1.005), "confidence": "medium", "note": note},
        "14_days": {"price": round(modal_today * 1.01), "confidence": "low", "note": note},
        "30_days": {"price": round(modal_today * 1.02), "confidence": "very_low", "note": note},
    }


def _build_entry(m: dict, today: date) -> dict:
    entry = dict(m)
    entry["price_date"] = str(today)
    entry["source"] = SOURCE_LABEL
    entry["net_price_per_quintal"] = entry["modal_price"] - entry["transport_cost_per_quintal"]
    entry["price_per_kg"] = round(entry["modal_price"] / 100, 2)
    entry["net_price_per_kg"] = round(entry["net_price_per_quintal"] / 100, 2)
    return entry


def get_market_prices(crop: str, district: str = None, state: str = None, market: str = None):
    """Return price data for a crop, optionally filtered by state, district or market.

    Filters are case-insensitive; district matches as a substring so a farmer
    typing a partial name still gets results.
    """
    crop_key = _norm_place(crop)
    base_rows = MANDI_DATA.get(crop_key)
    if base_rows is None:
        base_rows = _synthesize_rows(crop_key, district, state)
    curated = MANDI_DATA.get(crop_key)  # may be None for unknown crops
    # Fallback below guarantees at least one demo market for any crop/place.

    today = date.today()
    state_q = _norm_place(state)
    district_q = _norm_place(district)
    market_q = _norm_place(market)

    markets = []
    for m in base_rows:
        if state_q and _norm_place(m["state"]) != state_q:
            continue
        if district_q and district_q not in _norm_place(m["district"]) and district_q not in _norm_place(m["market"]):
            continue
        if market_q and market_q not in _norm_place(m["market"]):
            continue
        markets.append(_build_entry(m, today))

    if not markets:
        # Fallback: a local demo market for the farmer's own district, plus the
        # crop's usual benchmark markets (all rows are demo-labeled).
        local = [_build_entry(r, today) for r in _synthesize_rows(crop_key, district, state)]
        benchmarks = [_build_entry(r, today) for r in (curated or [])]
        markets = local if state_q or district_q or market_q else local + benchmarks

    markets.sort(key=lambda x: x["net_price_per_quintal"], reverse=True)

    history = []
    for h in PRICE_HISTORY.get(crop_key) or _synthesize_history(crop_key, markets[0]["modal_price"] if markets else 2600):
        history.append({"date": str(today - timedelta(days=h["days_ago"])),
                        "modal_price": h["modal_price"]})

    return {
        "markets": markets,
        "price_history": history,
        "future_estimates": FUTURE_PRICE_ESTIMATES.get(crop_key) or _synthesize_estimates(crop_key, markets[0]["modal_price"] if markets else 2600),
        "demo_notice": DEMO_NOTICE,
    }


def get_market_meta():
    """Shared state, district, and supported-crop lists for the app."""
    return {
        "states": [
            {"name": entry["state"], "districts": sorted(entry["districts"], key=str.casefold)}
            for entry in sorted(INDIA_LOCATIONS, key=lambda item: item["state"].casefold())
        ],
        "crops": [
            {"key": k, "display_name": CROP_DISPLAY[k]}
            for k in MANDI_DATA
        ],
        "demo_notice": DEMO_NOTICE,
    }


def is_valid_location(state: str, district: str) -> bool:
    """Check that a district belongs to the selected state or union territory."""
    return any(
        entry["state"] == state and district in entry["districts"]
        for entry in INDIA_LOCATIONS
    )
