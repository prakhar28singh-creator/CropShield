"""
Sell vs Store decision engine v2 - seasonal, risk-aware, practically
implementable for any crop/market combination in market_data.

How it works
------------
1. Estimate what the produce would fetch TODAY at the best available mandi
   (net of transport), reduced by the saleable fraction implied by the
   spoilage risk engine.
2. Forecast the price on a planned future sale date using the seasonal
   model (seasonal.py): annual crop cycle for the sale month, blended with
   the crop's short-term expert estimates and recent price momentum.
3. Compare risk-adjusted net returns:
     sell_now = saleable_kg_now x net_price_now x (1 - commission)
     store    = saleable_kg_at_sale x forecast_price x (1 - commission)
                - storage cost (realistic INR/kg/day by storage type)
4. Recommend Store only when storing beats selling by a safety margin
   (STORE_EDGE) and the price forecast is trustworthy; hard-guard against
   storing beyond the crop's safe shelf life for the chosen storage method.

All assumptions are listed so the farmer can see the math.
"""

from datetime import date, timedelta
from typing import Optional

from seasonal import forecast_sale_price

# Realistic holding costs (INR per kg per day) for Indian farm storage.
# Reference magnitudes: ambient godown ~INR 100-200/quintal/month;
# cold storage ~INR 150-300/quintal/month incl. electricity.
STORAGE_COST_BY_TYPE = {
    "open_room": 0.010,
    "gunny_bag": 0.008,
    "bamboo_basket": 0.010,
    "ventilated_room": 0.018,
    "cold_storage": 0.015,
}
STORAGE_DISPLAY = {
    "cold_storage": "Cold Storage",
    "ventilated_room": "Ventilated Room",
    "open_room": "Open Room",
    "bamboo_basket": "Bamboo Basket",
    "gunny_bag": "Gunny Bag",
}

# Storing must beat selling by this margin (fraction) to justify hassle+risk
STORE_EDGE = 0.06
# Below this edge, selling is clearly better
SELL_EDGE = -0.02


def calculate_decision(
    quantity_kg: float,
    risk_assessment: dict,
    market_prices: dict,
    days_to_sell_if_stored: int = 7,
    storage_cost_per_kg_per_day: Optional[float] = None,
    commission_pct: float = 0.08,
    crop: str = "",
    today: Optional[date] = None,
) -> dict:
    today = today or date.today()
    markets = market_prices.get("markets", [])
    if not markets:
        return {
            "recommendation": "Insufficient Data",
            "recommendation_reason": "No market price data available to make a recommendation.",
            "sell_now_return": None,
            "store_return": None,
            "assumptions": ["No market data available"],
        }

    best_market = markets[0]
    current_price_per_kg = best_market["net_price_per_kg"]
    current_modal_qt = best_market["modal_price"]
    state = best_market.get("state")

    risk_category = risk_assessment["risk_category"]
    loss_rate_per_day = risk_assessment["loss_rate_per_day"] / 100
    days_stored = risk_assessment["days_stored"]
    crop_profile = risk_assessment.get("crop_profile", {})
    storage_key = risk_assessment.get("storage_key", "open_room")

    crop_key = (crop or crop_profile.get("display_name") or "crop").lower().strip()
    max_safe_days = crop_profile.get("max_safe_days", {}).get(storage_key)
    days = max(1, int(days_to_sell_if_stored))
    sale_date = today + timedelta(days=days)

    # 1. Returns if selling now
    current_saleable_fraction = max(0.0, 1.0 - (loss_rate_per_day * days_stored))
    quantity_sellable_now = quantity_kg * current_saleable_fraction
    commission_now = current_price_per_kg * commission_pct
    r_sell_now = quantity_sellable_now * (current_price_per_kg - commission_now)

    # 2. Seasonal + trend + expert forecast for the sale date
    forecast = forecast_sale_price(
        crop_key=crop_key,
        current_modal_qt=current_modal_qt,
        price_history=market_prices.get("price_history"),
        future_estimates=market_prices.get("future_estimates"),
        days=days,
        sale_date=sale_date,
        today=today,
        state=state,
        max_safe_days=max_safe_days,
    )
    future_price_per_kg = forecast["forecast_price_per_quintal"] / 100.0
    confidence = forecast["forecast_confidence"]

    # 3. Returns if storing until the sale date
    additional_loss_fraction = loss_rate_per_day * days
    quantity_after_storage = quantity_sellable_now * max(0.0, 1.0 - additional_loss_fraction)

    if storage_cost_per_kg_per_day is None:
        storage_cost_per_kg_per_day = STORAGE_COST_BY_TYPE.get(storage_key, 0.012)
    storage_cost = quantity_kg * storage_cost_per_kg_per_day * days
    commission_future = future_price_per_kg * commission_pct
    r_store = quantity_after_storage * (future_price_per_kg - commission_future) - storage_cost

    r_sell_now = round(r_sell_now, 2)
    r_store = round(r_store, 2)
    edge = (r_store - r_sell_now) / max(abs(r_sell_now), 1.0)

    spoilage_pct = round(additional_loss_fraction * 100, 1)
    storage_total = round(storage_cost)
    month = forecast["sale_month_name"]
    outlook = forecast["season_outlook"]

    assumptions = [
        f"Best available market: {best_market['market']} (modal ₹{best_market['modal_price']}/quintal, net ₹{best_market['net_price_per_quintal']}/quintal after transport)",
        f"Commission deducted: {int(commission_pct * 100)}% of sale price",
        f"Current estimated saleable quantity: {round(quantity_sellable_now, 1)} kg ({round(current_saleable_fraction*100,1)}% of {quantity_kg} kg)",
        f"Storage cost assumed: ₹{storage_cost_per_kg_per_day}/kg/day for {STORAGE_DISPLAY.get(storage_key, storage_key)} ({days} days = ₹{storage_total})",
        f"Seasonal model: {crop_key} price index for {month} = {forecast['season_index_sale']} vs this month = {forecast['season_index_today']} (x{forecast['seasonal_ratio']})",
        f"Recent 14-day price momentum: {forecast['momentum_pct']:+.1f}% (damped projection)",
        f"Forecast modal price on {sale_date}: ₹{forecast['forecast_price_per_quintal']}/quintal (confidence: {confidence})",
        f"Expected additional spoilage over {days} days: ~{spoilage_pct}% at current conditions",
        "Estimates are model-based; actual returns may differ.",
    ]

    # 4. Verdict
    shelf_life_exceeded = bool(max_safe_days and days > max_safe_days)
    storage_name = STORAGE_DISPLAY.get(storage_key, storage_key)

    if risk_category == "High":
        recommendation = "Sell Now"
        reason = (
            f"Spoilage risk is HIGH. Selling immediately in {best_market['market']} returns an "
            f"estimated ₹{r_sell_now:,.0f} vs ₹{r_store:,.0f} if held {days} more days. "
            f"{outlook}, but high spoilage losses make storage risky — act now."
        )
    elif shelf_life_exceeded:
        recommendation = "Sell Now"
        reason = (
            f"{crop_key.title()} in {storage_name.lower()} is only safe for about {max_safe_days} days; "
            f"holding {days} days (to {sale_date}) exceeds that window and losses would mount. "
            f"Sell now for an estimated ₹{r_sell_now:,.0f}."
        )
    elif confidence == "very_low" and edge < STORE_EDGE:
        recommendation = "Sell Now"
        reason = (
            f"Storing could return ₹{r_store:,.0f} vs ₹{r_sell_now:,.0f} now, but the price "
            f"forecast for {month} has very low confidence. Selling now removes that uncertainty."
        )
    elif edge >= STORE_EDGE:
        recommendation = "Store Safely"
        reason = (
            f"Spoilage risk is {risk_category} and the seasonal outlook favours holding: "
            f"{outlook}. Storing {days} days to {sale_date} is estimated to return "
            f"₹{r_store:,.0f} vs ₹{r_sell_now:,.0f} now (forecast ₹{forecast['forecast_price_per_quintal']}/quintal, "
            f"confidence: {confidence}). Ensure proper storage conditions."
        )
    elif edge <= SELL_EDGE:
        recommendation = "Sell Now"
        reason = (
            f"Storing until {month} is estimated at ₹{r_store:,.0f} vs ₹{r_sell_now:,.0f} now — "
            f"{outlook.lower()}; after ~{spoilage_pct}% more spoilage and ₹{storage_total} storage cost, "
            f"selling now is the better option."
        )
    else:
        recommendation = "Sell Now"
        reason = (
            f"Returns are too close to call: ₹{r_sell_now:,.0f} now vs a riskier ₹{r_store:,.0f} "
            f"after {days} days ({outlook.lower()}). When the expected gain is only marginal, "
            f"selling now avoids spoilage and price uncertainty."
        )

    # Better nearby market — only when selling now (not for urgent High risk).
    # Markets list arrives sorted by net price descending, so we look for one
    # that pays nearly as well but is substantially closer to the farmer.
    if (
        recommendation == "Sell Now"
        and risk_category != "High"
        and len(markets) > 1
    ):
        best_net = markets[0]["net_price_per_quintal"]
        alt = next(
            (m for m in markets[1:]
             if m["net_price_per_quintal"] >= best_net * 0.95
             and m["distance_km"] <= max(0, markets[0]["distance_km"] - 100)),
            None,
        )
        if alt:
            recommendation = "Consider Another Market"
            reason = (
                f"{alt['market']} pays nearly as well (net ₹{alt['net_price_per_quintal']}/quintal vs "
                f"₹{best_net}/quintal) and is ~{markets[0]['distance_km'] - alt['distance_km']} km closer — "
                f"consider selling there to cut transport cost and travel time."
            )

    return {
        "recommendation": recommendation,
        "recommendation_reason": reason,
        "sell_now_return": r_sell_now,
        "store_return": r_store,
        "best_market": best_market,
        "quantity_sellable_now": round(quantity_sellable_now, 1),
        "quantity_after_storage": round(quantity_after_storage, 1),
        "assumptions": assumptions,
        "days_to_sell_if_stored": days,
        "future_price_confidence": confidence,
        # Seasonal-model fields (used by the UI season strip)
        "sale_date": str(sale_date),
        "sale_date_display": sale_date.strftime("%d %b %Y"),
        "forecast_price_per_quintal": forecast["forecast_price_per_quintal"],
        "forecast_confidence": confidence,
        "season_outlook": forecast["season_outlook"],
        "season_index_today": forecast["season_index_today"],
        "season_index_sale": forecast["season_index_sale"],
        "storage_cost_per_kg_per_day": storage_cost_per_kg_per_day,
        "shelf_life_days": max_safe_days,
        "edge_pct": round(edge * 100, 1),
    }
