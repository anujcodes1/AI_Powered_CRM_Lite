from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    tags = Column(JSON, default=list, nullable=False)
    lead_score = Column(Integer, nullable=True)
    ai_score_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="contacts")
    deals = relationship("Deal", back_populates="contact", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="contact", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="contact", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Contact(id='{self.id}', name='{self.name}', email='{self.email}', score={self.lead_score})>"
