import uuid
from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    display_name: str
    join_code: str


class UserOut(BaseModel):
    id: uuid.UUID
    display_name: str
    session_id: uuid.UUID
    subgroup_id: uuid.UUID | None = None
    account_id: uuid.UUID | None = None
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}
