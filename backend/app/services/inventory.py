from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.inventory import InventoryRepository
from app.models.inventory import Inventory
from app.schemas.inventory import InventoryCreate, InventoryUpdate
from app.repositories.measurement import MeasurementRepository
from app.repositories.product import ProductRepository


class InventoryService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = InventoryRepository(session)
        self._measurement_repo = MeasurementRepository(session)
        self._product_repo = ProductRepository(session)

    def create(self, payload: InventoryCreate) -> Inventory:
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
        if payload.amount is None or payload.amount == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Amount is required."
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
        new_inventory = Inventory(**payload.model_dump())

        return self._repo.create(new_inventory)

    def get_by_id(self, inventory_id: UUID) -> Inventory:
        inventory = self._repo.get_by_id(inventory_id)
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found."
            )
        return inventory

    def get_list_by_product_id(self, product_id: UUID) -> list[Inventory]:
        return self._repo.get_by_product_id_list(product_id)

    def get_inventory_list(self) -> list[Inventory]:
        return self._repo.get_list()
    
    def update(self, inventory_id: UUID, payload: InventoryUpdate) -> Inventory:
        inventory = self._repo.get_by_id(inventory_id)
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found."
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

        return self._repo.update(inventory, payload.model_dump(exclude_unset=True))

    def delete(self, inventory_id: UUID) -> None:
        inventory = self._repo.get_by_id(inventory_id)
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found."
            )
        return self._repo.delete(inventory)