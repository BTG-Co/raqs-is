from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.user import UserService
from app.services.inventory import InventoryService
from app.services.product import ProductService
from app.services.measurement import MeasurementService
from app.services.measurement_conversion import MeasurementConversionService
from app.services.auth import AuthService
from app.models.user import User
from app.models.enums import UserRole
from app.services.transaction import TransactionService
from app.services.report import ReportService


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    return InventoryService(db)

def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)

def get_measurement_service(db: Session = Depends(get_db)) -> MeasurementService:
    return MeasurementService(db)

def get_measurement_conversion_service(db: Session = Depends(get_db)) -> MeasurementConversionService:
    return MeasurementConversionService(db)

def get_transaction_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(db)

def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(db)

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)

oauth2_scheme = OAuth2PasswordBearer("/auth/user/token")

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    auth_user_service: Annotated[AuthService, Depends(get_auth_service)]
) -> User:
    return auth_user_service.get_user_from_token(token)

def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    return current_user

def require_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No sufficient privileges."
        )
    return current_user