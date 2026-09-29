from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.schemas.inventory import InventoryCreate, InventoryResponse, InventoryUpdate
from app.services.inventory import InventoryService
from app.core.dependencies import get_inventory_service



router = APIRouter(
    prefix="/inventory",
    tags=["inventory"]
)

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=InventoryResponse
)
def create(
    payload: InventoryCreate,
    service: Annotated[InventoryService, Depends(get_inventory_service)]
):
    return service.create(payload)

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[InventoryResponse]
)
def get_inventory_list(service: Annotated[InventoryService, Depends(get_inventory_service)]):
    return service.get_inventory_list()

@router.get(
    "/{inventory_id}",
    status_code=status.HTTP_200_OK,
    response_model=InventoryResponse
)
def get_by_id(
    inventory_id: UUID,
    service: Annotated[InventoryService, Depends(get_inventory_service)]
):
    return service.get_by_id(inventory_id)

@router.patch(
    "/{inventory_id}",
    status_code=status.HTTP_200_OK,
    response_model=InventoryResponse
)
def update(
    inventory_id: UUID,
    payload: InventoryUpdate,
    service: Annotated[InventoryService, Depends(get_inventory_service)]
):
    return service.update(inventory_id, payload)

@router.delete(
    "/{inventory_id}",
    status_code=status.HTTP_200_OK,
    response_model=None)
def delete(
    inventory_id: UUID,
    service: Annotated[InventoryService, Depends(get_inventory_service)]
):
    return service.delete(inventory_id)