/** Amounts below this, in the row's own unit, count as low stock. */
export const LOW_STOCK_THRESHOLD = 10;

export function isLowStock(amount: number): boolean {
  return amount < LOW_STOCK_THRESHOLD;
}
