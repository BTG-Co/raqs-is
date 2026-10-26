from uuid import uuid4
from sqlalchemy import Boolean, Column, UUID, DateTime, Float, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import TransactionType

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    measurement_id = Column(UUID(as_uuid=True), ForeignKey("measurements.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"),nullable=False)
    unit_price = Column(Float, nullable=False)
    
    quantity = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    is_approved = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    creator = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="transactions"
    )