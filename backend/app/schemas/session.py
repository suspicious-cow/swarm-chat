import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.session import SessionStatus


class SessionCreate(BaseModel):
    title: str
    subgroup_size: int = 5


class SessionOut(BaseModel):
    id: uuid.UUID
    title: str
    status: SessionStatus
    join_code: str
    subgroup_size: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionDetail(SessionOut):
    user_count: int = 0
    subgroup_count: int = 0
