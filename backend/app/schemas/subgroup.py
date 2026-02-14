import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserOut


class SubgroupOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    label: str
    members: list[UserOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}
