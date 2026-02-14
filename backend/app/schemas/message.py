import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.message import MessageType


class MessageOut(BaseModel):
    id: uuid.UUID
    subgroup_id: uuid.UUID
    user_id: uuid.UUID | None = None
    display_name: str | None = None
    content: str
    msg_type: MessageType
    source_subgroup_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
