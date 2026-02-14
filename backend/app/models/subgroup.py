import uuid

from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class Subgroup(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "subgroups"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id")
    )
    label: Mapped[str] = mapped_column(String(20))

    session = relationship("Session", back_populates="subgroups")
    members = relationship("User", back_populates="subgroup")
    messages = relationship("Message", back_populates="subgroup", foreign_keys="Message.subgroup_id")
