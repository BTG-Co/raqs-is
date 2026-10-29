import { Alert } from "react-native";
import { router } from "expo-router";
import { transactionCreateSchema, useCreateTransaction, useInventoryList, useMeasurements, useProducts, type TransactionCreate } from "@raqs/shared";
import { FormScreen } from "../../src/components/form-screen";

const typeOptions = [
  { value: "SALE", label: "Sale" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "RETURN", label: "Return" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

export default function TransactionFormScreen() {
  const inventory = useInventoryList();
  const products = useProducts();
  const measurements = useMeasurements();
  const createRow = useCreateTransaction();
  const productNames = new Map((products.data ?? []).map((item) => [item.id, item.name]));
  const measurementNames = new Map((measurements.data ?? []).map((item) => [item.id, item.short_name]));
  const fields = [
    {
      kind: "select" as const,
      name: "inventory_id",
      label: "Inventory",
      options: (inventory.data ?? []).map((row) => ({
        value: row.id,
        label: `${productNames.get(row.product_id) ?? "Unknown"} (${measurementNames.get(row.measurement_id) ?? "unit"})`,
      })),
      emptyHint: "Add an inventory row before recording a transaction.",
    },
    {
      kind: "select" as const,
      name: "measurement_id",
      label: "Measurement",
      options: (measurements.data ?? []).map((row) => ({
        value: row.id,
        label: `${row.name} (${row.short_name})`,
      })),
      emptyHint: "Create a measurement before recording a transaction.",
    },
    { kind: "select" as const, name: "transaction_type", label: "Type", options: typeOptions, emptyHint: "Choose a transaction type." },
    { kind: "number" as const, name: "quantity", label: "Quantity" },
    { kind: "number" as const, name: "unit_price", label: "Unit price" },
  ];

  return (
    <FormScreen
      schema={transactionCreateSchema}
      fields={fields}
      defaultValues={{ inventory_id: "", measurement_id: "", transaction_type: "SALE", quantity: 1, unit_price: 0 }}
      submitLabel="Submit for approval"
      onSubmit={async (values) => {
        await createRow.mutateAsync(values as TransactionCreate);
        Alert.alert("Submitted", "An admin needs to approve this transaction before stock changes.");
        router.back();
      }}
    />
  );
}
