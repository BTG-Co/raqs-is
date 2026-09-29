from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.utils.password import get_password_hash


class UserService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = UserRepository(session)

    def create(self, payload: UserCreate) -> User:
        if payload.username is None or payload.username == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Username is required."
            )
        if payload.password is None or payload.password == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Password is required."
            )
        new_user = User(
            username=payload.username,
            name=payload.name,
            password=get_password_hash(payload.password),
            role=payload.role
        )

        return self._repo.create(new_user)

    def get_all_users(self) -> list[User]:
        return self._repo.get_list()

    def get_by_id(self, user_id: UUID) -> User:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def get_by_username(self, username: str) -> User:
        user = self._repo.get_by_username(username)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def update(self, user_id: UUID, payload: UserUpdate) -> User:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        existing = self._repo.get_by_username(payload.username)
        if existing is not None and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")
        
        data = payload.model_dump(exclude_unset=True)
        if "password" in data and data["password"]:
            data["password"] = get_password_hash(data["password"])
        return self._repo.update(user, data)
    
    def delete(self, user_id: UUID) -> None:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return self._repo.delete(user)