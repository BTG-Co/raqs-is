from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_report_service, require_admin
from app.schemas.report import DailySalesReportResponse
from app.services.report import ReportService

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)


@router.get(
    "/daily-sales",
    status_code=status.HTTP_200_OK,
    response_model=DailySalesReportResponse,
    dependencies=[Depends(require_admin)],
)
def daily_sales(
    service: Annotated[ReportService, Depends(get_report_service)],
    report_date: Annotated[
        date | None,
        Query(
            alias="date",
            description="Calendar day for the sales report (YYYY-MM-DD). Defaults to today (UTC).",
        ),
    ] = None,
):
    return service.daily_sales(report_date)
