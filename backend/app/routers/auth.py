from typing import Annotated
from fastapi import APIRouter, Depends, Form, HTTPException, status

from app.schemas.auth import LoginForm
from app.schemas.user import UserResponse
from app.core.dependencies import get_auth_service, get_current_user
from app.services.auth import AuthService
from app.models.token import Token
from app.models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post(
    "/user/token",
    status_code=status.HTTP_200_OK
)
def login_for_access_token(
    form_data: Annotated[LoginForm, Form()],
    service: Annotated[AuthService, Depends(get_auth_service)]
):
    user = service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
    
    role = user.role.value if hasattr(user.role, "value") else user.role
    access_token = service.create_user_access_token(
        data={"sub": user.username, "role": role}
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=UserResponse,
)
def me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user