from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.transaction import TransactionRepository
from app.repositories.inventory import InventoryRepository
from app.repositories.measurement import MeasurementRepository
from app.repositories.measurement_conversion import MeasurementConversionRepository
from app.repositories.product import ProductRepository
from app.models.transaction import Transaction
from app.models.inventory import Inventory
from app.schemas.transaction import TransactionCreate
from app.models.enums import TransactionType
from app.models.user import User


class TransactionService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = TransactionRepository(session)
        self._inventory_repo = InventoryRepository(session)
        self._product_repo = ProductRepository(session)
        self._measurement_repo = MeasurementRepository(session)
        self._conversion_repo = MeasurementConversionRepository(session)

    def create(self, payload: TransactionCreate, current_user: User) -> Transaction:
        inventory = self._inventory_repo.get_by_id(payload.inventory_id)
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory ID not found"
            )
        measurement = self._measurement_repo.get_by_id(payload.measurement_id)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Measurement not found."
            )
        quantity = abs(payload.quantity)
        # Fail early if this quantity cannot be converted into the stock unit.
        self._quantity_in_stock_unit(quantity, payload.measurement_id, inventory)

        transaction = Transaction(
            inventory_id=payload.inventory_id,
            transaction_type=payload.transaction_type,
            measurement_id=payload.measurement_id,
            created_by=current_user.id,
            unit_price=payload.unit_price,
            quantity=quantity,
            total_price=quantity * payload.unit_price,
            is_approved=False
        )

        self._session.add(transaction)
        self._session.commit()
        self._session.refresh(transaction)
        
        return transaction

    def approve(self, transaction_ids: list[UUID]) -> list[Transaction]:
        if not transaction_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="No transactions to approve."
            )
        rows = self._repo.get_by_ids(transaction_ids)
        pending = [row for row in rows if not row.is_approved]

        if len(rows) != len(transaction_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found."
            )
        pending.sort(key=lambda row: row.created_at or "")
        by_inventory: dict[UUID, list[Transaction]] = {}

        for row in pending:
            by_inventory.setdefault(row.inventory_id, []).append(row)
        
        for inventory_id, group in by_inventory.items():
            inventory = self._inventory_repo.get_by_id(inventory_id)
            if inventory is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory ID not found.")
            balance = inventory.current_stock
            for row in group:
                stock_qty = self._quantity_in_stock_unit(row.quantity, row.measurement_id, inventory)
                signed = -stock_qty if row.transaction_type == TransactionType.SALE else stock_qty
                balance += signed
                if balance < 0:
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Not enough stock.")
                row.is_approved = True
            inventory.current_stock = balance
        self._session.commit()
        for row in pending:
            self._session.refresh(row)
        return pending
        
    def get_list(self) -> list[Transaction]:
        return self._repo.get_list()
    
    def get_by_id(self, transaction_id: UUID) -> Transaction:
        return self._repo.get_by_id(transaction_id)

    def delete(self, transaction_id: UUID) -> None:
        transaction = self._repo.get_by_id(transaction_id)
        if transaction is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found."
            )
        
        if transaction.is_approved:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An approved transaction cannot be deleted."
            )
        return self._repo.delete(transaction)

    def _quantity_in_stock_unit(
        self,
        quantity: float,
        from_measurement_id: UUID,
        inventory: Inventory,
    ) -> float:
        """Convert a transaction quantity into the inventory row's stock unit.

        Stock is stored in ``inventory.measurement_id``. Conversion goes through
        the product's ``base_measurement_id`` when the entered unit differs.
        ``base_measurement_to_converted_amount`` means 1 base = N converted.
        """
        stock_measurement_id = inventory.measurement_id
        if from_measurement_id == stock_measurement_id:
            return quantity

        product = self._product_repo.get_by_id(inventory.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Product not found for inventory."
            )

        base_id = product.base_measurement_id
        # Entered unit → product base
        in_base = self._convert(quantity, from_measurement_id, base_id)
        # Product base → inventory stock unit
        return self._convert(in_base, base_id, stock_measurement_id)

    def _convert(self, quantity: float, from_id: UUID, to_id: UUID) -> float:
        if from_id == to_id:
            return quantity

        conversion = self._conversion_repo.get_by_measurement_pair(from_id, to_id)
        if conversion is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="No measurement conversion found for this transaction."
            )

        factor = conversion.base_measurement_to_converted_amount
        if factor == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Measurement conversion factor cannot be zero."
            )

        # 1 base = factor converted
        if from_id == conversion.base_measurement_id and to_id == conversion.converted_measurement_id:
            return quantity * factor
        if from_id == conversion.converted_measurement_id and to_id == conversion.base_measurement_id:
            return quantity / factor

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Measurement conversion does not match the requested units."
        )
