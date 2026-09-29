"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  formatRelativeTime,
  measurementCreateSchema,
  useCreateMeasurement,
  useDeleteMeasurement,
  useMeasurements,
  useUpdateMeasurement,
  type Measurement,
  type MeasurementInput,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { ResourceFormDialog, type FormField } from "@/components/resource/resource-form-dialog";
import { ResourceTable } from "@/components/resource/resource-table";
import { useSessionUser } from "@/components/shell/session-context";
import { errorMessage } from "@/lib/utils";

const fields: FormField[] = [
  { kind: "text", name: "name", label: "Name" },
  { kind: "text", name: "short_name", label: "Short name" },
];

export default function MeasurementsPage() {
  const user = useSessionUser();
  const measurements = useMeasurements();
  const createMeasurement = useCreateMeasurement();
  const updateMeasurement = useUpdateMeasurement();
  const deleteMeasurement = useDeleteMeasurement();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);

  return (
    <div>
      <PageHeader title="Measurements" action="Add measurement" onAction={() => { setEditing(null); setOpen(true); }} />
      <ResourceTable
        rows={measurements.data ?? []}
        isLoading={measurements.isLoading}
        error={measurements.error ? errorMessage(measurements.error) : null}
        onRetry={() => void measurements.refetch()}
        rowKey={(row) => row.id}
        searchText={(row) => `${row.name} ${row.short_name}`}
        emptyLabel="No measurements yet."
        addLabel="Add measurement"
        onAdd={() => { setEditing(null); setOpen(true); }}
        defaultSort={{ id: "name", direction: "asc" }}
        onEdit={(row) => { setEditing(row); setOpen(true); }}
        onDelete={
          user.role === "ADMIN"
            ? async (row) => {
                try {
                  await deleteMeasurement.mutateAsync(row.id);
                  toast.success("Measurement deleted");
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }
            : undefined
        }
        deleteLabel={(row) => row.name}
        columns={[
          { id: "name", header: "Name", sortValue: (row) => row.name, cell: (row) => row.name },
          { id: "short_name", header: "Short name", sortValue: (row) => row.short_name, cell: (row) => row.short_name },
          {
            id: "updated",
            header: "Updated",
            sortValue: (row) => Date.parse(row.updated_at),
            cell: (row) => formatRelativeTime(row.updated_at),
          },
        ]}
      />
      <ResourceFormDialog<MeasurementInput>
        open={open}
        title={editing ? "Edit measurement" : "Add measurement"}
        schema={measurementCreateSchema}
        fields={fields}
        defaultValues={editing ? { name: editing.name, short_name: editing.short_name } : { name: "", short_name: "" }}
        submitLabel="Save"
        onClose={() => { setOpen(false); setEditing(null); }}
        onSubmit={async (values) => {
          if (editing) {
            await updateMeasurement.mutateAsync({ id: editing.id, body: values });
            toast.success("Measurement updated");
          } else {
            await createMeasurement.mutateAsync(values);
            toast.success("Measurement created");
          }
        }}
      />
    </div>
  );
}
