from datetime import date, datetime, time, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.inventory import InventoryRepository
from app.repositories.measurement import MeasurementRepository
from app.repositories.measurement_conversion import MeasurementConversionRepository
from app.repositories.product import ProductRepository
from app.repositories.transaction import TransactionRepository
from app.schemas.report import DailySalesProductRow, DailySalesReportResponse
from app.services.unit_conversion import UnitConverter


class ReportService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._transaction_repo = TransactionRepository(session)
        self._inventory_repo = InventoryRepository(session)
        self._product_repo = ProductRepository(session)
        self._measurement_repo = MeasurementRepository(session)
        self._converter = UnitConverter(
            MeasurementConversionRepository(session),
            ProductRepository(session),
        )

    def daily_sales(self, report_date: date | None = None) -> DailySalesReportResponse:
        day = report_date or datetime.now(timezone.utc).date()
        as_of = datetime.now(timezone.utc)
        kg = self._find_kg_measurement()
        if kg is None:
            return DailySalesReportResponse(
                date=day,
                as_of=as_of,
                total_kg=0.0,
                total_price=0.0,
                products=[],
            )

        start = datetime.combine(day, time.min)
        end = datetime.combine(day, time.max)
        rows = self._transaction_repo.get_approved_sales_between(start, end)

        totals: dict[UUID, DailySalesProductRow] = {}
        for row in rows:
            inventory = self._inventory_repo.get_by_id(row.inventory_id)
            if inventory is None:
                continue
            product = self._product_repo.get_by_id(inventory.product_id)
            if product is None:
                continue
            try:
                in_base = self._converter.convert(
                    row.quantity,
                    row.measurement_id,
                    product.base_measurement_id,
                )
                kg_amount = self._converter.convert(
                    in_base,
                    product.base_measurement_id,
                    kg.id,
                )
            except HTTPException:
                continue

            current = totals.get(product.id)
            if current is None:
                totals[product.id] = DailySalesProductRow(
                    product_id=product.id,
                    name=product.name,
                    kg=kg_amount,
                    total_price=row.total_price,
                )
            else:
                current.kg += kg_amount
                current.total_price += row.total_price

        products = sorted(totals.values(), key=lambda item: item.kg, reverse=True)
        return DailySalesReportResponse(
            date=day,
            as_of=as_of,
            total_kg=sum(item.kg for item in products),
            total_price=sum(item.total_price for item in products),
            products=products,
        )

    def _find_kg_measurement(self):
        for measurement in self._measurement_repo.get_list():
            short_name = (measurement.short_name or "").strip().lower()
            name = (measurement.name or "").strip().lower()
            if short_name == "kg" or name in {"kg", "kilogram", "kilograms"}:
                return measurement
        return None
