"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import {
  productCreateSchema,
  productUpdateSchema,
  toProductCreate,
  toProductUpdate,
  useCreateProduct,
  useDeleteProduct,
  useMeasurements,
  useProducts,
  useUpdateProduct,
  isAdmin,
  type Product,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { ResourceFormDialog, type FormField } from "@/components/resource/resource-form-dialog";
import { ResourceTable } from "@/components/resource/resource-table";
import { useSessionUser } from "@/components/shell/session-context";
import { errorMessage } from "@/lib/utils";

export default function ProductsPage() {
  const user = useSessionUser();
  const admin = isAdmin(user.role);
  const products = useProducts();
  const measurements = useMeasurements();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const options = useMemo(
    () =>
      (measurements.data ?? []).map((measurement) => ({
        value: measurement.id,
        label: `${measurement.name} (${measurement.short_name})`,
      })),
    [measurements.data],
  );
  const names = useMemo(
    () => new Map((measurements.data ?? []).map((measurement) => [measurement.id, measurement])),
    [measurements.data],
  );

  const fields: FormField[] = [
    { kind: "text", name: "name", label: "Name" },
    { kind: "url", name: "image", label: "Image URL" },
    {
      kind: "select",
      name: "base_measurement_id",
      label: "Base measurement",
      options,
      emptyHint: "Create a measurement before adding a product.",
    },
  ];

  const creating = open && !editing;

  return (
    <div>
      <PageHeader
        title="Products"
        action={admin ? "Add product" : undefined}
        onAction={admin ? () => { setEditing(null); setOpen(true); } : undefined}
      />
      <ResourceTable
        rows={products.data ?? []}
        isLoading={products.isLoading}
        error={products.error ? errorMessage(products.error) : null}
        onRetry={() => void products.refetch()}
        rowKey={(row) => row.id}
        searchText={(row) => `${row.name} ${names.get(row.base_measurement_id)?.name ?? ""}`}
        emptyLabel="No products yet."
        onAdd={admin ? () => { setEditing(null); setOpen(true); } : undefined}
        addLabel="Add product"
        defaultSort={{ id: "name", direction: "asc" }}
        onEdit={admin ? (row) => { setEditing(row); setOpen(true); } : undefined}
        onDelete={
          admin
            ? async (row) => {
                try {
                  await deleteProduct.mutateAsync(row.id);
                  toast.success("Product deleted");
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }
            : undefined
        }
        deleteLabel={(row) => row.name}
        columns={[
          {
            id: "name",
            header: "Product",
            sortValue: (row) => row.name,
            cell: (row) => (
              <div className="flex items-center gap-3">
                {row.image ? (
                  <img src={row.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary" aria-hidden>
                    <Package className="h-4 w-4" />
                  </span>
                )}
                <span className="font-medium">{row.name}</span>
              </div>
            ),
          },
          {
            id: "measurement",
            header: "Base measurement",
            sortValue: (row) => names.get(row.base_measurement_id)?.name ?? "",
            cell: (row) => {
              const measurement = names.get(row.base_measurement_id);
              return measurement ? `${measurement.name} (${measurement.short_name})` : "Unknown";
            },
          },
        ]}
      />
      {creating ? (
        <ResourceFormDialog<ProductCreateInput>
          open
          title="Add product"
          schema={productCreateSchema}
          fields={fields}
          defaultValues={{ name: "", image: "", base_measurement_id: "" }}
          submitLabel="Save"
          onClose={() => setOpen(false)}
          onSubmit={async (values) => {
            await createProduct.mutateAsync(toProductCreate(values));
            toast.success("Product created");
          }}
        />
      ) : null}
      {editing ? (
        <ResourceFormDialog<ProductUpdateInput>
          open={open}
          title="Edit product"
          schema={productUpdateSchema}
          fields={fields}
          defaultValues={{
            name: editing.name,
            image: editing.image ?? "",
            base_measurement_id: editing.base_measurement_id,
          }}
          submitLabel="Save"
          onClose={() => { setOpen(false); setEditing(null); }}
          onSubmit={async (values) => {
            await updateProduct.mutateAsync({ id: editing.id, body: toProductUpdate(values) });
            toast.success("Product updated");
          }}
        />
      ) : null}
    </div>
  );
}
