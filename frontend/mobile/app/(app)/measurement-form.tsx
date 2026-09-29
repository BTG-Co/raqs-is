import { Redirect, router, useLocalSearchParams } from "expo-router";
import { isAdmin } from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import {
  measurementCreateSchema,
  useCreateMeasurement,
  useMeasurements,
  useUpdateMeasurement,
} from "@raqs/shared";
import { FormScreen } from "../../src/components/form-screen";

export default function MeasurementFormScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const measurements = useMeasurements();
  const createMeasurement = useCreateMeasurement();
  const updateMeasurement = useUpdateMeasurement();
  const existing = measurements.data?.find((item) => item.id === id);
  const fields = [
    { kind: "text" as const, name: "name", label: "Name" },
    { kind: "text" as const, name: "short_name", label: "Short name" },
  ];

  if (session && !isAdmin(session.user.role)) return <Redirect href="/(app)/(tabs)/inventory" />;
  if (id && !existing) return null;

  return (
    <FormScreen
      schema={measurementCreateSchema}
      fields={fields}
      defaultValues={existing ? { name: existing.name, short_name: existing.short_name } : { name: "", short_name: "" }}
      submitLabel="Save"
      onSubmit={async (values) => {
        if (existing) await updateMeasurement.mutateAsync({ id: existing.id, body: values });
        else await createMeasurement.mutateAsync(values);
        router.back();
      }}
    />
  );
}
