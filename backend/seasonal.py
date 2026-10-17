"""
Seasonal price model for Indian mandi markets.

Prices for most traded crops follow an annual cycle driven by sowing and
harvest arrivals, festival demand, and government procurement windows.
This module encodes that cycle as a monthly index per crop
(1.0 = annual average) and forecasts a price for a future sale date by
blending three signals:

  1. Seasonal ratio  — typical price level of the sale month vs this month
  2. Expert estimate — the crop's 7/14/30-day market outlook (market_data)
  3. Momentum        — damped recent 14-day price trend

All signals are ratios against today's observed price, so the model works
with any absolute price level and any market/place.

NOTE: indices reflect typical AGMARKNET ranges for Indian conditions and are
for demonstration. Replace with real series (e.g., from AGMARKNET) for
production use.
"""

from datetime import date

# Monthly price indices (Jan..Dec). 1.0 = annual average.
SEASONAL_INDEX = {
    "tomato":  [1.05, 1.15, 1.25, 1.30, 1.25, 1.10, 0.90, 0.75, 0.70, 0.75, 0.90, 1.00],
    "potato":  [1.02, 1.08, 0.92, 0.85, 0.88, 0.95, 1.05, 1.12, 1.18, 1.15, 1.10, 1.05],
    "onion":   [1.12, 1.22, 1.30, 1.35, 1.25, 1.12, 1.00, 0.82, 0.72, 0.70, 0.85, 1.00],
    "wheat":   [1.03, 1.04, 1.05, 1.03, 1.00, 0.99, 0.98, 0.98, 1.00, 1.02, 1.03, 1.03],
    "rice":    [1.02, 1.03, 1.04, 1.02, 0.99, 0.97, 0.96, 0.98, 1.02, 1.04, 1.03, 1.02],
    "maize":   [1.05, 1.12, 1.15, 1.12, 1.05, 0.98, 0.92, 0.88, 0.90, 0.95, 1.00, 1.03],
    "mustard": [1.10, 1.12, 1.08, 1.00, 0.92, 0.88, 0.90, 0.95, 1.00, 1.03, 1.06, 1.09],
    "groundnut": [1.06, 1.08, 1.05, 1.00, 0.96, 0.94, 0.96, 1.00, 1.03, 1.05, 1.06, 1.07],
    "cotton":  [1.03, 1.04, 1.03, 1.01, 0.99, 0.98, 0.99, 1.01, 1.03, 1.05, 1.04, 1.02],
    "_generic": [1.02, 1.03, 1.02, 1.00, 0.98, 0.97, 0.96, 0.97, 0.99, 1.00, 1.01, 1.02],
}

SOUTH_STATES = {
    "karnataka", "andhra pradesh", "telangana", "kerala",
    "tamil nadu", "puducherry", "goa",
}

CONF_LEVELS = ["very_low", "low", "medium", "high"]


def season_index(crop_key: str, month: int, state: str = None) -> float:
    """Price index for a calendar month (1-12) in the crop's annual cycle."""
    idx = SEASONAL_INDEX.get((crop_key or "").lower().strip(), SEASONAL_INDEX["_generic"])
    shift = -1 if (state or "").strip().lower() in SOUTH_STATES else 0
    m = ((month - 1 + shift) % 12) + 1
    return idx[m - 1]


def season_phrase(idx: float) -> str:
    """Human-readable description of a month's position in the cycle."""
    if idx >= 1.15:
        return "lean-supply, high-demand season"
    if idx >= 1.05:
        return "firm season"
    if idx >= 0.95:
        return "stable, near-average season"
    if idx >= 0.85:
        return "fresh-arrival season, prices softening"
    return "peak-arrival glut season"


def _momentum_ratio(price_history, days: int) -> float:
    """Damped recent trend projected over the storage window (clamped +-12%)."""
    if not price_history or len(price_history) < 2:
        return 0.0
    first = price_history[0].get("modal_price")
    last = price_history[-1].get("modal_price")
    if not first or not last:
        return 0.0
    pct = (last - first) / first
    scale = (days / 14.0) if days <= 14 else (14.0 / days)
    return max(-0.10, min(0.10, pct * 0.5 * scale))


def _estimate_ratio(future_estimates, days: int, current_modal_qt: float):
    """Ratio implied by the crop's 7/14/30-day demo outlook."""
    if not future_estimates or not current_modal_qt:
        return None
    try:
        buckets = sorted(
            (int(k.split("_")[0]), v["price"]) for k, v in future_estimates.items()
        )
    except (ValueError, KeyError, AttributeError):
        return None
    if not buckets:
        return None
    for bdays, price in buckets:
        if bdays >= days:
            return 1.0 + (price / current_modal_qt - 1.0) * (days / bdays)
    return buckets[-1][1] / current_modal_qt


def _confidence(days: int, seasonal_ratio: float, mom_ratio: float, max_safe_days) -> str:
    swing = abs(seasonal_ratio - 1.0)
    score = 2
    if days <= 7:
        score += 1
    elif days > 30:
        score -= 1
    if days > 60:
        score -= 1
    if swing > 0.30:
        score -= 1
    if max_safe_days and max_safe_days < 45 and days > 14:
        score -= 1
    s_sign = 0 if swing < 0.02 else (1 if seasonal_ratio > 1 else -1)
    m_sign = 0 if abs(mom_ratio) < 0.01 else (1 if mom_ratio > 0 else -1)
    if s_sign and m_sign:
        score += 1 if s_sign == m_sign else -1
    return CONF_LEVELS[max(0, min(3, score))]


def forecast_sale_price(
    crop_key: str,
    current_modal_qt: float,
    price_history,
    future_estimates,
    days: int,
    sale_date: date,
    today: date,
    state: str = None,
    max_safe_days=None,
) -> dict:
    """Forecast the modal price (Rs/quintal) on the planned sale date."""
    idx_today = season_index(crop_key, today.month, state)
    idx_sale = season_index(crop_key, sale_date.month, state)
    seasonal_ratio = idx_sale / idx_today if idx_today else 1.0
    mom = _momentum_ratio(price_history, days)
    anchor_qt = current_modal_qt
    if price_history:
        anchor_qt = price_history[-1].get("modal_price") or current_modal_qt
    est = _estimate_ratio(future_estimates, days, anchor_qt)

    if est is None:
        ratio = seasonal_ratio + mom
        weight = 0.0
    else:
        weight = 0.5 if days <= 14 else (0.3 if days <= 30 else 0.0)
        ratio = (1 - weight) * seasonal_ratio + weight * est + mom
    ratio = max(0.6, min(1.6, ratio))

    forecast_qt = current_modal_qt * ratio
    confidence = _confidence(days, seasonal_ratio, mom, max_safe_days)
    diff_pct = (ratio - 1.0) * 100
    month_name = sale_date.strftime("%B")
    phrase = season_phrase(idx_sale)
    if diff_pct >= 8:
        outlook = (
            f"{crop_key.title()} typically sells ~{round(diff_pct)}% higher "
            f"around {month_name} ({phrase})"
        )
    elif diff_pct <= -8:
        outlook = (
            f"{crop_key.title()} typically sells ~{round(-diff_pct)}% lower "
            f"around {month_name} ({phrase})"
        )
    else:
        outlook = (
            f"{crop_key.title()} prices are broadly flat vs today around "
            f"{month_name} ({phrase})"
        )

    return {
        "forecast_price_per_quintal": round(forecast_qt),
        "forecast_ratio": round(ratio, 4),
        "forecast_confidence": confidence,
        "season_index_today": round(idx_today, 3),
        "season_index_sale": round(idx_sale, 3),
        "seasonal_ratio": round(seasonal_ratio, 4),
        "momentum_pct": round(mom * 100, 2),
        "expert_weight": weight,
        "season_outlook": outlook,
        "sale_month_name": month_name,
    }
