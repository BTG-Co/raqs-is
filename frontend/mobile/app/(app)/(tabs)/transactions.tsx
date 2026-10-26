import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  isAdmin,
  useApproveTransactions,
  useDeleteTransaction,
  useInventoryList,
  useMeasurements,
  useProducts,
  useTransactions,
} from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { ResourceList } from "../../../src/components/resource-list";
import { colors, spacing, ui } from "../../../src/theme";

export default function TransactionsScreen() {
  const { session } = useAuth();
  const admin = isAdmin(session?.user.role);
  const transactions = useTransactions();
  const inventory = useInventoryList();
  const products = useProducts();
  const measurements = useMeasurements();
  const approve = useApproveTransactions();
  const remove = useDeleteTransaction();
  const productNames = new Map((products.data ?? []).map((item) => [item.id, item.name]));
  const measurementNames = new Map((measurements.data ?? []).map((item) => [item.id, item.short_name]));
  const inventoryLabels = new Map(
    (inventory.data ?? []).map((row) => [
      row.id,
      `${productNames.get(row.product_id) ?? "Unknown"} (${measurementNames.get(row.measurement_id) ?? "unit"})`,
    ]),
  );
  const pending = (transactions.data ?? []).filter((row) => !row.is_approved);

  function approveIds(ids: string[]) {
    void approve.mutateAsync(ids).catch((error: unknown) => {
      Alert.alert("Could not approve", error instanceof Error ? error.message : "Try again.");
    });
  }

  const queue =
    admin && pending.length > 0 ? (
      <View style={[ui.card, { gap: spacing[3] }]}>
        <Text style={ui.title}>Waiting for approval</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Approve all" onPress={() => approveIds(pending.map((row) => row.id))} style={ui.primaryButton}>
          <Text style={ui.primaryButtonText}>Approve all</Text>
        </Pressable>
        {pending.map((row) => (
          <View key={row.id} style={{ gap: spacing[2] }}>
            <Text style={ui.body}>
              {inventoryLabels.get(row.inventory_id) ?? "Unknown"} · {row.transaction_type} · {row.quantity}{" "}
              {measurementNames.get(row.measurement_id) ?? ""}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing[2] }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Approve" onPress={() => approveIds([row.id])} style={ui.primaryButton}>
                <Text style={ui.primaryButtonText}>Approve</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete"
                onPress={() => {
                  void remove.mutateAsync(row.id).catch((error: unknown) => {
                    Alert.alert("Could not delete", error instanceof Error ? error.message : "Try again.");
                  });
                }}
              >
                <Text style={[ui.body, { color: colors.error }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    ) : null;

  return (
    <ResourceList
      rows={transactions.data ?? []}
      rowKey={(row) => row.id}
      title={(row) => inventoryLabels.get(row.inventory_id) ?? "Unknown inventory"}
      subtitle={(row) =>
        `${row.transaction_type} · ${row.quantity} ${measurementNames.get(row.measurement_id) ?? ""} · ${row.is_approved ? "Approved" : "Pending"}`.trim()
      }
      isLoading={transactions.isLoading}
      isRefreshing={transactions.isRefetching}
      error={transactions.error ?? inventory.error}
      onRefresh={() => {
        void transactions.refetch();
        void inventory.refetch();
      }}
      header={queue}
      onAdd={() => router.push("/(app)/transaction-form")}
      addLabel="Record"
      onDelete={admin ? (row) => remove.mutateAsync(row.id) : undefined}
      emptyLabel="No transactions yet."
    />
  );
}
