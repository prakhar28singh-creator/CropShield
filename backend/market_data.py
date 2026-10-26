"""
Sample mandi price data for demonstration.
Prices are synthetic prototype examples, not official market observations.
All prices are in INR per quintal (100 kg).
"""

import csv
import hashlib
import json
import logging
import math
import os
import time
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from risk_engine import CROP_PROFILES

DEMO_NOTICE = "DEMO DATA — Synthetic prototype prices and bundled monthly history; not live or official market data."
SOURCE_LABEL = "Sample data (synthetic prototype; not official)"
OFFICIAL_SOURCE_LABEL = "data.gov.in — AGMARKNET daily mandi prices"
OFFICIAL_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
OFFICIAL_API_URL = "https://api.data.gov.in/resource"
OFFICIAL_API_TIMEOUT_SECONDS = 8
OFFICIAL_CACHE_SECONDS = 300
logger = logging.getLogger(__name__)
PRICE_HISTORY_PATH = Path(__file__).with_name("data") / "crop_monthly_price_samples.csv"
INDIA_LOCATIONS = json.loads(
    Path(__file__).with_name("india_locations.json").read_text(encoding="utf-8")
)

CROP_DISPLAY = {
    key: profile["display_name"]
    for key, profile in CROP_PROFILES.items()
}

API_COMMODITY_NAMES = {
    "rice": ("Paddy(Dhan)(Common)", "Rice"),
    "chilli": ("Chilli", "Dry Chillies"),
    "okra": ("Bhindi(Ladies Finger)", "Bhindi", "Okra"),
}
COMMODITY_ALIASES = {
    "paddy(dhan)(common)": "rice",
    "paddy": "rice",
    "drychillies": "chilli",
    "chillies": "chilli",
    "bhindi(ladiesfinger)": "okra",
    "bhindi": "okra",
    "ladiesfinger": "okra",
    "eggplant": "brinjal",
}
_OFFICIAL_RESPONSE_CACHE = {}

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

def _load_price_history() -> dict:
    """Load and validate the bundled monthly prototype-price CSV."""
    history = {}
    with PRICE_HISTORY_PATH.open(newline="", encoding="utf-8") as csv_file:
        for row in csv.DictReader(csv_file):
            crop = row["crop"].strip().lower()
            min_price = int(row["min_price"])
            max_price = int(row["max_price"])
            modal_price = int(row["modal_price"])
            period = datetime.strptime(row["month"], "%Y-%m").date()
            if crop not in CROP_PROFILES:
                raise ValueError(f"Unknown crop in prototype price dataset: {crop}")
            if not min_price <= modal_price <= max_price:
                raise ValueError(f"Invalid price range for {crop} in {row['month']}")
            history.setdefault(crop, []).append({
                "date": period.isoformat(),
                "min_price": min_price,
                "max_price": max_price,
                "modal_price": modal_price,
            })

    for crop, records in history.items():
        records.sort(key=lambda record: record["date"])
        if len(records) != 5:
            raise ValueError(f"Expected five monthly prototype records for {crop}")
    if set(history) != set(CROP_PROFILES):
        raise ValueError("Prototype price dataset must contain every supported crop")
    return history


PRICE_HISTORY = _load_price_history()


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
    "chilli": 3200, "brinjal": 1800, "cabbage": 1200, "cauliflower": 1600,
    "okra": 2500, "mango": 4000, "banana": 1800,
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


def _field(record: dict, name: str):
    return next((value for key, value in record.items() if key.casefold() == name.casefold()), None)


def _commodity_key(value: str) -> str:
    normalized = "".join(character for character in (value or "").casefold() if character.isalnum() or character in "()")
    return COMMODITY_ALIASES.get(normalized, normalized)


def _parse_price(value):
    try:
        price = float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None
    if not math.isfinite(price) or price <= 0:
        return None
    return round(price)


def _parse_official_date(value):
    value = str(value or "").strip()
    for date_format in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d-%b-%Y"):
        try:
            return datetime.strptime(value, date_format).date()
        except ValueError:
            continue
    return None


def _fetch_official_records(crop_key: str, state: str, district: str):
    """Return official records, or None when the key or upstream request is unavailable."""
    api_key = os.getenv("DATA_GOV_IN_API_KEY", "").strip()
    if not api_key:
        return None

    resource_id = os.getenv("DATA_GOV_IN_RESOURCE_ID", OFFICIAL_RESOURCE_ID).strip()
    if not resource_id or any(character not in "0123456789abcdefABCDEF-" for character in resource_id):
        logger.warning("Invalid data.gov.in resource ID; using prototype prices.")
        return None

    commodity_names = API_COMMODITY_NAMES.get(crop_key, (CROP_DISPLAY.get(crop_key, crop_key),))
    for commodity in commodity_names:
        cache_key = (resource_id, commodity.casefold(), state.casefold(), district.casefold())
        cached = _OFFICIAL_RESPONSE_CACHE.get(cache_key)
        if cached and time.monotonic() - cached[0] < OFFICIAL_CACHE_SECONDS:
            records = cached[1]
        else:
            params = {
                "api-key": api_key,
                "format": "json",
                "limit": "1000",
                "filters[commodity]": commodity,
            }
            if state:
                params["filters[state]"] = state
            if district:
                params["filters[district]"] = district
            url = f"{OFFICIAL_API_URL}/{resource_id}?{urlencode(params)}"
            try:
                with urlopen(url, timeout=OFFICIAL_API_TIMEOUT_SECONDS) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                records = payload.get("records") if isinstance(payload, dict) else None
                if not isinstance(records, list) or not all(isinstance(record, dict) for record in records):
                    raise ValueError("Unexpected data.gov.in response shape")
                _OFFICIAL_RESPONSE_CACHE[cache_key] = (time.monotonic(), records)
            except (HTTPError, URLError, TimeoutError, OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
                logger.warning("data.gov.in request failed (%s); using prototype prices.", type(exc).__name__)
                return None
        if records:
            return records
    return []


def _official_market_rows(records: list, crop_key: str):
    rows = []
    for record in records:
        commodity = _field(record, "commodity")
        record_state = str(_field(record, "state") or "").strip()
        record_district = str(_field(record, "district") or "").strip()
        record_market = str(_field(record, "market") or "").strip()
        arrival_date = _parse_official_date(_field(record, "arrival_date"))
        min_price = _parse_price(_field(record, "min_price"))
        max_price = _parse_price(_field(record, "max_price"))
        modal_price = _parse_price(_field(record, "modal_price"))
        if (
            _commodity_key(str(commodity or "")) != crop_key
            or not record_state or not record_district or not record_market or not arrival_date
            or min_price is None or max_price is None or modal_price is None
            or not min_price <= modal_price <= max_price
        ):
            continue
        rows.append({
            "market": record_market,
            "district": record_district,
            "state": record_state,
            "min_price": min_price,
            "max_price": max_price,
            "modal_price": modal_price,
            "price_date": arrival_date.isoformat(),
            "arrivals_tonnes": None,
            "distance_km": None,
            "transport_cost_per_quintal": None,
        })
    return rows


def _official_price_history(rows: list):
    by_month = defaultdict(list)
    for row in rows:
        by_month[row["price_date"][:7]].append(row)
    return [
        {
            "date": f"{month}-01",
            "min_price": min(row["min_price"] for row in month_rows),
            "max_price": max(row["max_price"] for row in month_rows),
            "modal_price": round(sum(row["modal_price"] for row in month_rows) / len(month_rows)),
        }
        for month, month_rows in sorted(by_month.items())
    ]


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


def _synthesize_estimates(crop_key: str, modal_today: float) -> dict:
    """Generic demo 7/14/30-day outlook for crops without curated estimates."""
    note = "Generic demo outlook (sample data)"
    return {
        "7_days": {"price": round(modal_today * 1.005), "confidence": "medium", "note": note},
        "14_days": {"price": round(modal_today * 1.01), "confidence": "low", "note": note},
        "30_days": {"price": round(modal_today * 1.02), "confidence": "very_low", "note": note},
    }


def _build_entry(m: dict, today: date, source_label: str = SOURCE_LABEL) -> dict:
    entry = dict(m)
    entry.setdefault("price_date", str(today))
    entry["source"] = source_label
    transport_cost = entry.get("transport_cost_per_quintal")
    entry["net_price_per_quintal"] = entry["modal_price"] - (transport_cost or 0)
    entry["price_per_kg"] = round(entry["modal_price"] / 100, 2)
    entry["net_price_per_kg"] = round(entry["net_price_per_quintal"] / 100, 2)
    return entry


def get_market_prices(crop: str, district: str = None, state: str = None, market: str = None):
    """Return price data for a crop, optionally filtered by state, district or market.

    Filters are case-insensitive; district matches as a substring so a farmer
    typing a partial name still gets results.
    """
    crop_key = _norm_place(crop)
    today = date.today()
    state_q = _norm_place(state)
    district_q = _norm_place(district)
    market_q = _norm_place(market)

    official_records = _fetch_official_records(crop_key, state or "", district or "")
    if official_records is not None:
        all_official_rows = _official_market_rows(official_records, crop_key)
        if official_records and not all_official_rows:
            logger.warning("data.gov.in returned no usable %s records; using prototype prices.", crop_key)
        else:
            official_rows = [
                row for row in all_official_rows
                if (not state_q or _norm_place(row["state"]) == state_q)
                and (not district_q or district_q in _norm_place(row["district"]))
                and (not market_q or market_q in _norm_place(row["market"]))
            ]
            official_rows.sort(key=lambda row: (row["price_date"], row["modal_price"]), reverse=True)
            markets = [_build_entry(row, today, OFFICIAL_SOURCE_LABEL) for row in official_rows]
            return {
                "markets": markets,
                "price_history": _official_price_history(official_rows),
                "future_estimates": {},
                "data_source": "official",
                "is_demo": False,
                "demo_notice": "Official daily mandi prices from data.gov.in (AGMARKNET resource). Dates and coverage depend on the published feed.",
            }

    base_rows = MANDI_DATA.get(crop_key)
    if base_rows is None:
        base_rows = _synthesize_rows(crop_key, district, state)
    curated = MANDI_DATA.get(crop_key)  # may be None for unknown crops
    # Fallback below guarantees at least one demo market for any crop/place.

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

    history = PRICE_HISTORY[crop_key]

    return {
        "markets": markets,
        "price_history": history,
        "future_estimates": FUTURE_PRICE_ESTIMATES.get(crop_key) or _synthesize_estimates(crop_key, markets[0]["modal_price"] if markets else 2600),
        "data_source": "demo",
        "is_demo": True,
        "demo_notice": f"{DEMO_NOTICE} The official feed is not configured or did not return usable data.",
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
            for k in CROP_DISPLAY
        ],
        "demo_notice": DEMO_NOTICE,
    }


def is_valid_location(state: str, district: str) -> bool:
    """Check that a district belongs to the selected state or union territory."""
    return any(
        entry["state"] == state and district in entry["districts"]
        for entry in INDIA_LOCATIONS
    )
