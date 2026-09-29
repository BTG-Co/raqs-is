import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  isAdmin,
  isLowStock,
  useApproveInventoryUpdateRequest,
  useDeleteInventory,
  useInventoryList,
  useInventoryUpdateRequests,
  useMeasurements,
  useProducts,
  useRejectInventoryUpdateRequest,
} from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { ResourceList } from "../../../src/components/resource-list";
import { colors, spacing, ui } from "../../../src/theme";

export default function InventoryScreen() {
  const { session } = useAuth();
  const admin = isAdmin(session?.user.role);
  const inventory = useInventoryList();
  const requests = useInventoryUpdateRequests();
  const products = useProducts();
  const measurements = useMeasurements();
  const remove = useDeleteInventory();
  const approve = useApproveInventoryUpdateRequest();
  const reject = useRejectInventoryUpdateRequest();
  const productNames = new Map((products.data ?? []).map((item) => [item.id, item.name]));
  const measurementNames = new Map((measurements.data ?? []).map((item) => [item.id, item.short_name]));
  const pending = (requests.data ?? []).filter((request) => request.status === "PENDING");
  const pendingIds = new Set(pending.map((request) => request.inventory_id));

  function decide(id: string, action: "approve" | "reject") {
    const mutation = action === "approve" ? approve : reject;
    void mutation.mutateAsync(id).catch((error: unknown) => {
      Alert.alert(action === "approve" ? "Could not approve" : "Could not reject", error instanceof Error ? error.message : "Try again.");
    });
  }

  const queue =
    admin && pending.length > 0 ? (
      <View style={[ui.card, { gap: spacing[3] }]}>
        <Text style={ui.title}>Waiting for approval</Text>
        {pending.map((request) => (
          <View key={request.id} style={{ gap: spacing[2] }}>
            <Text style={ui.body}>
              {productNames.get(request.product_id) ?? "Unknown"} · {request.amount}{" "}
              {measurementNames.get(request.measurement_id) ?? ""} · {request.requested_by}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing[2] }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Approve" onPress={() => decide(request.id, "approve")} style={ui.primaryButton}>
                <Text style={ui.primaryButtonText}>Approve</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Reject" onPress={() => decide(request.id, "reject")}>
                <Text style={[ui.body, { color: colors.error }]}>Reject</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    ) : null;

  return (
    <ResourceList
      rows={inventory.data ?? []}
      rowKey={(row) => row.id}
      title={(row) => productNames.get(row.product_id) ?? "Unknown product"}
      subtitle={(row) =>
        `${row.amount} ${measurementNames.get(row.measurement_id) ?? ""}${isLowStock(row.amount) ? " · Low" : ""}${pendingIds.has(row.id) ? " · Pending" : ""}`
      }
      searchText={(row) => `${productNames.get(row.product_id) ?? ""} ${row.amount}`}
      isLoading={inventory.isLoading || requests.isLoading}
      isRefreshing={inventory.isRefetching || requests.isRefetching}
      error={inventory.error ?? products.error ?? measurements.error ?? requests.error}
      onRefresh={() => {
        void inventory.refetch();
        void products.refetch();
        void measurements.refetch();
        void requests.refetch();
      }}
      header={queue}
      onAdd={() => router.push("/(app)/inventory-form")}
      addLabel="Add"
      onEdit={(row) => router.push({ pathname: "/(app)/inventory-form", params: { id: row.id } })}
      editLabel={admin ? "Edit" : "Request update"}
      onDelete={admin ? (row) => remove.mutateAsync(row.id) : undefined}
      emptyLabel="No inventory yet."
    />
  );
}
