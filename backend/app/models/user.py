import uuid

from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class User(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "users"

    display_name: Mapped[str] = mapped_column(String(50))
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id")
    )
    subgroup_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subgroups.id"), nullable=True
    )
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    session = relationship("Session", back_populates="users")
    subgroup = relationship("Subgroup", back_populates="members")
