import uuid

from sqlalchemy import Text, Float, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class Idea(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "ideas"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id")
    )
    subgroup_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subgroups.id")
    )
    summary: Mapped[str] = mapped_column(Text)
    sentiment: Mapped[float] = mapped_column(Float, default=0.0)
    support_count: Mapped[int] = mapped_column(Integer, default=1)
    challenge_count: Mapped[int] = mapped_column(Integer, default=0)

    session = relationship("Session", back_populates="ideas")
    subgroup = relationship("Subgroup")
