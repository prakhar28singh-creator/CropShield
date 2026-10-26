"""
Rules-based spoilage risk engine for post-harvest crops.
Based on published agricultural guidance for Indian conditions.
"""

from datetime import datetime, date
from typing import Optional

CROP_PROFILES = {
    "tomato": {
        "optimal_temp_min": 13,
        "optimal_temp_max": 21,
        "optimal_humidity_min": 85,
        "optimal_humidity_max": 95,
        "max_safe_days": {
            "cold_storage": 21,
            "ventilated_room": 7,
            "open_room": 3,
            "bamboo_basket": 2,
            "gunny_bag": 2,
        },
        "high_risk_temp": 30,
        "high_risk_humidity": 90,
        "loss_rate_per_day": {
            "cold_storage": 0.01,
            "ventilated_room": 0.04,
            "open_room": 0.08,
            "bamboo_basket": 0.10,
            "gunny_bag": 0.10,
        },
        "display_name": "Tomato",
    },
    "potato": {
        "optimal_temp_min": 3,
        "optimal_temp_max": 10,
        "optimal_humidity_min": 90,
        "optimal_humidity_max": 95,
        "max_safe_days": {
            "cold_storage": 120,
            "ventilated_room": 30,
            "open_room": 14,
            "bamboo_basket": 10,
            "gunny_bag": 14,
        },
        "high_risk_temp": 25,
        "high_risk_humidity": 95,
        "loss_rate_per_day": {
            "cold_storage": 0.002,
            "ventilated_room": 0.01,
            "open_room": 0.02,
            "bamboo_basket": 0.025,
            "gunny_bag": 0.018,
        },
        "display_name": "Potato",
    },
    "onion": {
        "optimal_temp_min": 0,
        "optimal_temp_max": 4,
        "optimal_humidity_min": 65,
        "optimal_humidity_max": 70,
        "max_safe_days": {
            "cold_storage": 180,
            "ventilated_room": 60,
            "open_room": 30,
            "bamboo_basket": 20,
            "gunny_bag": 25,
        },
        "high_risk_temp": 30,
        "high_risk_humidity": 80,
        "loss_rate_per_day": {
            "cold_storage": 0.001,
            "ventilated_room": 0.005,
            "open_room": 0.015,
            "bamboo_basket": 0.02,
            "gunny_bag": 0.012,
        },
        "display_name": "Onion",
    },
    "wheat": {
        "optimal_temp_min": 10,
        "optimal_temp_max": 25,
        "optimal_humidity_min": 60,
        "optimal_humidity_max": 70,
        "max_safe_days": {
            "cold_storage": 365,
            "ventilated_room": 180,
            "open_room": 90,
            "bamboo_basket": 30,
            "gunny_bag": 120,
        },
        "high_risk_temp": 35,
        "high_risk_humidity": 75,
        "loss_rate_per_day": {
            "cold_storage": 0.0002,
            "ventilated_room": 0.001,
            "open_room": 0.003,
            "bamboo_basket": 0.005,
            "gunny_bag": 0.002,
        },
        "display_name": "Wheat",
    },
}


def _extended_crop_profile(
    display_name: str,
    optimal_temp_min: int,
    optimal_temp_max: int,
    optimal_humidity_min: int,
    optimal_humidity_max: int,
    high_risk_temp: int,
    high_risk_humidity: int,
    max_safe_days: dict,
    base_loss_rate: float,
) -> dict:
    loss_multipliers = {
        "cold_storage": 0.2,
        "ventilated_room": 0.5,
        "open_room": 1.0,
        "bamboo_basket": 1.25,
        "gunny_bag": 1.1,
    }
    return {
        "optimal_temp_min": optimal_temp_min,
        "optimal_temp_max": optimal_temp_max,
        "optimal_humidity_min": optimal_humidity_min,
        "optimal_humidity_max": optimal_humidity_max,
        "max_safe_days": max_safe_days,
        "high_risk_temp": high_risk_temp,
        "high_risk_humidity": high_risk_humidity,
        "loss_rate_per_day": {
            storage: round(base_loss_rate * multiplier, 4)
            for storage, multiplier in loss_multipliers.items()
        },
        "display_name": display_name,
    }


CROP_PROFILES.update({
    "rice": _extended_crop_profile(
        "Rice", 12, 25, 50, 65, 35, 75,
        {"cold_storage": 365, "ventilated_room": 180, "open_room": 120, "bamboo_basket": 60, "gunny_bag": 90},
        0.0003,
    ),
    "maize": _extended_crop_profile(
        "Maize", 10, 25, 55, 70, 35, 80,
        {"cold_storage": 365, "ventilated_room": 180, "open_room": 120, "bamboo_basket": 60, "gunny_bag": 90},
        0.0005,
    ),
    "chilli": _extended_crop_profile(
        "Chilli", 7, 10, 90, 95, 30, 98,
        {"cold_storage": 14, "ventilated_room": 5, "open_room": 3, "bamboo_basket": 2, "gunny_bag": 2},
        0.08,
    ),
    "brinjal": _extended_crop_profile(
        "Brinjal", 10, 12, 90, 95, 30, 98,
        {"cold_storage": 14, "ventilated_room": 5, "open_room": 3, "bamboo_basket": 2, "gunny_bag": 2},
        0.075,
    ),
    "cabbage": _extended_crop_profile(
        "Cabbage", 0, 5, 90, 95, 30, 98,
        {"cold_storage": 60, "ventilated_room": 14, "open_room": 7, "bamboo_basket": 5, "gunny_bag": 7},
        0.03,
    ),
    "cauliflower": _extended_crop_profile(
        "Cauliflower", 0, 4, 90, 95, 30, 98,
        {"cold_storage": 21, "ventilated_room": 5, "open_room": 3, "bamboo_basket": 2, "gunny_bag": 2},
        0.07,
    ),
    "okra": _extended_crop_profile(
        "Okra", 7, 10, 90, 95, 30, 98,
        {"cold_storage": 14, "ventilated_room": 4, "open_room": 2, "bamboo_basket": 1, "gunny_bag": 2},
        0.09,
    ),
    "mango": _extended_crop_profile(
        "Mango", 10, 13, 85, 90, 35, 98,
        {"cold_storage": 21, "ventilated_room": 7, "open_room": 4, "bamboo_basket": 2, "gunny_bag": 3},
        0.07,
    ),
    "banana": _extended_crop_profile(
        "Banana", 13, 14, 90, 95, 30, 98,
        {"cold_storage": 21, "ventilated_room": 7, "open_room": 4, "bamboo_basket": 2, "gunny_bag": 3},
        0.06,
    ),
})

STORAGE_DISPLAY = {
    "cold_storage": "Cold Storage",
    "ventilated_room": "Ventilated Room",
    "open_room": "Open Room",
    "bamboo_basket": "Bamboo Basket",
    "gunny_bag": "Gunny Bag",
}

CONDITION_MULTIPLIER = {
    "fresh": 1.0,
    "slight_damage": 1.4,
    "moderate_damage": 1.8,
    "severe_damage": 2.5,
}


def calculate_storage_days(harvest_date_str: str) -> int:
    harvest_date = datetime.strptime(harvest_date_str, "%Y-%m-%d").date()
    today = date.today()
    return max(0, (today - harvest_date).days)


def assess_risk(
    crop: str,
    storage_type: str,
    harvest_date_str: str,
    temperature_c: Optional[float],
    humidity_pct: Optional[float],
    quantity_kg: float,
    visible_condition: str = "fresh",
) -> dict:
    crop_key = crop.lower().strip()
    storage_key = storage_type.lower().replace(" ", "_")

    if crop_key not in CROP_PROFILES:
        crop_key = "tomato"
    profile = CROP_PROFILES[crop_key]

    if storage_key not in profile["max_safe_days"]:
        storage_key = "open_room"

    days_stored = calculate_storage_days(harvest_date_str)
    max_safe = profile["max_safe_days"][storage_key]
    loss_rate = profile["loss_rate_per_day"][storage_key]

    condition_mult = CONDITION_MULTIPLIER.get(visible_condition, 1.0)

    risk_score = 0.0
    risk_factors = []
    recommended_actions = []

    time_ratio = days_stored / max_safe if max_safe > 0 else 1.0
    if days_stored > max_safe:
        time_score = 40
        risk_factors.append(
            f"Storage duration ({days_stored} days) exceeds recommended maximum ({max_safe} days) for {STORAGE_DISPLAY.get(storage_key, storage_key)}"
        )
        recommended_actions.append("Arrange immediate sale or transport — produce has exceeded safe storage duration")
    elif time_ratio > 0.75:
        time_score = 28
        risk_factors.append(
            f"Storage duration ({days_stored} days) is approaching the safe limit ({max_safe} days)"
        )
        recommended_actions.append("Plan sale within the next 1–2 days to avoid additional losses")
    elif time_ratio > 0.5:
        time_score = 15
        risk_factors.append(f"Produce has been stored for {days_stored} days")
    else:
        time_score = 5
    risk_score += time_score

    temp_score = 0
    if temperature_c is not None:
        if temperature_c > profile["high_risk_temp"]:
            temp_score = 30
            risk_factors.append(
                f"Temperature ({temperature_c}°C) exceeds safe limit ({profile['high_risk_temp']}°C)"
            )
            recommended_actions.append(
                f"Move produce to a cooler location. Optimal: {profile['optimal_temp_min']}–{profile['optimal_temp_max']}°C"
            )
        elif temperature_c > profile["optimal_temp_max"]:
            temp_score = 18
            risk_factors.append(
                f"Temperature ({temperature_c}°C) is above optimal range ({profile['optimal_temp_min']}–{profile['optimal_temp_max']}°C)"
            )
            recommended_actions.append("Improve ventilation or shade to reduce temperature")
        elif temperature_c < profile["optimal_temp_min"]:
            temp_score = 8
            risk_factors.append(
                f"Temperature ({temperature_c}°C) is below optimal range — monitor for chilling injury"
            )
        else:
            temp_score = 0
    else:
        temp_score = 8
        risk_factors.append("Temperature not recorded — unable to assess thermal risk")
        recommended_actions.append("Record and monitor storage temperature regularly")
    risk_score += temp_score

    humidity_score = 0
    if humidity_pct is not None:
        if humidity_pct > profile["high_risk_humidity"] and crop_key in ("tomato",):
            humidity_score = 20
            risk_factors.append(
                f"Humidity ({humidity_pct}%) is very high — increases mould and rot risk"
            )
            recommended_actions.append("Improve air circulation to reduce humidity around produce")
        elif humidity_pct < profile["optimal_humidity_min"]:
            humidity_score = 15
            risk_factors.append(
                f"Humidity ({humidity_pct}%) is below optimal ({profile['optimal_humidity_min']}%) — produce may dehydrate"
            )
            recommended_actions.append("Cover produce lightly to reduce moisture loss")
        elif humidity_pct > profile["optimal_humidity_max"] + 5:
            humidity_score = 12
            risk_factors.append(
                f"Humidity ({humidity_pct}%) is above optimal range — monitor for fungal growth"
            )
        else:
            humidity_score = 2
    else:
        humidity_score = 5
        risk_factors.append("Humidity not recorded")
        recommended_actions.append("Monitor humidity levels — target {}-{}%".format(
            profile["optimal_humidity_min"], profile["optimal_humidity_max"]
        ))
    risk_score += humidity_score

    storage_score = 0
    if storage_key == "open_room" or storage_key in ("bamboo_basket", "gunny_bag"):
        storage_score = 10
        risk_factors.append(
            f"Storage method ({STORAGE_DISPLAY.get(storage_key, storage_key)}) provides limited protection"
        )
        recommended_actions.append(
            "Consider upgrading to ventilated storage or arrange cold storage for extended keeping"
        )
    elif storage_key == "ventilated_room":
        storage_score = 3
    risk_score += storage_score

    condition_score = 0
    if visible_condition == "slight_damage":
        condition_score = 5
        risk_factors.append("Visible minor damage noted — inspect and segregate affected units")
        recommended_actions.append("Sort and remove any damaged produce to prevent spreading")
    elif visible_condition == "moderate_damage":
        condition_score = 15
        risk_factors.append("Moderate visible damage — spoilage may spread rapidly")
        recommended_actions.append("Remove damaged produce immediately and prioritise early sale")
    elif visible_condition == "severe_damage":
        condition_score = 25
        risk_factors.append("Severe damage observed — significant losses expected")
        recommended_actions.append("Sell or process remaining produce as soon as possible")
    risk_score += condition_score

    risk_score = min(risk_score * condition_mult, 100)

    if risk_score >= 60:
        risk_category = "High"
    elif risk_score >= 35:
        risk_category = "Medium"
    else:
        risk_category = "Low"

    effective_loss_rate = loss_rate * condition_mult
    total_loss_fraction = min(effective_loss_rate * days_stored, 0.95)
    quantity_at_risk = round(quantity_kg * total_loss_fraction, 1)

    if not risk_factors:
        risk_factors.append("No significant risk factors identified at this time")
    if not recommended_actions:
        recommended_actions.append("Continue monitoring temperature and humidity")
        recommended_actions.append("Inspect produce every 24–48 hours")

    recommended_actions = list(dict.fromkeys(recommended_actions))

    return {
        "risk_score": round(risk_score, 1),
        "risk_category": risk_category,
        "risk_factors": risk_factors,
        "quantity_at_risk_kg": quantity_at_risk,
        "recommended_actions": recommended_actions,
        "days_stored": days_stored,
        "loss_rate_per_day": round(effective_loss_rate * 100, 2),
        "crop_profile": profile,
        "storage_key": storage_key,
    }
