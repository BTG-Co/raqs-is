from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_inventory_update_request_service
from app.schemas.inventory_update_request import InventoryUpdateRequestCreate, InventoryUpdateRequestResponse
from app.services.inventory_update_request import InventoryUpdateRequestService


router = APIRouter(
    prefix="/inventory_update_requests",
    tags=["inventory_update_requests"],
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=InventoryUpdateRequestResponse,
)
def create(
    payload: InventoryUpdateRequestCreate,
    service: Annotated[InventoryUpdateRequestService, Depends(get_inventory_update_request_service)],
):
    return service.create(payload)


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[InventoryUpdateRequestResponse],
)
def get_list(service: Annotated[InventoryUpdateRequestService, Depends(get_inventory_update_request_service)]):
    return service.get_list()


@router.post(
    "/{request_id}/approve",
    status_code=status.HTTP_200_OK,
    response_model=InventoryUpdateRequestResponse,
)
def approve(
    request_id: UUID,
    service: Annotated[InventoryUpdateRequestService, Depends(get_inventory_update_request_service)],
):
    return service.approve(request_id)


@router.post(
    "/{request_id}/reject",
    status_code=status.HTTP_200_OK,
    response_model=InventoryUpdateRequestResponse,
)
def reject(
    request_id: UUID,
    service: Annotated[InventoryUpdateRequestService, Depends(get_inventory_update_request_service)],
):
    return service.reject(request_id)
