from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.product import ProductRepository
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.repositories.measurement import MeasurementRepository
from app.repositories.inventory import InventoryRepository


class ProductService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = ProductRepository(session)
        self._measurement_repo = MeasurementRepository(session)
        self._inventory_repo = InventoryRepository(session)

    def create(self, payload: ProductCreate) -> Product:
        if payload.name is None or payload.name == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Name is required."
            )
        
        if payload.base_measurement_id is None or payload.base_measurement_id == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Base measurement is required."
            )
        
        # check if measurement exists
        measurement = self._measurement_repo.get_by_id(payload.base_measurement_id)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Base measurement not found."
            )
        
        new_product = Product(**payload.model_dump())

        return self._repo.create(new_product)

    def get_all_products(self) -> list[Product]:
        return self._repo.get_list()

    def get_by_id(self, product_id: UUID) -> Product:
        product = self._repo.get_by_id(product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found."
            )
        return product
    
    def get_product_by_name(self, name: str) -> Product:
        product = self._repo.get_by_name(name)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found."
            )
        return product

    def update(self, product_id: UUID, payload: ProductUpdate) -> Product:
        product = self._repo.get_by_id(product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found."
            )
        
        measurement = self._measurement_repo.get_by_id(payload.base_measurement_id)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement not found."
            )
        return self._repo.update(product, payload.model_dump(exclude_unset=True))

    def delete(self, product_id: UUID) -> None:
        product = self._repo.get_by_id(product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found."
            )

        inventories = self._inventory_repo.get_by_product_id_list(product_id)
        if inventories:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete product while inventory record exists. Please delete inventories with this product first."
            )
        return self._repo.delete(product)

