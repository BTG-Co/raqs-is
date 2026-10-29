"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatRelativeTime,
  isAdmin,
  transactionCreateSchema,
  useApproveTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useInventoryList,
  useMeasurementConversions,
  useMeasurements,
  useProducts,
  useTransactions,
  type TransactionCreate,
  type TransactionInput,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { ResourceFormDialog, type FormField } from "@/components/resource/resource-form-dialog";
import { ResourceTable } from "@/components/resource/resource-table";
import { useSessionUser } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/utils";

const typeOptions = [
  { value: "SALE", label: "Sale" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "RETURN", label: "Return" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

export default function TransactionsPage() {
  const user = useSessionUser();
  const admin = isAdmin(user.role);
  const transactions = useTransactions();
  const inventory = useInventoryList();
  const products = useProducts();
  const measurements = useMeasurements();
  const conversions = useMeasurementConversions();
  const createRow = useCreateTransaction();
  const approveRows = useApproveTransactions();
  const deleteRow = useDeleteTransaction();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const productById = useMemo(() => new Map((products.data ?? []).map((product) => [product.id, product])), [products.data]);
  const productNames = useMemo(() => new Map((products.data ?? []).map((product) => [product.id, product.name])), [products.data]);
  const measurementById = useMemo(
    () => new Map((measurements.data ?? []).map((measurement) => [measurement.id, measurement])),
    [measurements.data],
  );
  const measurementNames = useMemo(
    () => new Map((measurements.data ?? []).map((measurement) => [measurement.id, measurement.short_name])),
    [measurements.data],
  );
  const inventoryById = useMemo(() => new Map((inventory.data ?? []).map((row) => [row.id, row])), [inventory.data]);
  const inventoryLabels = useMemo(
    () =>
      new Map(
        (inventory.data ?? []).map((row) => [
          row.id,
          `${productNames.get(row.product_id) ?? "Unknown"} (${measurementNames.get(row.measurement_id) ?? "unit"})`,
        ]),
      ),
    [inventory.data, measurementNames, productNames],
  );
  const inventoryOptions = useMemo(
    () => (inventory.data ?? []).map((row) => ({ value: row.id, label: inventoryLabels.get(row.id) ?? row.id })),
    [inventory.data, inventoryLabels],
  );
  const pending = useMemo(() => (transactions.data ?? []).filter((row) => !row.is_approved), [transactions.data]);

  function measurementOptionsForInventory(inventoryId: string) {
    if (!inventoryId) return [];
    const row = inventoryById.get(inventoryId);
    if (!row) return [];
    const product = productById.get(row.product_id);
    if (!product) return [];

    const baseId = product.base_measurement_id;
    const related = (conversions.data ?? []).filter((conversion) => conversion.base_measurement_id === baseId);
    const options: { value: string; label: string }[] = [];
    const seen = new Set<string>();

    function addOption(measurementId: string, label: string) {
      if (seen.has(measurementId)) return;
      seen.add(measurementId);
      options.push({ value: measurementId, label });
    }

    const base = measurementById.get(baseId);
    if (base) {
      addOption(baseId, `${base.name} (${base.short_name}) · product base`);
    }

    for (const conversion of related) {
      const converted = measurementById.get(conversion.converted_measurement_id);
      if (!converted) continue;
      addOption(
        conversion.converted_measurement_id,
        `${converted.name} (${converted.short_name}) · via ${conversion.name} (1 ${base?.short_name ?? "base"} = ${conversion.base_measurement_to_converted_amount} ${converted.short_name})`,
      );
    }

    return options;
  }

  function fieldsFor(values: TransactionInput): FormField[] {
    const inventoryId = String(values.inventory_id ?? "");
    const measurementOptions = measurementOptionsForInventory(inventoryId);
    const measurementHint = !inventoryId
      ? "Select an inventory row first."
      : "Add a measurement conversion whose base measurement matches this product.";

    return [
      {
        kind: "select",
        name: "inventory_id",
        label: "Inventory",
        options: inventoryOptions,
        emptyHint: "Add an inventory row before recording a transaction.",
        clears: ["measurement_id"],
      },
      { kind: "select", name: "transaction_type", label: "Type", options: typeOptions, emptyHint: "Choose a transaction type." },
      {
        kind: "row",
        fields: [
          { kind: "number", name: "quantity", label: "Quantity", placeholder: "0.00", step: "0.01" },
          {
            kind: "select",
            name: "measurement_id",
            label: "Measurement",
            options: measurementOptions,
            emptyHint: measurementHint,
          },
        ],
      },
      {
        kind: "number",
        name: "unit_price",
        label: "Unit price",
        prefix: "Php",
        placeholder: "0.00",
        step: "0.01",
      },
    ];
  }

  const loadError =
    transactions.error ?? inventory.error ?? products.error ?? measurements.error ?? conversions.error;

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function approve(ids: string[]) {
    try {
      await approveRows.mutateAsync(ids);
      setSelected([]);
      toast.success(ids.length === 1 ? "Transaction approved" : "Transactions approved");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader title="Transactions" action="Record transaction" onAction={() => setOpen(true)} />
      {admin && pending.length > 0 ? (
        <section className="mb-4 rounded-card bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Waiting for approval</h2>
            <Button type="button" size="sm" disabled={selected.length === 0} onClick={() => void approve(selected)}>
              Approve selected
            </Button>
          </div>
          <ul className="mt-3 space-y-3">
            {pending.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={() => toggle(row.id)}
                  />
                  {inventoryLabels.get(row.inventory_id) ?? "Unknown"} · {row.transaction_type} · {row.quantity}{" "}
                  {measurementNames.get(row.measurement_id) ?? ""} · {row.creator.username}
                </label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => void approve([row.id])}>
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void deleteRow.mutateAsync(row.id).then(
                        () => toast.success("Transaction deleted"),
                        (error: unknown) => toast.error(errorMessage(error)),
                      );
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ResourceTable
        rows={transactions.data ?? []}
        isLoading={transactions.isLoading || inventory.isLoading}
        error={loadError ? errorMessage(loadError) : null}
        onRetry={() => {
          void transactions.refetch();
          void inventory.refetch();
          void conversions.refetch();
        }}
        rowKey={(row) => row.id}
        emptyLabel="No transactions yet."
        addLabel="Record transaction"
        onAdd={() => setOpen(true)}
        defaultSort={{ id: "created", direction: "desc" }}
        columns={[
          {
            id: "inventory",
            header: "Inventory",
            sortValue: (row) => inventoryLabels.get(row.inventory_id) ?? "",
            cell: (row) => inventoryLabels.get(row.inventory_id) ?? "Unknown",
          },
          {
            id: "type",
            header: "Type",
            sortValue: (row) => row.transaction_type,
            cell: (row) => row.transaction_type,
          },
          {
            id: "quantity",
            header: "Quantity",
            align: "right",
            sortValue: (row) => row.quantity,
            cell: (row) => `${row.quantity} ${measurementNames.get(row.measurement_id) ?? ""}`.trim(),
          },
          {
            id: "price",
            header: "Unit price",
            align: "right",
            sortValue: (row) => row.unit_price,
            cell: (row) => `Php ${Number(row.unit_price).toFixed(2)}`,
          },
          {
            id: "status",
            header: "Status",
            sortValue: (row) => (row.is_approved ? 1 : 0),
            cell: (row) => (row.is_approved ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Pending</Badge>),
          },
          {
            id: "created",
            header: "Recorded",
            sortValue: (row) => Date.parse(row.created_at),
            cell: (row) => `${row.creator.username} · ${formatRelativeTime(row.created_at)}`,
          },
        ]}
      />
      <ResourceFormDialog<TransactionInput>
        open={open}
        title="Record transaction"
        schema={transactionCreateSchema}
        fields={fieldsFor}
        defaultValues={{ inventory_id: "", measurement_id: "", transaction_type: "SALE", quantity: 1, unit_price: 0 }}
        submitLabel="Submit for approval"
        onClose={() => setOpen(false)}
        onSubmit={async (values) => {
          await createRow.mutateAsync(values as TransactionCreate);
          toast.success("Transaction submitted for admin approval");
        }}
      />
    </div>
  );
}
