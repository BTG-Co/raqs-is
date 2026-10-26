from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.schemas.transaction import TransactionApprove, TransactionCreate, TransactionResponse
from app.services.transaction import TransactionService
from app.core.dependencies import get_current_user, get_transaction_service, require_admin
from app.models.user import User


router = APIRouter(
    prefix="/transactions",
    tags=["transactions"]
)

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=TransactionResponse
)
def create(
    payload: TransactionCreate,
    service: Annotated[TransactionService, Depends(get_transaction_service)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    return service.create(payload, current_user)

@router.post(
    "/approve",
    status_code=status.HTTP_200_OK,
    response_model=list[TransactionResponse],
)
def approve(
    payload: TransactionApprove,
    service: Annotated[TransactionService, Depends(get_transaction_service)],
    _: Annotated[User, Depends(require_admin)],
):
    return service.approve(payload.ids)
    
@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[TransactionResponse],
    dependencies=[Depends(get_current_user)],
)
def get_list(service: Annotated[TransactionService, Depends(get_transaction_service)]):
    return service.get_list()

@router.get(
    "/{transaction_id}",
    status_code=status.HTTP_200_OK,
    response_model=TransactionResponse,
    dependencies=[Depends(get_current_user)],
)
def get_by_id(transaction_id: UUID, service: Annotated[TransactionService, Depends(get_transaction_service)]):
    return service.get_by_id(transaction_id)

@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_200_OK,
    response_model=None,
    dependencies=[Depends(require_admin)]
)
def delete(transaction_id: UUID, service: Annotated[TransactionService, Depends(get_transaction_service)]):
    return service.delete(transaction_id)