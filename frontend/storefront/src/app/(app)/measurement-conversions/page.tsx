"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatRelativeTime,
  measurementConversionCreateSchema,
  useCreateMeasurementConversion,
  useDeleteMeasurementConversion,
  useMeasurementConversions,
  useMeasurements,
  useUpdateMeasurementConversion,
  type MeasurementConversion,
  type MeasurementConversionInput,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { ResourceFormDialog, type FormField } from "@/components/resource/resource-form-dialog";
import { ResourceTable } from "@/components/resource/resource-table";
import { useSessionUser } from "@/components/shell/session-context";
import { errorMessage } from "@/lib/utils";

export default function MeasurementConversionsPage() {
  const user = useSessionUser();
  const conversions = useMeasurementConversions();
  const measurements = useMeasurements();
  const createConversion = useCreateMeasurementConversion();
  const updateConversion = useUpdateMeasurementConversion();
  const deleteConversion = useDeleteMeasurementConversion();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MeasurementConversion | null>(null);

  const options = useMemo(
    () =>
      (measurements.data ?? []).map((measurement) => ({
        value: measurement.id,
        label: `${measurement.name} (${measurement.short_name})`,
      })),
    [measurements.data],
  );
  const names = useMemo(
    () => new Map((measurements.data ?? []).map((measurement) => [measurement.id, `${measurement.name} (${measurement.short_name})`])),
    [measurements.data],
  );

  const fields: FormField[] = [
    { kind: "text", name: "name", label: "Name" },
    {
      kind: "select",
      name: "base_measurement_id",
      label: "Base measurement",
      options,
      emptyHint: "Create a measurement before adding a conversion.",
    },
    {
      kind: "select",
      name: "converted_measurement_id",
      label: "Converted measurement",
      options,
      emptyHint: "Create a measurement before adding a conversion.",
    },
    { kind: "number", name: "base_measurement_to_converted_amount", label: "Amount of base per converted unit" },
  ];

  return (
    <div>
      <PageHeader
        title="Conversions"
        action="Add conversion"
        onAction={() => { setEditing(null); setOpen(true); }}
      />
      <ResourceTable
        rows={conversions.data ?? []}
        isLoading={conversions.isLoading || measurements.isLoading}
        error={conversions.error || measurements.error ? errorMessage(conversions.error ?? measurements.error) : null}
        onRetry={() => {
          void conversions.refetch();
          void measurements.refetch();
        }}
        rowKey={(row) => row.id}
        emptyLabel="No conversions yet."
        addLabel="Add conversion"
        onAdd={() => { setEditing(null); setOpen(true); }}
        defaultSort={{ id: "name", direction: "asc" }}
        onEdit={(row) => { setEditing(row); setOpen(true); }}
        onDelete={
          user.role === "ADMIN"
            ? async (row) => {
                try {
                  await deleteConversion.mutateAsync(row.id);
                  toast.success("Conversion deleted");
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }
            : undefined
        }
        deleteLabel={(row) => row.name}
        columns={[
          { id: "name", header: "Name", sortValue: (row) => row.name, cell: (row) => row.name },
          {
            id: "base",
            header: "Base",
            sortValue: (row) => names.get(row.base_measurement_id) ?? "",
            cell: (row) => names.get(row.base_measurement_id) ?? "Unknown",
          },
          {
            id: "converted",
            header: "Converted",
            sortValue: (row) => names.get(row.converted_measurement_id) ?? "",
            cell: (row) => names.get(row.converted_measurement_id) ?? "Unknown",
          },
          {
            id: "amount",
            header: "Base per converted",
            align: "right",
            sortValue: (row) => row.base_measurement_to_converted_amount,
            cell: (row) => row.base_measurement_to_converted_amount,
          },
          {
            id: "updated",
            header: "Updated",
            sortValue: (row) => Date.parse(row.updated_at),
            cell: (row) => formatRelativeTime(row.updated_at),
          },
        ]}
      />
      <ResourceFormDialog<MeasurementConversionInput>
        open={open}
        title={editing ? "Edit conversion" : "Add conversion"}
        schema={measurementConversionCreateSchema}
        fields={fields}
        defaultValues={
          editing
            ? {
                name: editing.name,
                base_measurement_id: editing.base_measurement_id,
                converted_measurement_id: editing.converted_measurement_id,
                base_measurement_to_converted_amount: editing.base_measurement_to_converted_amount,
              }
            : { name: "", base_measurement_id: "", converted_measurement_id: "", base_measurement_to_converted_amount: 1 }
        }
        submitLabel="Save"
        onClose={() => { setOpen(false); setEditing(null); }}
        onSubmit={async (values) => {
          if (editing) {
            await updateConversion.mutateAsync({ id: editing.id, body: values });
            toast.success("Conversion updated");
          } else {
            await createConversion.mutateAsync(values);
            toast.success("Conversion created");
          }
        }}
      />
    </div>
  );
}
