from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ApprovalStatus
from app.models.inventory_update_request import InventoryUpdateRequest


class InventoryUpdateRequestRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, request: InventoryUpdateRequest) -> InventoryUpdateRequest:
        self._session.add(request)
        self._session.commit()
        self._session.refresh(request)
        return request

    def get_list(self) -> list[InventoryUpdateRequest]:
        stmt = select(InventoryUpdateRequest)
        return list(self._session.scalars(stmt).all())

    def get_by_id(self, request_id: UUID) -> InventoryUpdateRequest | None:
        return self._session.get(InventoryUpdateRequest, request_id)

    def get_pending_by_inventory_id(self, inventory_id: UUID) -> InventoryUpdateRequest | None:
        stmt = select(InventoryUpdateRequest).where(
            InventoryUpdateRequest.inventory_id == inventory_id,
            InventoryUpdateRequest.status == ApprovalStatus.PENDING,
        )
        return self._session.scalar(stmt)

    def save(self, request: InventoryUpdateRequest) -> InventoryUpdateRequest:
        self._session.commit()
        self._session.refresh(request)
        return request
