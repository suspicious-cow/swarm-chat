import enum
import uuid

from sqlalchemy import Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class MessageType(str, enum.Enum):
    human = "human"
    surrogate = "surrogate"
    contributor = "contributor"


class Message(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "messages"

    subgroup_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subgroups.id")
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text)
    msg_type: Mapped[MessageType] = mapped_column(
        Enum(MessageType), default=MessageType.human
    )
    source_subgroup_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subgroups.id"), nullable=True
    )

    subgroup = relationship("Subgroup", back_populates="messages", foreign_keys=[subgroup_id])
    user = relationship("User")
    source_subgroup = relationship("Subgroup", foreign_keys=[source_subgroup_id])
