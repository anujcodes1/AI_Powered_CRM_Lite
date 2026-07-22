from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Numeric, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.enums import DealStage


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    stage = Column(SQLEnum(DealStage), nullable=False, default=DealStage.LEAD, index=True)
    value = Column(Numeric(12, 2), default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="deals")
    contact = relationship("Contact", back_populates="deals")

    def __repr__(self) -> str:
        return f"<Deal(id='{self.id}', title='{self.title}', stage='{self.stage}', value={self.value})>"
