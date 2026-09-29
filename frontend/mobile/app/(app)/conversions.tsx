import { Redirect, router } from "expo-router";
import { useDeleteMeasurementConversion, useMeasurementConversions, useMeasurements } from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import { ResourceList } from "../../src/components/resource-list";

export default function ConversionsScreen() {
  const { session } = useAuth();
  const conversions = useMeasurementConversions();
  const measurements = useMeasurements();
  const remove = useDeleteMeasurementConversion();
  const names = new Map((measurements.data ?? []).map((item) => [item.id, item.name]));
  if (session && session.user.role !== "ADMIN") return <Redirect href="/(app)/(tabs)/inventory" />;

  return (
    <ResourceList
      rows={conversions.data ?? []}
      rowKey={(row) => row.id}
      title={(row) => row.name}
      subtitle={(row) => `${names.get(row.base_measurement_id) ?? "Unknown"} → ${names.get(row.converted_measurement_id) ?? "Unknown"}`}
      searchText={(row) => `${row.name} ${names.get(row.base_measurement_id) ?? ""} ${names.get(row.converted_measurement_id) ?? ""}`}
      isLoading={conversions.isLoading}
      isRefreshing={conversions.isRefetching}
      error={conversions.error ?? measurements.error}
      onRefresh={() => {
        void conversions.refetch();
        void measurements.refetch();
      }}
      onAdd={() => router.push("/(app)/conversion-form")}
      addLabel="Add"
      onEdit={(row) => router.push({ pathname: "/(app)/conversion-form", params: { id: row.id } })}
      onDelete={session?.user.role === "ADMIN" ? (row) => remove.mutateAsync(row.id) : undefined}
      emptyLabel="No conversions yet."
    />
  );
}
