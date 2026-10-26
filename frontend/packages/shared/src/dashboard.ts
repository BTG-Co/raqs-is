import { isLowStock } from "./constants";
import type { Inventory, Measurement, Product, User } from "./api/models";

export type ProductAmount = {
  productId: string;
  name: string;
  amount: number;
};

export type MeasurementShare = {
  measurementId: string;
  name: string;
  count: number;
  share: number;
};

export type StockRow = {
  id: string;
  productName: string;
  measurementName: string;
  measurementShort: string;
  amount: number;
  updatedAt: string;
  low: boolean;
};

export function sumInventoryByProduct(inventory: Inventory[], products: Product[]): ProductAmount[] {
  const names = new Map(products.map((product) => [product.id, product.name]));
  const totals = new Map<string, number>();
  for (const row of inventory) {
    totals.set(row.product_id, (totals.get(row.product_id) ?? 0) + row.current_stock);
  }
  return [...totals.entries()]
    .map(([productId, amount]) => ({
      productId,
      name: names.get(productId) ?? "Unknown product",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function productsPerBaseMeasurement(
  products: Product[],
  measurements: Measurement[],
): MeasurementShare[] {
  const names = new Map(measurements.map((measurement) => [measurement.id, measurement.name]));
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.base_measurement_id, (counts.get(product.base_measurement_id) ?? 0) + 1);
  }
  const total = products.length || 1;
  return [...counts.entries()]
    .map(([measurementId, count]) => ({
      measurementId,
      name: names.get(measurementId) ?? "Unknown",
      count,
      share: count / total,
    }))
    .sort((a, b) => b.count - a.count);
}

export function stockRows(
  inventory: Inventory[],
  products: Product[],
  measurements: Measurement[],
): StockRow[] {
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const measurementNames = new Map(
    measurements.map((measurement) => [measurement.id, measurement]),
  );
  return inventory.map((row) => {
    const measurement = measurementNames.get(row.measurement_id);
    return {
      id: row.id,
      productName: productNames.get(row.product_id) ?? "Unknown product",
      measurementName: measurement?.name ?? "Unknown",
      measurementShort: measurement?.short_name ?? "",
      amount: row.current_stock,
      updatedAt: row.updated_at,
      low: isLowStock(row.current_stock),
    };
  });
}

export function lowStockRows(rows: StockRow[]): StockRow[] {
  return rows.filter((row) => row.low).sort((a, b) => a.amount - b.amount);
}

export function recentInventory(rows: StockRow[], limit = 8): StockRow[] {
  return [...rows].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, limit);
}

export function dashboardStats(input: {
  products: Product[];
  inventory: Inventory[];
  measurements: Measurement[];
  users: User[];
  role: "ADMIN" | "STAFF";
}) {
  const rows = stockRows(input.inventory, input.products, input.measurements);
  const low = lowStockRows(rows);
  const withStock = new Set(input.inventory.map((row) => row.product_id)).size;
  return {
    productCount: input.products.length,
    inventoryCount: input.inventory.length,
    lowStockCount: low.length,
    fourth:
      input.role === "ADMIN"
        ? { label: "Users", value: input.users.length }
        : { label: "Measurements", value: input.measurements.length },
    productsInStock: withStock,
    byProduct: sumInventoryByProduct(input.inventory, input.products),
    byMeasurement: productsPerBaseMeasurement(input.products, input.measurements),
    lowStock: low,
    recent: recentInventory(rows),
  };
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let duration = Math.round((then - now) / 1000);
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) return formatter.format(Math.round(duration), unit);
    duration /= amount;
  }
  return formatter.format(Math.round(duration), "year");
}
