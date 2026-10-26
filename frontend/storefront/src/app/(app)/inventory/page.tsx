"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatRelativeTime,
  inventoryCreateSchema,
  isAdmin,
  isLowStock,
  useCreateInventory,
  useDeleteInventory,
  useInventoryList,
  useMeasurements,
  useProducts,
  type InventoryInput,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { ResourceFormDialog, type FormField } from "@/components/resource/resource-form-dialog";
import { ResourceTable } from "@/components/resource/resource-table";
import { useSessionUser } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { errorMessage } from "@/lib/utils";

export default function InventoryPage() {
  const user = useSessionUser();
  const admin = isAdmin(user.role);
  const inventory = useInventoryList();
  const products = useProducts();
  const measurements = useMeasurements();
  const createRow = useCreateInventory();
  const deleteRow = useDeleteInventory();
  const [open, setOpen] = useState(false);

  const productOptions = useMemo(
    () => (products.data ?? []).map((product) => ({ value: product.id, label: product.name })),
    [products.data],
  );
  const measurementOptions = useMemo(
    () =>
      (measurements.data ?? []).map((measurement) => ({
        value: measurement.id,
        label: `${measurement.name} (${measurement.short_name})`,
      })),
    [measurements.data],
  );
  const productNames = useMemo(() => new Map((products.data ?? []).map((product) => [product.id, product.name])), [products.data]);
  const measurementNames = useMemo(
    () => new Map((measurements.data ?? []).map((measurement) => [measurement.id, measurement])),
    [measurements.data],
  );

  const fields: FormField[] = [
    { kind: "select", name: "product_id", label: "Product", options: productOptions, emptyHint: "Create a product before adding inventory." },
    {
      kind: "select",
      name: "measurement_id",
      label: "Measurement",
      options: measurementOptions,
      emptyHint: "Create a measurement before adding inventory.",
    },
    { kind: "number", name: "current_stock", label: "Opening stock" },
  ];

  const loadError = inventory.error ?? products.error ?? measurements.error;

  return (
    <div>
      <PageHeader title="Inventory" action={admin ? "Add inventory" : undefined} onAction={admin ? () => setOpen(true) : undefined} />
      <ResourceTable
        rows={inventory.data ?? []}
        isLoading={inventory.isLoading || products.isLoading || measurements.isLoading}
        error={loadError ? errorMessage(loadError) : null}
        onRetry={() => {
          void inventory.refetch();
          void products.refetch();
          void measurements.refetch();
        }}
        rowKey={(row) => row.id}
        emptyLabel="No inventory yet."
        addLabel="Add inventory"
        onAdd={admin ? () => setOpen(true) : undefined}
        defaultSort={{ id: "updated", direction: "desc" }}
        onDelete={
          admin
            ? async (row) => {
                try {
                  await deleteRow.mutateAsync(row.id);
                  toast.success("Inventory deleted");
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }
            : undefined
        }
        deleteLabel={(row) => productNames.get(row.product_id) ?? "this inventory row"}
        columns={[
          {
            id: "product",
            header: "Product",
            sortValue: (row) => productNames.get(row.product_id) ?? "",
            cell: (row) => productNames.get(row.product_id) ?? "Unknown",
          },
          {
            id: "measurement",
            header: "Measurement",
            sortValue: (row) => measurementNames.get(row.measurement_id)?.name ?? "",
            cell: (row) => {
              const measurement = measurementNames.get(row.measurement_id);
              return measurement ? `${measurement.name} (${measurement.short_name})` : "Unknown";
            },
          },
          {
            id: "stock",
            header: "On hand",
            align: "right",
            sortValue: (row) => row.current_stock,
            cell: (row) => (
              <span className="inline-flex items-center gap-2">
                {row.current_stock}
                {isLowStock(row.current_stock) ? <Badge tone="warning">Low</Badge> : <Badge tone="success">In stock</Badge>}
              </span>
            ),
          },
          {
            id: "updated",
            header: "Updated",
            sortValue: (row) => Date.parse(row.updated_at),
            cell: (row) => formatRelativeTime(row.updated_at),
          },
        ]}
      />
      {admin ? (
      <ResourceFormDialog<InventoryInput>
        open={open}
        title="Add inventory"
        schema={inventoryCreateSchema}
        fields={fields}
        defaultValues={{ product_id: "", measurement_id: "", current_stock: 0 }}
        submitLabel="Save"
        onClose={() => setOpen(false)}
        onSubmit={async (values) => {
          await createRow.mutateAsync(values);
          toast.success("Inventory created");
        }}
      />
      ) : null}
    </div>
  );
}
