import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.session import SessionStatus
from app.schemas.subgroup import SubgroupOut
from app.schemas.idea import IdeaOut
from app.schemas.message import MessageOut


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
    summary: str | None = None
    final_convergence: float | None = None

    model_config = {"from_attributes": True}


class SessionDetail(SessionOut):
    user_count: int = 0
    subgroup_count: int = 0


class SessionResults(BaseModel):
    id: uuid.UUID
    title: str
    status: SessionStatus
    created_at: datetime
    summary: str | None = None
    final_convergence: float | None = None
    subgroups: list[SubgroupOut] = []
    ideas: list[IdeaOut] = []
    messages: list[MessageOut] = []
