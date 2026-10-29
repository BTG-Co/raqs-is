from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.schemas.inventory import InventoryCreate, InventoryDetailResponse, InventoryResponse
from app.services.inventory import InventoryService
from app.core.dependencies import get_current_user, get_inventory_service, require_admin
from app.models.user import User

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"]
)

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=InventoryResponse,
    dependencies=[Depends(require_admin)]
)
def create(
    payload: InventoryCreate,
    service: Annotated[InventoryService, Depends(get_inventory_service)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    return service.create(payload, current_user)

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[InventoryResponse],
    dependencies=[Depends(get_current_user)]
)
def get_inventory_list(service: Annotated[InventoryService, Depends(get_inventory_service)]):
    return service.get_inventory_list()

@router.get(
    "/{inventory_id}/detail",
    status_code=status.HTTP_200_OK,
    response_model=InventoryDetailResponse,
    dependencies=[Depends(require_admin)],
)
def get_detail(
    inventory_id: UUID,
    service: Annotated[InventoryService, Depends(get_inventory_service)],
):
    return service.get_detail(inventory_id)

@router.get(
    "/{inventory_id}",
    status_code=status.HTTP_200_OK,
    response_model=InventoryResponse,
    dependencies=[Depends(get_current_user)]
)
def get_by_id(
    inventory_id: UUID,
    service: Annotated[InventoryService, Depends(get_inventory_service)]
):
    return service.get_by_id(inventory_id)

@router.delete(
    "/{inventory_id}",
    status_code=status.HTTP_200_OK,
    response_model=None,
    dependencies=[Depends(require_admin)]
)
def delete(
    inventory_id: UUID,
    service: Annotated[InventoryService, Depends(get_inventory_service)]
):
    return service.delete(inventory_id)