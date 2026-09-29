"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatRelativeTime,
  inventoryCreateSchema,
  isAdmin,
  isLowStock,
  useApproveInventoryUpdateRequest,
  useCreateInventory,
  useCreateInventoryUpdateRequest,
  useDeleteInventory,
  useInventoryList,
  useInventoryUpdateRequests,
  useMeasurements,
  useProducts,
  useRejectInventoryUpdateRequest,
  useUpdateInventory,
  type Inventory,
  type InventoryInput,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { ResourceFormDialog, type FormField } from "@/components/resource/resource-form-dialog";
import { ResourceTable } from "@/components/resource/resource-table";
import { useSessionUser } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/utils";

export default function InventoryPage() {
  const user = useSessionUser();
  const admin = isAdmin(user.role);
  const inventory = useInventoryList();
  const requests = useInventoryUpdateRequests();
  const products = useProducts();
  const measurements = useMeasurements();
  const createRow = useCreateInventory();
  const updateRow = useUpdateInventory();
  const createRequest = useCreateInventoryUpdateRequest();
  const approveRequest = useApproveInventoryUpdateRequest();
  const rejectRequest = useRejectInventoryUpdateRequest();
  const deleteRow = useDeleteInventory();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inventory | null>(null);

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

  const pending = useMemo(
    () => (requests.data ?? []).filter((request) => request.status === "PENDING"),
    [requests.data],
  );
  const pendingIds = useMemo(() => new Set(pending.map((request) => request.inventory_id)), [pending]);

  const fields: FormField[] = [
    { kind: "select", name: "product_id", label: "Product", options: productOptions, emptyHint: "Create a product before adding inventory." },
    {
      kind: "select",
      name: "measurement_id",
      label: "Measurement",
      options: measurementOptions,
      emptyHint: "Create a measurement before adding inventory.",
    },
    { kind: "number", name: "amount", label: "Amount" },
  ];

  const loadError = inventory.error ?? products.error ?? measurements.error ?? requests.error;

  async function decide(id: string, action: "approve" | "reject") {
    try {
      if (action === "approve") {
        await approveRequest.mutateAsync(id);
        toast.success("Inventory update approved");
      } else {
        await rejectRequest.mutateAsync(id);
        toast.success("Inventory update rejected");
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader title="Inventory" action="Add inventory" onAction={() => { setEditing(null); setOpen(true); }} />
      {admin && pending.length > 0 ? (
        <section className="mb-4 rounded-card bg-card p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Waiting for approval</h2>
          <ul className="mt-3 space-y-3">
            {pending.map((request) => {
              const measurement = measurementNames.get(request.measurement_id);
              return (
                <li key={request.id} className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink">
                    {productNames.get(request.product_id) ?? "Unknown"} · {request.amount}
                    {measurement ? ` ${measurement.short_name}` : ""} · {request.requested_by}
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => void decide(request.id, "approve")}>
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void decide(request.id, "reject")}>
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <ResourceTable
        rows={inventory.data ?? []}
        isLoading={inventory.isLoading || products.isLoading || measurements.isLoading || requests.isLoading}
        error={loadError ? errorMessage(loadError) : null}
        onRetry={() => {
          void inventory.refetch();
          void products.refetch();
          void measurements.refetch();
          void requests.refetch();
        }}
        rowKey={(row) => row.id}
        searchText={(row) =>
          `${productNames.get(row.product_id) ?? ""} ${measurementNames.get(row.measurement_id)?.name ?? ""} ${row.amount}`
        }
        emptyLabel="No inventory yet."
        addLabel="Add inventory"
        onAdd={() => { setEditing(null); setOpen(true); }}
        defaultSort={{ id: "updated", direction: "desc" }}
        onEdit={(row) => { setEditing(row); setOpen(true); }}
        editLabel={admin ? "Edit" : "Request update"}
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
            id: "amount",
            header: "Amount",
            align: "right",
            sortValue: (row) => row.amount,
            cell: (row) => (
              <span className="inline-flex items-center gap-2">
                {row.amount}
                {isLowStock(row.amount) ? <Badge tone="warning">Low</Badge> : <Badge tone="success">In stock</Badge>}
                {pendingIds.has(row.id) ? <Badge tone="warning">Pending</Badge> : null}
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
      <ResourceFormDialog<InventoryInput>
        open={open}
        title={editing ? (admin ? "Edit inventory" : "Request inventory update") : "Add inventory"}
        schema={inventoryCreateSchema}
        fields={fields}
        defaultValues={
          editing
            ? { product_id: editing.product_id, measurement_id: editing.measurement_id, amount: editing.amount }
            : { product_id: "", measurement_id: "", amount: 0 }
        }
        submitLabel={editing && !admin ? "Submit for approval" : "Save"}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSubmit={async (values) => {
          if (editing && !admin) {
            await createRequest.mutateAsync({
              inventory_id: editing.id,
              product_id: values.product_id,
              measurement_id: values.measurement_id,
              amount: values.amount,
              requested_by: user.username,
            });
            toast.success("Update submitted for admin approval");
          } else if (editing) {
            await updateRow.mutateAsync({ id: editing.id, body: values });
            toast.success("Inventory updated");
          } else {
            await createRow.mutateAsync(values);
            toast.success("Inventory created");
          }
        }}
      />
    </div>
  );
}
