from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product


class ProductRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, product: Product) -> Product:
        self._session.add(product)
        self._session.commit()
        self._session.refresh(product)

        return product

    def get_list(self) -> list[Product]:
        stmt = select(Product)
        return self._session.scalars(stmt).all()

    def get_by_id(self, product_id: UUID) -> Product | None:
        return self._session.get(Product, product_id)

    def get_by_name(self, name: str) -> Product | None:
        stmt = select(Product).where(Product.name == name)
        result = self._session.scalar(stmt)
        return result

    def get_by_measurement_id_list(self, measurement_id: UUID) -> list[Product]:
        stmt = select(Product).where(Product.base_measurement_id == measurement_id)
        result = self._session.scalar(stmt)
        return result

    def update(self, product: Product, data: dict) -> Product:
        for k, v in data.items():
            setattr(product, k, v)
        
        self._session.commit()
        self._session.refresh(product)

        return product

    def delete(self, product: Product) -> None:
        self._session.delete(product)
        self._session.commit()