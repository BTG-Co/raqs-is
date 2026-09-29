from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory import Inventory


class InventoryRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, inventory: Inventory) -> Inventory:
        self._session.add(inventory)
        self._session.commit()
        self._session.refresh(inventory)

        return inventory

    def get_list(self) -> list[Inventory]:
        stmt = select(Inventory)
        return list(self._session.scalars(stmt).all())

    def get_by_id(self, inventory_id: UUID) -> Inventory | None:
        return self._session.get(Inventory, inventory_id)

    def get_by_product_id_list(self, product_id: UUID) -> list[Inventory]:
        stmt = select(Inventory).where(Inventory.product_id == product_id)
        result = self._session.scalars(stmt)
        return list(result.all())

    def get_by_measurement_id_list(self, measurement_id: UUID) -> list[Inventory]:
        stmt = select(Inventory).where(Inventory.measurement_id == measurement_id)
        result = self._session.scalars(stmt)
        return list(result.all())

    def update(self, inventory: Inventory, data: dict) -> Inventory:
        for k, v in data.items():
            setattr(inventory, k, v)
        
        self._session.commit()
        self._session.refresh(inventory)

        return inventory

    def delete(self, inventory: Inventory) -> None:
        self._session.delete(inventory)
        self._session.commit()

    