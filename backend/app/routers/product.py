from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product import ProductService
from app.core.dependencies import get_current_user, get_product_service, require_admin


router = APIRouter(
    prefix="/products",
    tags=["products"],
)

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ProductResponse,
    dependencies=[Depends(require_admin)],
)
def create(
    payload: ProductCreate,
    service: Annotated[ProductService, Depends(get_product_service)]
):
    return service.create(payload)

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[ProductResponse],
    dependencies=[Depends(get_current_user)],
)
def get_all_products(
    service: Annotated[ProductService, Depends(get_product_service)]
):
    return service.get_all_products()

@router.get(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    response_model=ProductResponse,
    dependencies=[Depends(get_current_user)],
)
def get_product_by_id(
    product_id: UUID,
    service: Annotated[ProductService, Depends(get_product_service)]
):
    return service.get_by_id(product_id)

@router.patch(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    response_model=ProductResponse,
    dependencies=[Depends(require_admin)],
)
def update(
    product_id: UUID,
    payload: ProductUpdate,
    service: Annotated[ProductService, Depends(get_product_service)]
):
    return service.update(product_id, payload)

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    response_model=None,
    dependencies=[Depends(require_admin)],
)
def delete(
    product_id: UUID,
    service: Annotated[ProductService, Depends(get_product_service)]
):
    return service.delete(product_id)