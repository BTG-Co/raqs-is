from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.schemas.measurement_conversion import MeasurementConversionCreate, MeasurementConversionResponse, MeasurementConversionUpdate
from app.services.measurement_conversion import MeasurementConversionService
from app.core.dependencies import get_current_user, get_measurement_conversion_service, require_admin


router = APIRouter(
    prefix="/measurement_conversions",
    tags=["measurement_conversions"],
)

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=MeasurementConversionResponse,
    dependencies=[Depends(require_admin)],
)
def create(
    payload: MeasurementConversionCreate,
    service: Annotated[MeasurementConversionService, Depends(get_measurement_conversion_service)]
):
    return service.create(payload)

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[MeasurementConversionResponse],
    dependencies=[Depends(get_current_user)],
)
def get_list(
    service: Annotated[MeasurementConversionService, Depends(get_measurement_conversion_service)]
):
    return service.get_list()

@router.get(
    "/{measurement_conversion_id}",
    status_code=status.HTTP_200_OK,
    response_model=MeasurementConversionResponse,
    dependencies=[Depends(get_current_user)],
)
def get_by_id(
    measurement_conversion_id: UUID,
    service: Annotated[MeasurementConversionService, Depends(get_measurement_conversion_service)]
):
    return service.get_by_id(measurement_conversion_id)

@router.patch(
    "/{measurement_conversion_id}",
    status_code=status.HTTP_200_OK,
    response_model=MeasurementConversionResponse,
    dependencies=[Depends(require_admin)],
)
def update(
    measurement_conversion_id: UUID,
    payload: MeasurementConversionUpdate,
    service: Annotated[MeasurementConversionService, Depends(get_measurement_conversion_service)]
):
    return service.update(measurement_conversion_id, payload)

@router.delete(
    "/{measurement_conversion_id}",
    status_code=status.HTTP_200_OK,
    response_model=None,
    dependencies=[Depends(require_admin)],
)
def delete(
    measurement_conversion_id: UUID,
    service: Annotated[MeasurementConversionService, Depends(get_measurement_conversion_service)]
):
    return service.delete(measurement_conversion_id)
