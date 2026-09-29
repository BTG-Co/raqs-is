from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.measurement_conversion import MeasurementConversion


class MeasurementConversionRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, measurement_conversion: MeasurementConversion) -> MeasurementConversion:
        self._session.add(measurement_conversion)
        self._session.commit()
        self._session.refresh(measurement_conversion)

        return measurement_conversion

    def get_list(self) -> list[MeasurementConversion]:
        stmt = select(MeasurementConversion)
        return list(self._session.scalars(stmt).all())

    def get_by_id(self, measurement_conversion_id: UUID) -> MeasurementConversion | None:
        return self._session.get(MeasurementConversion, measurement_conversion_id)
    
    def get_by_base_measurement_id_list(self, base_measurement_id: UUID) -> list[MeasurementConversion]:
        stmt = select(MeasurementConversion).where(MeasurementConversion.base_measurement_id == base_measurement_id)
        result = self._session.scalars(stmt)
        return list(result.all())

    def get_by_converted_measurement_id_list(self, converted_measurement_id: UUID) -> list[MeasurementConversion]:
        stmt = select(MeasurementConversion).where(MeasurementConversion.converted_measurement_id == converted_measurement_id)
        result = self._session.scalars(stmt)
        return list(result.all())

    def update(self, measurement_conversion: MeasurementConversion, data: dict) -> MeasurementConversion:
        for k, v in data.items():
            setattr(measurement_conversion, k, v)

        self._session.commit()
        self._session.refresh(measurement_conversion)

        return measurement_conversion

    def delete(self, measurement_conversion: MeasurementConversion) -> None:
        self._session.delete(measurement_conversion)
        self._session.commit()

