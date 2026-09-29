from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.measurement_conversion import MeasurementConversion
from app.repositories.measurement_conversion import MeasurementConversionRepository
from app.schemas.measurement_conversion import MeasurementConversionCreate, MeasurementConversionUpdate
from app.repositories.measurement import MeasurementRepository


class MeasurementConversionService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = MeasurementConversionRepository(session)
        self._measurement_repo = MeasurementRepository(session)

    def create(self, payload: MeasurementConversionCreate) -> MeasurementConversion:
        if payload.base_measurement_id is None or payload.base_measurement_id == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Base Measurement ID is required."
            )
        if payload.converted_measurement_id is None or payload.converted_measurement_id == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Converted Measurement ID is required."
            )
        if payload.name is None or payload.name == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Name is required."
            )

        # check if base measurement exists
        base_measurement = self._measurement_repo.get_by_id(payload.base_measurement_id)
        if base_measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Base measurement not found."
            )

        # check if converted measurement exists
        converted_measurement = self._measurement_repo.get_by_id(payload.converted_measurement_id)
        if converted_measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Converted measurement not found."
            )

        new_measurement_conversion = MeasurementConversion(**payload.model_dump())

        return self._repo.create(new_measurement_conversion)

    def get_by_id(self, measurement_conversion_id: UUID) -> MeasurementConversion:
        measurement_conversion = self._repo.get_by_id(measurement_conversion_id)
        if measurement_conversion is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement conversion not found."
            )
        return measurement_conversion

    def get_list(self) -> list[MeasurementConversion]:
        return self._repo.get_list()

    def get_base_measurement_list(self, base_measurement_id: UUID) -> list[MeasurementConversion]:
        return self._repo.get_by_base_measurement_id_list(base_measurement_id)

    def get_converted_measurement_list(self, converted_measurement_id: UUID) -> list[MeasurementConversion]:
        return self._repo.get_by_converted_measurement_id_list(converted_measurement_id)

    def update(self, measurement_conversion_id: UUID, payload: MeasurementConversionUpdate) -> MeasurementConversion:
        measurement_conversion = self._repo.get_by_id(measurement_conversion_id)
        if measurement_conversion is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement conversion not found."
            )
        
        # check if base measurement exists
        base_measurement = self._measurement_repo.get_by_id(payload.base_measurement_id)
        if base_measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Base measurement not found."
            )

        # check if converted measurement exists
        converted_measurement = self._measurement_repo.get_by_id(payload.converted_measurement_id)
        if converted_measurement is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Converted measurement not found."
            )
        return self._repo.update(measurement_conversion, payload.model_dump(exclude_unset=True))

    def delete(self, measurement_conversion_id: UUID) -> None:
        measurement_conversion = self._repo.get_by_id(measurement_conversion_id)
        if measurement_conversion is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Measurement conversion not found."
            )
        return self._repo.delete(measurement_conversion)