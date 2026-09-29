from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.user import UserService
from app.services.inventory import InventoryService
from app.services.product import ProductService
from app.services.measurement import MeasurementService
from app.services.measurement_conversion import MeasurementConversionService
from app.services.inventory_update_request import InventoryUpdateRequestService


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

def get_inventory_update_request_service(db: Session = Depends(get_db)) -> InventoryUpdateRequestService:
    return InventoryUpdateRequestService(db)