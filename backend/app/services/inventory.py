from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.inventory import InventoryRepository
from app.models.inventory import Inventory
from app.schemas.inventory import InventoryCreate
from app.repositories.measurement import MeasurementRepository
from app.repositories.product import ProductRepository
from app.repositories.user import UserRepository
from app.models.user import User


class InventoryService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = InventoryRepository(session)
        self._measurement_repo = MeasurementRepository(session)
        self._product_repo = ProductRepository(session)
        self._user_repo = UserRepository(session)

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