from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import ApprovalStatus
from app.models.inventory_update_request import InventoryUpdateRequest
from app.repositories.inventory_update_request import InventoryUpdateRequestRepository
from app.repositories.measurement import MeasurementRepository
from app.repositories.product import ProductRepository
from app.schemas.inventory import InventoryUpdate
from app.schemas.inventory_update_request import InventoryUpdateRequestCreate
from app.services.inventory import InventoryService


class InventoryUpdateRequestService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = InventoryUpdateRequestRepository(session)
        self._inventory = InventoryService(session)
        self._products = ProductRepository(session)
        self._measurements = MeasurementRepository(session)

    def create(self, payload: InventoryUpdateRequestCreate) -> InventoryUpdateRequest:
        if payload.requested_by is None or payload.requested_by.strip() == "":
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Requested by is required.")

        self._inventory.get_by_id(payload.inventory_id)
        if self._products.get_by_id(payload.product_id) is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Product not found.")
        if self._measurements.get_by_id(payload.measurement_id) is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Base measurement not found.")

        pending = self._repo.get_pending_by_inventory_id(payload.inventory_id)
        if pending is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An update for this inventory row is already waiting for approval.",
            )

        request = InventoryUpdateRequest(
            inventory_id=payload.inventory_id,
            product_id=payload.product_id,
            measurement_id=payload.measurement_id,
            amount=payload.amount,
            status=ApprovalStatus.PENDING,
            requested_by=payload.requested_by.strip(),
        )
        return self._repo.create(request)

    def get_list(self) -> list[InventoryUpdateRequest]:
        return self._repo.get_list()

    def approve(self, request_id: UUID) -> InventoryUpdateRequest:
        request = self._require_pending(request_id)
        self._inventory.update(
            request.inventory_id,
            InventoryUpdate(
                product_id=request.product_id,
                measurement_id=request.measurement_id,
                amount=request.amount,
            ),
        )
        request = self._repo.get_by_id(request_id)
        if request is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory update request not found.")
        request.status = ApprovalStatus.APPROVED
        return self._repo.save(request)

    def reject(self, request_id: UUID) -> InventoryUpdateRequest:
        request = self._require_pending(request_id)
        request.status = ApprovalStatus.REJECTED
        return self._repo.save(request)

    def _require_pending(self, request_id: UUID) -> InventoryUpdateRequest:
        request = self._repo.get_by_id(request_id)
        if request is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory update request not found.")
        if request.status != ApprovalStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This request is no longer pending.")
        return request
