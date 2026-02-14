import uuid
from datetime import datetime

from pydantic import BaseModel


class IdeaOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    subgroup_id: uuid.UUID
    summary: str
    sentiment: float
    support_count: int
    challenge_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
