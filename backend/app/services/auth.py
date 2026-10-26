from fastapi import HTTPException, status
import jwt
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.repositories.user import UserRepository
from app.models.user import User
from app.utils.password import verify_password
from app.models.enums import UserRole

JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = settings.JWT_ALGORITHM

class AuthService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._user_repo = UserRepository(session)

    def authenticate_user(self, username: str, password: str) -> User | None:
        user = self._user_repo.get_by_username(username)
        if user is None:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def create_user_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))

        to_encode.update({ "exp": expire })
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

        return encoded_jwt

    def get_user_from_token(self, token: str) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )

        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            role = payload.get("role") 
            if role not in (UserRole.STAFF, UserRole.ADMIN):
                raise credentials_exception

            username = payload.get("sub")
            if username is None:
                raise credentials_exception
        except jwt.InvalidTokenError:
            raise credentials_exception

        user = self._user_repo.get_by_username(username)
        if user is None:
            raise credentials_exception

        return user
    