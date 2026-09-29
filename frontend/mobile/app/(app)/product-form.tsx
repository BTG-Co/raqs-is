import { Redirect, router, useLocalSearchParams } from "expo-router";
import {
  isAdmin,
  productCreateSchema,
  productUpdateSchema,
  toProductCreate,
  toProductUpdate,
  useCreateProduct,
  useMeasurements,
  useProducts,
  useUpdateProduct,
} from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import { FormScreen } from "../../src/components/form-screen";

export default function ProductFormScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const products = useProducts();
  const measurements = useMeasurements();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const existing = products.data?.find((item) => item.id === id);
  const options = (measurements.data ?? []).map((item) => ({
    value: item.id,
    label: `${item.name} (${item.short_name})`,
  }));
  const fields = [
    { kind: "text" as const, name: "name", label: "Name" },
    { kind: "url" as const, name: "image", label: "Image URL" },
    {
      kind: "select" as const,
      name: "base_measurement_id",
      label: "Base measurement",
      options,
      emptyHint: "Create a measurement before adding a product.",
    },
  ];

  if (session && !isAdmin(session.user.role)) return <Redirect href="/(app)/(tabs)/inventory" />;
  if (id && !existing) return null;

  if (existing) {
    return (
      <FormScreen
        schema={productUpdateSchema}
        fields={fields}
        defaultValues={{ name: existing.name, image: existing.image ?? "", base_measurement_id: existing.base_measurement_id }}
        submitLabel="Save"
        onSubmit={async (values) => {
          await updateProduct.mutateAsync({ id: existing.id, body: toProductUpdate(values) });
          router.back();
        }}
      />
    );
  }

  return (
    <FormScreen
      schema={productCreateSchema}
      fields={fields}
      defaultValues={{ name: "", image: "", base_measurement_id: "" }}
      submitLabel="Save"
      onSubmit={async (values) => {
        await createProduct.mutateAsync(toProductCreate(values));
        router.back();
      }}
    />
  );
}
