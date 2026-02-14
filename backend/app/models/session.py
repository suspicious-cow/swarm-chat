import enum
import uuid
import random
import string

from sqlalchemy import String, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class SessionStatus(str, enum.Enum):
    waiting = "waiting"
    active = "active"
    completed = "completed"


def generate_join_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Session(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "sessions"

    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus), default=SessionStatus.waiting
    )
    subgroup_size: Mapped[int] = mapped_column(Integer, default=5)
    join_code: Mapped[str] = mapped_column(
        String(8), unique=True, default=generate_join_code
    )

    users = relationship("User", back_populates="session")
    subgroups = relationship("Subgroup", back_populates="session")
    ideas = relationship("Idea", back_populates="session")
