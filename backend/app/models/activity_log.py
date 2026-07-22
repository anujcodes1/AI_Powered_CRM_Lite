from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Text, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.enums import ActivityType


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SQLEnum(ActivityType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="activity_logs")
    contact = relationship("Contact", back_populates="activity_logs")

    def __repr__(self) -> str:
        return f"<ActivityLog(id='{self.id}', type='{self.type}', contact_id='{self.contact_id}')>"
