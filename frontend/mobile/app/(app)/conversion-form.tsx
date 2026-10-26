import { Redirect, router, useLocalSearchParams } from "expo-router";
import { isAdmin } from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import {
  measurementConversionCreateSchema,
  useCreateMeasurementConversion,
  useMeasurementConversions,
  useMeasurements,
  useUpdateMeasurementConversion,
} from "@raqs/shared";
import { FormScreen } from "../../src/components/form-screen";

export default function ConversionFormScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const conversions = useMeasurementConversions();
  const measurements = useMeasurements();
  const createConversion = useCreateMeasurementConversion();
  const updateConversion = useUpdateMeasurementConversion();
  const existing = conversions.data?.find((item) => item.id === id);
  const options = (measurements.data ?? []).map((item) => ({
    value: item.id,
    label: `${item.name} (${item.short_name})`,
  }));
  const fields = [
    { kind: "text" as const, name: "name", label: "Name" },
    {
      kind: "select" as const,
      name: "base_measurement_id",
      label: "Base measurement",
      options,
      emptyHint: "Create a measurement before adding a conversion.",
    },
    {
      kind: "select" as const,
      name: "converted_measurement_id",
      label: "Converted measurement",
      options,
      emptyHint: "Create a measurement before adding a conversion.",
    },
    { kind: "number" as const, name: "base_measurement_to_converted_amount", label: "Amount of base per converted unit" },
  ];

  if (session && !isAdmin(session.user.role)) return <Redirect href="/(app)/(tabs)/inventory" />;
  if (id && !existing) return null;

  return (
    <FormScreen
      schema={measurementConversionCreateSchema}
      fields={fields}
      defaultValues={
        existing
          ? {
              name: existing.name,
              base_measurement_id: existing.base_measurement_id,
              converted_measurement_id: existing.converted_measurement_id,
              base_measurement_to_converted_amount: existing.base_measurement_to_converted_amount,
            }
          : { name: "", base_measurement_id: "", converted_measurement_id: "", base_measurement_to_converted_amount: 1 }
      }
      submitLabel="Save"
      onSubmit={async (values) => {
        if (existing) await updateConversion.mutateAsync({ id: existing.id, body: values });
        else await createConversion.mutateAsync(values);
        router.back();
      }}
    />
  );
}
