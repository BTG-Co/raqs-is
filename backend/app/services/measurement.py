from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.measurement import MeasurementRepository
from app.schemas.measurement import MeasurementCreate, MeasurementUpdate
from app.models.measurement import Measurement
from app.repositories.measurement_conversion import MeasurementConversionRepository
from app.repositories.inventory import InventoryRepository
from app.repositories.product import ProductRepository


class MeasurementService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = MeasurementRepository(session)
        self._measurement_conversion_repo = MeasurementConversionRepository(session)
        self._inventory_repo = InventoryRepository(session)
        self._product_repo = ProductRepository(session)

    def create(self, payload: MeasurementCreate) -> Measurement:
        if payload.name is None or payload.name == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Name is required."
            )
        if payload.short_name is None or payload.short_name == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Short name is required."
            )
        measurement = self._repo.get_by_name(payload.name)
        if measurement is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Name already exists."
            )
        new_measurement = Measurement(**payload.model_dump())

        return self._repo.create(new_measurement)

    def get_list(self) -> list[Measurement]:
        return self._repo.get_list()

    def get_by_id(self, measurement_id: UUID) -> Measurement:
        measurement = self._repo.get_by_id(measurement_id)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement not found."
            )
        return measurement

    def get_by_name(self, name: str) -> Measurement:
        measurement = self._repo.get_by_name(name)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement not found."
            )
        return measurement

    def update(self, measurement_id: UUID, payload: MeasurementUpdate) -> Measurement:
        measurement = self._repo.get_by_id(measurement_id)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement not found."
            )
        existing = self._repo.get_by_name(payload.name)
        if existing is not None and existing.id != measurement.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Name already exists."
            )
        return self._repo.update(measurement, payload.model_dump(exclude_unset=True))

    def delete(self, measurement_id: UUID) -> None:
        measurement = self._repo.get_by_id(measurement_id)
        if measurement is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement not found."
            )

        base_measurement = self._measurement_conversion_repo.get_by_base_measurement_id_list(measurement_id)
        if base_measurement:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete measurement while there is a measurement conversion. Please delete the measurement conversion with the base measurement first."
            )

        converted_measurement = self._measurement_conversion_repo.get_by_converted_measurement_id_list(measurement_id)
        if converted_measurement:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete measurement while there is a measurement conversion. Please delete the measurement conversion with the converted measurement first."
            )

        inventories = self._inventory_repo.get_by_measurement_id_list(measurement_id)
        if inventories:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete measurement while there is an inventory. Please delete the inventory with the measurement first."
            )

        products = self._product_repo.get_by_measurement_id_list(measurement_id)
        if products:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete measurement while there is a product. Please delete the product with the measurement first."
            )


        return self._repo.delete(measurement)