
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user import UserService
from app.core.dependencies import get_user_service, require_admin


router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(require_admin)]
)

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse
)
def create(
   payload: UserCreate,
   service: Annotated[UserService, Depends(get_user_service)]
):
    return service.create(payload)

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[UserResponse]
)
def get_all_users(
    service: Annotated[UserService, Depends(get_user_service)]
):
    return service.get_all_users()

@router.get(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=UserResponse
)
def get_by_id(
    user_id: UUID,
    service: Annotated[UserService, Depends(get_user_service)]
):
    return service.get_by_id(user_id)

@router.patch(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=UserResponse
)
def update(
    user_id: UUID,
    payload: UserUpdate,
    service: Annotated[UserService, Depends(get_user_service)]
):
    return service.update(user_id, payload)

@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=None
)
def delete(
    user_id: UUID,
    service: Annotated[UserService, Depends(get_user_service)]
):
    return service.delete(user_id)