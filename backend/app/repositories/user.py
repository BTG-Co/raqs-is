from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, user: User) -> User:
        self._session.add(user)
        self._session.commit()
        self._session.refresh(user)

        return user

    def get_list(self) -> list[User]:
        stmt = select(User)
        return self._session.scalars(stmt).all()

    def get_by_id(self, user_id: UUID) -> User | None:
        return self._session.get(User, user_id)
    
    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        return self._session.scalar(stmt)

    def update(self, user: User, data: dict) -> User:
        for k, v in data.items():
            setattr(user, k, v)
        
        self._session.commit()
        self._session.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self._session.delete(user)
        self._session.commit()