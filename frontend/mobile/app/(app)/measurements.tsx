import { Redirect, router } from "expo-router";
import { useDeleteMeasurement, useMeasurements } from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import { ResourceList } from "../../src/components/resource-list";

export default function MeasurementsScreen() {
  const { session } = useAuth();
  const measurements = useMeasurements();
  const remove = useDeleteMeasurement();
  if (session && session.user.role !== "ADMIN") return <Redirect href="/(app)/(tabs)/inventory" />;

  return (
    <ResourceList
      rows={measurements.data ?? []}
      rowKey={(row) => row.id}
      title={(row) => row.name}
      subtitle={(row) => row.short_name}
      searchText={(row) => `${row.name} ${row.short_name}`}
      isLoading={measurements.isLoading}
      isRefreshing={measurements.isRefetching}
      error={measurements.error}
      onRefresh={() => void measurements.refetch()}
      onAdd={() => router.push("/(app)/measurement-form")}
      addLabel="Add"
      onEdit={(row) => router.push({ pathname: "/(app)/measurement-form", params: { id: row.id } })}
      onDelete={session?.user.role === "ADMIN" ? (row) => remove.mutateAsync(row.id) : undefined}
      emptyLabel="No measurements yet."
    />
  );
}
