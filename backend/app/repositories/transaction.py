from datetime import datetime
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import TransactionType
from app.models.transaction import Transaction


class TransactionRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, transaction: Transaction) -> Transaction:
        self._session.add(transaction)
        self._session.commit()
        self._session.refresh(transaction)

        return transaction
    def get_list(self) -> list[Transaction]:
        stmt = select(Transaction)
        return list(self._session.scalars(stmt).all())

    def get_by_id(self, transaction_id: UUID) -> Transaction:
        return self._session.get(Transaction, transaction_id)
    
    def get_by_ids(self, transaction_ids: list[UUID]) -> list[Transaction]:
        stmt = select(Transaction).where(Transaction.id.in_(transaction_ids))
        return list(self._session.scalars(stmt))

    def get_by_inventory_id(self, inventory_id: UUID) -> list[Transaction]:
        stmt = (
            select(Transaction)
            .where(Transaction.inventory_id == inventory_id)
            .order_by(Transaction.created_at.asc())
        )
        return list(self._session.scalars(stmt).all())

    def get_by_created_by(self, created_by: UUID) -> list[Transaction]:
        stmt = select(Transaction).where(Transaction.created_by == created_by)
        return list(self._session.scalars(stmt))

    def get_approved_sales_between(self, start: datetime, end: datetime) -> list[Transaction]:
        stmt = (
            select(Transaction)
            .where(
                Transaction.is_approved.is_(True),
                Transaction.transaction_type == TransactionType.SALE,
                Transaction.created_at >= start,
                Transaction.created_at <= end,
            )
            .order_by(Transaction.created_at.asc())
        )
        return list(self._session.scalars(stmt).all())

    def delete(self, transaction: Transaction) -> None:
        self._session.delete(transaction)
        self._session.commit()