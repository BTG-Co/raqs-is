import { router } from "expo-router";
import { isAdmin, isLowStock, useDeleteInventory, useInventoryList, useMeasurements, useProducts } from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { ResourceList } from "../../../src/components/resource-list";

export default function InventoryScreen() {
  const { session } = useAuth();
  const admin = isAdmin(session?.user.role);
  const inventory = useInventoryList();
  const products = useProducts();
  const measurements = useMeasurements();
  const remove = useDeleteInventory();
  const productNames = new Map((products.data ?? []).map((item) => [item.id, item.name]));
  const measurementNames = new Map((measurements.data ?? []).map((item) => [item.id, item.short_name]));

  return (
    <ResourceList
      rows={inventory.data ?? []}
      rowKey={(row) => row.id}
      title={(row) => productNames.get(row.product_id) ?? "Unknown product"}
      subtitle={(row) =>
        `${row.current_stock} ${measurementNames.get(row.measurement_id) ?? ""}${isLowStock(row.current_stock) ? " · Low" : ""}`
      }
      isLoading={inventory.isLoading}
      isRefreshing={inventory.isRefetching}
      error={inventory.error ?? products.error ?? measurements.error}
      onRefresh={() => {
        void inventory.refetch();
        void products.refetch();
        void measurements.refetch();
      }}
      onAdd={admin ? () => router.push("/(app)/inventory-form") : undefined}
      addLabel="Add"
      onDelete={admin ? (row) => remove.mutateAsync(row.id) : undefined}
      emptyLabel="No inventory yet."
    />
  );
}
