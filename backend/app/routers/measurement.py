from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.schemas.measurement import MeasurementCreate, MeasurementResponse, MeasurementUpdate
from app.services.measurement import MeasurementService
from app.core.dependencies import get_current_user, get_measurement_service, require_admin


router = APIRouter(
    prefix="/measurements",
    tags=["measurements"],
)

@router.post(
    "",
    status_code=status.HTTP_200_OK,
    response_model=MeasurementResponse,
    dependencies=[Depends(require_admin)],
)
def create(
    payload: MeasurementCreate,
    service: Annotated[MeasurementService, Depends(get_measurement_service)]
):
    return service.create(payload)

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[MeasurementResponse],
    dependencies=[Depends(get_current_user)],
)
def get_measurement_list(
    service: Annotated[MeasurementService, Depends(get_measurement_service)]
):
    return service.get_list()

@router.get(
    "/{measurement_id}",
    status_code=status.HTTP_200_OK,
    response_model=MeasurementResponse,
    dependencies=[Depends(get_current_user)],
)
def get_by_id(
    measurement_id: UUID,
    service: Annotated[MeasurementService, Depends(get_measurement_service)]
):
    return service.get_by_id(measurement_id)

@router.patch(
    "/{measurement_id}",
    status_code=status.HTTP_200_OK,
    response_model=MeasurementResponse,
    dependencies=[Depends(require_admin)],
)
def update(
    measurement_id: UUID,
    payload: MeasurementUpdate,
    service: Annotated[MeasurementService, Depends(get_measurement_service)]
):
    return service.update(measurement_id, payload)

@router.delete(
    "/{measurement_id}",
    status_code=status.HTTP_200_OK,
    response_model=None,
    dependencies=[Depends(require_admin)],
)
def delete(
    measurement_id: UUID,
    service: Annotated[MeasurementService, Depends(get_measurement_service)]
):
    return service.delete(measurement_id)