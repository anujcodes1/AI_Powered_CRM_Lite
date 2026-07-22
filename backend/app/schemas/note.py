from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NoteCreate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: str
    user_id: str
    contact_id: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
