from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.inventory import InventoryRepository
from app.models.inventory import Inventory
from app.schemas.inventory import (
    InventoryCreate,
    InventoryDetailResponse,
    InventoryLedgerItem,
    InventoryResponse,
    InventoryStockView,
)
from app.schemas.user import UserCreatedByResponse
from app.repositories.measurement import MeasurementRepository
from app.repositories.measurement_conversion import MeasurementConversionRepository
from app.repositories.product import ProductRepository
from app.repositories.transaction import TransactionRepository
from app.repositories.user import UserRepository
from app.models.user import User
from app.models.enums import TransactionType
from app.services.unit_conversion import UnitConverter


class InventoryService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = InventoryRepository(session)
        self._measurement_repo = MeasurementRepository(session)
        self._product_repo = ProductRepository(session)
        self._user_repo = UserRepository(session)
        self._transaction_repo = TransactionRepository(session)
        self._conversion_repo = MeasurementConversionRepository(session)
        self._converter = UnitConverter(self._conversion_repo, self._product_repo)

    def create(self, payload: InventoryCreate, current_user: User) -> Inventory:
        if payload.product_id is None or payload.product_id == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Product ID is required."
            )
        if payload.measurement_id is None or payload.measurement_id == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Measurement ID is required."
            )
        if payload.current_stock is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Current stock is required."
            )
        # check if product exists
        product = self._product_repo.get_by_id(payload.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Product not found."
            )

        # check if measurement exists
        measurement = self._measurement_repo.get_by_id(payload.measurement_id)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Base measurement not found."
            )
        # check if user exists
        user = self._user_repo.get_by_id(current_user.id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Created by not found."
            )
        new_inventory = Inventory(**payload.model_dump(), created_by=current_user.id)

        return self._repo.create(new_inventory)

    def get_by_id(self, inventory_id: UUID) -> Inventory:
        inventory = self._repo.get_by_id(inventory_id)
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found."
            )
        return inventory

    def get_detail(self, inventory_id: UUID) -> InventoryDetailResponse:
        inventory = self.get_by_id(inventory_id)
        product = self._product_repo.get_by_id(inventory.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Product not found for inventory.",
            )

        stock_measurement = self._measurement_repo.get_by_id(inventory.measurement_id)
        base_measurement = self._measurement_repo.get_by_id(product.base_measurement_id)
        if stock_measurement is None or base_measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Measurement not found for inventory.",
            )

        stock_in_base = self._converter.convert(
            inventory.current_stock,
            inventory.measurement_id,
            product.base_measurement_id,
        )

        stock_views: list[InventoryStockView] = [
            InventoryStockView(
                measurement_id=stock_measurement.id,
                measurement_name=stock_measurement.name,
                short_name=stock_measurement.short_name,
                quantity=inventory.current_stock,
                is_stock_unit=True,
                is_base_unit=stock_measurement.id == product.base_measurement_id,
            )
        ]
        seen = {stock_measurement.id}

        if product.base_measurement_id not in seen:
            stock_views.append(
                InventoryStockView(
                    measurement_id=base_measurement.id,
                    measurement_name=base_measurement.name,
                    short_name=base_measurement.short_name,
                    quantity=stock_in_base,
                    is_stock_unit=False,
                    is_base_unit=True,
                )
            )
            seen.add(base_measurement.id)

        related = self._conversion_repo.get_by_base_measurement_id_list(product.base_measurement_id)
        for conversion in related:
            if conversion.converted_measurement_id in seen:
                continue
            converted = self._measurement_repo.get_by_id(conversion.converted_measurement_id)
            if converted is None:
                continue
            quantity = self._converter.convert(
                stock_in_base,
                product.base_measurement_id,
                conversion.converted_measurement_id,
            )
            stock_views.append(
                InventoryStockView(
                    measurement_id=converted.id,
                    measurement_name=converted.name,
                    short_name=converted.short_name,
                    quantity=quantity,
                    is_stock_unit=False,
                    is_base_unit=False,
                )
            )
            seen.add(converted.id)

        rows = self._transaction_repo.get_by_inventory_id(inventory_id)
        approved = [row for row in rows if row.is_approved]
        opening = inventory.current_stock
        for row in reversed(approved):
            stock_qty = self._converter.to_stock_unit(row.quantity, row.measurement_id, inventory)
            signed = -stock_qty if row.transaction_type == TransactionType.SALE else stock_qty
            opening -= signed

        balance = opening
        ledger: list[InventoryLedgerItem] = []
        for row in rows:
            stock_qty = self._converter.to_stock_unit(row.quantity, row.measurement_id, inventory)
            signed = -stock_qty if row.transaction_type == TransactionType.SALE else stock_qty
            running: float | None = None
            if row.is_approved:
                balance += signed
                running = balance
            ledger.append(
                InventoryLedgerItem(
                    id=row.id,
                    measurement_id=row.measurement_id,
                    transaction_type=row.transaction_type,
                    creator=UserCreatedByResponse.model_validate(row.creator),
                    unit_price=row.unit_price,
                    quantity=row.quantity,
                    total_price=row.total_price,
                    is_approved=row.is_approved,
                    stock_quantity=stock_qty,
                    signed_stock_delta=signed,
                    running_balance=running,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                )
            )

        return InventoryDetailResponse(
            inventory=InventoryResponse.model_validate(inventory),
            product_id=product.id,
            product_name=product.name,
            base_measurement_id=product.base_measurement_id,
            stock_views=stock_views,
            transactions=ledger,
        )

    def get_list_by_product_id(self, product_id: UUID) -> list[Inventory]:
        return self._repo.get_by_product_id_list(product_id)

    def get_inventory_list(self) -> list[Inventory]:
        return self._repo.get_list()

    def delete(self, inventory_id: UUID) -> None:
        inventory = self._repo.get_by_id(inventory_id)
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found."
            )
        return self._repo.delete(inventory)
