import { isLowStock } from "./constants";
import type {
  Inventory,
  Measurement,
  MeasurementConversion,
  Product,
  Transaction,
  User,
} from "./api/models";

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

export type DailyProductSale = {
  productId: string;
  name: string;
  kg: number;
  totalPrice: number;
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

/** Format a YYYY-MM-DD or ISO datetime as a readable report date. */
export function formatReportDate(value: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function toDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameLocalDay(iso: string, day = startOfLocalDay()): boolean {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return false;
  return (
    then.getFullYear() === day.getFullYear() &&
    then.getMonth() === day.getMonth() &&
    then.getDate() === day.getDate()
  );
}

export function findKgMeasurement(measurements: Measurement[]): Measurement | undefined {
  return measurements.find((measurement) => {
    const shortName = measurement.short_name.trim().toLowerCase();
    const name = measurement.name.trim().toLowerCase();
    return shortName === "kg" || name === "kg" || name === "kilogram" || name === "kilograms";
  });
}

function convertQuantity(
  quantity: number,
  fromId: string,
  toId: string,
  conversions: MeasurementConversion[],
): number | null {
  if (fromId === toId) return quantity;
  const conversion = conversions.find(
    (row) =>
      (row.base_measurement_id === fromId && row.converted_measurement_id === toId) ||
      (row.base_measurement_id === toId && row.converted_measurement_id === fromId),
  );
  if (!conversion || conversion.base_measurement_to_converted_amount === 0) return null;
  const factor = conversion.base_measurement_to_converted_amount;
  // 1 base = factor converted
  if (fromId === conversion.base_measurement_id && toId === conversion.converted_measurement_id) {
    return quantity * factor;
  }
  if (fromId === conversion.converted_measurement_id && toId === conversion.base_measurement_id) {
    return quantity / factor;
  }
  return null;
}

function quantityInKg(
  quantity: number,
  fromMeasurementId: string,
  productBaseId: string,
  kgId: string,
  conversions: MeasurementConversion[],
): number | null {
  const inBase = convertQuantity(quantity, fromMeasurementId, productBaseId, conversions);
  if (inBase === null) return null;
  return convertQuantity(inBase, productBaseId, kgId, conversions);
}

/** Approved sales recorded today, converted to kg per product. */
export function dailySalesByProduct(input: {
  transactions: Transaction[];
  inventory: Inventory[];
  products: Product[];
  measurements: Measurement[];
  conversions: MeasurementConversion[];
  day?: Date;
}): DailyProductSale[] {
  const kg = findKgMeasurement(input.measurements);
  if (!kg) return [];

  const day = startOfLocalDay(input.day);
  const productById = new Map(input.products.map((product) => [product.id, product]));
  const inventoryById = new Map(input.inventory.map((row) => [row.id, row]));
  const totals = new Map<string, { name: string; kg: number; totalPrice: number }>();

  for (const row of input.transactions) {
    if (!row.is_approved || row.transaction_type !== "SALE") continue;
    if (!isSameLocalDay(row.created_at, day)) continue;

    const inventory = inventoryById.get(row.inventory_id);
    if (!inventory) continue;
    const product = productById.get(inventory.product_id);
    if (!product) continue;

    const kgAmount = quantityInKg(
      row.quantity,
      row.measurement_id,
      product.base_measurement_id,
      kg.id,
      input.conversions,
    );
    if (kgAmount === null) continue;

    const current = totals.get(product.id) ?? {
      name: product.name,
      kg: 0,
      totalPrice: 0,
    };
    current.kg += kgAmount;
    current.totalPrice += row.total_price;
    totals.set(product.id, current);
  }

  return [...totals.entries()]
    .map(([productId, value]) => ({
      productId,
      name: value.name,
      kg: value.kg,
      totalPrice: value.totalPrice,
    }))
    .sort((a, b) => b.kg - a.kg);
}
