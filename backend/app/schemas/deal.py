from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import DealStage
from app.schemas.contact import ContactResponse


class DealBase(BaseModel):
    title: str
    contact_id: str
    stage: DealStage = DealStage.LEAD
    value: float = 0.0


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    title: Optional[str] = None
    contact_id: Optional[str] = None
    stage: Optional[DealStage] = None
    value: Optional[float] = None


class DealResponse(DealBase):
    id: str
    user_id: str
    contact: Optional[ContactResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
