import { Redirect, router } from "expo-router";
import { inventoryCreateSchema, isAdmin, useCreateInventory, useMeasurements, useProducts } from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import { FormScreen } from "../../src/components/form-screen";

export default function InventoryFormScreen() {
  const { session } = useAuth();
  const products = useProducts();
  const measurements = useMeasurements();
  const createRow = useCreateInventory();
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
    { kind: "number" as const, name: "current_stock", label: "Opening stock" },
  ];

  if (session && !isAdmin(session.user.role)) return <Redirect href="/(app)/(tabs)/inventory" />;

  return (
    <FormScreen
      schema={inventoryCreateSchema}
      fields={fields}
      defaultValues={{ product_id: "", measurement_id: "", current_stock: 0 }}
      submitLabel="Save"
      onSubmit={async (values) => {
        await createRow.mutateAsync(values);
        router.back();
      }}
    />
  );
}
