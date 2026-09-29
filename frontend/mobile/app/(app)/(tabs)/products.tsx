import { router } from "expo-router";
import { isAdmin, useMeasurements, useProducts, useDeleteProduct } from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { ResourceList } from "../../../src/components/resource-list";

export default function ProductsScreen() {
  const { session } = useAuth();
  const admin = isAdmin(session?.user.role);
  const products = useProducts();
  const measurements = useMeasurements();
  const remove = useDeleteProduct();
  const names = new Map((measurements.data ?? []).map((item) => [item.id, `${item.name} (${item.short_name})`]));

  return (
    <ResourceList
      rows={products.data ?? []}
      rowKey={(row) => row.id}
      title={(row) => row.name}
      subtitle={(row) => names.get(row.base_measurement_id) ?? "Unknown measurement"}
      searchText={(row) => `${row.name} ${names.get(row.base_measurement_id) ?? ""}`}
      isLoading={products.isLoading}
      isRefreshing={products.isRefetching}
      error={products.error}
      onRefresh={() => void products.refetch()}
      onAdd={admin ? () => router.push("/(app)/product-form") : undefined}
      addLabel="Add"
      onEdit={admin ? (row) => router.push({ pathname: "/(app)/product-form", params: { id: row.id } }) : undefined}
      onDelete={admin ? (row) => remove.mutateAsync(row.id) : undefined}
      emptyLabel="No products yet."
    />
  );
}
