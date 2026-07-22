from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import ActivityType


class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    contact_id: str
    type: ActivityType
    description: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
