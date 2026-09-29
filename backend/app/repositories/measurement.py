from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.measurement import Measurement


class MeasurementRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, measurement: Measurement) -> Measurement:
        self._session.add(measurement)
        self._session.commit()
        self._session.refresh(measurement)

        return measurement

    def get_list(self) -> list[Measurement]:
        stmt = select(Measurement)
        result = self._session.scalars(stmt)
        return list(result.all())

    def get_by_id(self, measurement_id: UUID) -> Measurement | None:
        return self._session.get(Measurement, measurement_id)

    def get_by_name(self, name: str) -> Measurement | None:
        stmt = select(Measurement).where(Measurement.name == name)
        return self._session.scalar(stmt)

    def update(self, measurement: Measurement, data: dict) -> Measurement:
        for k, v in data.items():
            setattr(measurement, k, v)

        self._session.commit()
        self._session.refresh(measurement)

        return measurement

    def delete(self, measurement: Measurement) -> None:
        self._session.delete(measurement)
        self._session.commit()