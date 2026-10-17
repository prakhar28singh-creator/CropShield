from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class BatchCreate(BaseModel):
    farmer_name: str = Field(..., min_length=1)
    crop: str = Field(..., min_length=1)
    variety: Optional[str] = None
    quantity_kg: float = Field(..., gt=0)
    harvest_date: str
    location: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    district: str = Field(..., min_length=1)
    storage_type: str
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    intended_sell_date: Optional[str] = None
    visible_condition: str = "fresh"

    @field_validator("harvest_date")
    @classmethod
    def validate_harvest_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("harvest_date must be YYYY-MM-DD")
        return v

    @field_validator("temperature_c")
    @classmethod
    def validate_temp(cls, v):
        if v is not None and (v < -10 or v > 60):
            raise ValueError("temperature_c must be between -10 and 60")
        return v

    @field_validator("humidity_pct")
    @classmethod
    def validate_humidity(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("humidity_pct must be between 0 and 100")
        return v


class BatchResponse(BaseModel):
    id: int
    farmer_name: str
    crop: str
    variety: Optional[str]
    quantity_kg: float
    harvest_date: str
    location: str
    state: str = ""
    district: str
    storage_type: str
    temperature_c: Optional[float]
    humidity_pct: Optional[float]
    intended_sell_date: Optional[str]
    visible_condition: str
    created_at: str


class AssessmentResponse(BaseModel):
    id: int
    batch_id: int
    risk_score: float
    risk_category: str
    risk_factors: list
    quantity_at_risk_kg: float
    recommended_actions: list
    sell_now_return: Optional[float]
    store_return: Optional[float]
    recommendation: str
    recommendation_reason: str
    assumptions: list
    created_at: str
