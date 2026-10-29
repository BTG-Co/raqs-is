"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  formatRelativeTime,
  isAdmin,
  isLowStock,
  useInventoryDetail,
  useMeasurements,
  type InventoryLedgerItem,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { useSessionUser } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/utils";

export default function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useSessionUser();
  const admin = isAdmin(user.role);
  const detail = useInventoryDetail(params.id);
  const measurements = useMeasurements();

  const measurementNames = useMemo(
    () => new Map((measurements.data ?? []).map((row) => [row.id, row.short_name])),
    [measurements.data],
  );

  useEffect(() => {
    if (!admin) router.replace("/inventory");
  }, [admin, router]);

  if (!admin) return null;

  if (detail.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Inventory detail" />
        <p className="text-sm text-error" role="alert">
          {detail.error ? errorMessage(detail.error) : "Inventory not found."}
        </p>
        <Button type="button" variant="ghost" onClick={() => void detail.refetch()}>
          Retry
        </Button>
        <Link href="/inventory" className="block text-sm text-primary">
          Back to inventory
        </Link>
      </div>
    );
  }

  const data = detail.data;
  const stockUnit = data.stock_views.find((view) => view.is_stock_unit);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeader title={data.product_name} />
          <p className="mt-1 text-sm text-muted">
            On hand {data.inventory.current_stock} {stockUnit?.short_name ?? ""}
            {isLowStock(data.inventory.current_stock) ? (
              <Badge tone="warning" className="ml-2">
                Low
              </Badge>
            ) : (
              <Badge tone="success" className="ml-2">
                In stock
              </Badge>
            )}
          </p>
        </div>
        <Link href="/inventory">
          <Button type="button" variant="ghost">
            Back
          </Button>
        </Link>
      </div>

      <section className="rounded-card bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-ink">Stock by measurement</h2>
        <p className="mt-1 text-sm text-muted">
          Current stock expressed through conversions from the product base measurement.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.stock_views.map((view) => (
            <li key={view.measurement_id} className="rounded-lg border border-line px-4 py-3">
              <p className="text-xs text-muted">
                {view.measurement_name} ({view.short_name})
                {view.is_stock_unit ? " · stock unit" : ""}
                {view.is_base_unit ? " · product base" : ""}
              </p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {Number(view.quantity).toFixed(2)} {view.short_name}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card bg-card shadow-card">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Transactions</h2>
          <p className="mt-1 text-sm text-muted">
            Running balance is in the inventory stock unit after each approved transaction.
          </p>
        </div>
        {data.transactions.length === 0 ? (
          <p className="p-4 text-sm text-muted">No transactions for this inventory yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entered</TableHead>
                  <TableHead className="text-right">Stock delta</TableHead>
                  <TableHead className="text-right">Running balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {data.transactions.map((row: InventoryLedgerItem) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.creator.username} · {formatRelativeTime(row.created_at)}
                    </TableCell>
                    <TableCell>{row.transaction_type}</TableCell>
                    <TableCell>
                      {row.quantity} {measurementNames.get(row.measurement_id) ?? ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.signed_stock_delta > 0 ? "+" : ""}
                      {Number(row.signed_stock_delta).toFixed(2)} {stockUnit?.short_name ?? ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.running_balance === null || row.running_balance === undefined
                        ? "—"
                        : `${Number(row.running_balance).toFixed(2)} ${stockUnit?.short_name ?? ""}`}
                    </TableCell>
                    <TableCell>
                      {row.is_approved ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-right">Php {Number(row.unit_price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
