import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  inventoryCreateSchema,
  isAdmin,
  useCreateInventory,
  useCreateInventoryUpdateRequest,
  useInventoryList,
  useMeasurements,
  useProducts,
  useUpdateInventory,
} from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import { FormScreen } from "../../src/components/form-screen";

export default function InventoryFormScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const inventory = useInventoryList();
  const products = useProducts();
  const measurements = useMeasurements();
  const createRow = useCreateInventory();
  const updateRow = useUpdateInventory();
  const createRequest = useCreateInventoryUpdateRequest();
  const existing = inventory.data?.find((item) => item.id === id);
  const staffEdit = Boolean(existing && session && !isAdmin(session.user.role));
  const fields = [
    {
      kind: "select" as const,
      name: "product_id",
      label: "Product",
      options: (products.data ?? []).map((item) => ({ value: item.id, label: item.name })),
      emptyHint: "Create a product before adding inventory.",
    },
    {
      kind: "select" as const,
      name: "measurement_id",
      label: "Measurement",
      options: (measurements.data ?? []).map((item) => ({ value: item.id, label: `${item.name} (${item.short_name})` })),
      emptyHint: "Create a measurement before adding inventory.",
    },
    { kind: "number" as const, name: "amount", label: "Amount" },
  ];

  if (id && !existing) return null;

  return (
    <FormScreen
      schema={inventoryCreateSchema}
      fields={fields}
      defaultValues={
        existing
          ? { product_id: existing.product_id, measurement_id: existing.measurement_id, amount: existing.amount }
          : { product_id: "", measurement_id: "", amount: 0 }
      }
      submitLabel={staffEdit ? "Submit for approval" : "Save"}
      onSubmit={async (values) => {
        if (existing && staffEdit) {
          await createRequest.mutateAsync({
            inventory_id: existing.id,
            product_id: values.product_id,
            measurement_id: values.measurement_id,
            amount: values.amount,
            requested_by: session?.user.username ?? "",
          });
          Alert.alert("Submitted", "An admin needs to approve this update.");
        } else if (existing) {
          await updateRow.mutateAsync({ id: existing.id, body: values });
        } else {
          await createRow.mutateAsync(values);
        }
        router.back();
      }}
    />
  );
}
