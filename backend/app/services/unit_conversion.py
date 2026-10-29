from uuid import UUID
from fastapi import HTTPException, status

from app.models.inventory import Inventory
from app.repositories.measurement_conversion import MeasurementConversionRepository
from app.repositories.product import ProductRepository


class UnitConverter:
    """Convert quantities using ``1 base = N converted`` factors."""

    def __init__(
        self,
        conversion_repo: MeasurementConversionRepository,
        product_repo: ProductRepository,
    ) -> None:
        self._conversion_repo = conversion_repo
        self._product_repo = product_repo

    def to_stock_unit(
        self,
        quantity: float,
        from_measurement_id: UUID,
        inventory: Inventory,
    ) -> float:
        """Convert a quantity into the inventory row's stock unit.

        Example: product base = sako, conversion 1 sako = 25 kg, sale of 5 kg
        → 5 / 25 = 0.2 sako when inventory stock is kept in sako.
        """
        stock_measurement_id = inventory.measurement_id
        if from_measurement_id == stock_measurement_id:
            return quantity

        product = self._product_repo.get_by_id(inventory.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Product not found for inventory.",
            )

        base_id = product.base_measurement_id
        in_base = self.convert(quantity, from_measurement_id, base_id)
        return self.convert(in_base, base_id, stock_measurement_id)

    def convert(self, quantity: float, from_id: UUID, to_id: UUID) -> float:
        if from_id == to_id:
            return quantity

        conversion = self._conversion_repo.get_by_measurement_pair(from_id, to_id)
        if conversion is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="No measurement conversion found for this transaction.",
            )

        factor = conversion.base_measurement_to_converted_amount
        if factor == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Measurement conversion factor cannot be zero.",
            )

        # 1 base = factor converted (e.g. 1 sako = 25 kg)
        if from_id == conversion.base_measurement_id and to_id == conversion.converted_measurement_id:
            return quantity * factor
        if from_id == conversion.converted_measurement_id and to_id == conversion.base_measurement_id:
            return quantity / factor

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Measurement conversion does not match the requested units.",
        )
