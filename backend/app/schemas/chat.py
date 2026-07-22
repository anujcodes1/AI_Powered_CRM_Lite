from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question over CRM data")


class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
