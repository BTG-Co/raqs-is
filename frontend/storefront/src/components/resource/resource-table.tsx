"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyLabel: string;
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (row: T) => void;
  editLabel?: string;
  onDelete?: (row: T) => Promise<void> | void;
  deleteLabel?: (row: T) => string;
  defaultSort?: { id: string; direction: "asc" | "desc" };
  pageSize?: number;
};

export function ResourceTable<T>({
  rows,
  columns,
  rowKey,
  isLoading,
  error,
  onRetry,
  emptyLabel,
  onAdd,
  addLabel = "Add",
  onEdit,
  editLabel = "Edit",
  onDelete,
  deleteLabel,
  defaultSort,
  pageSize = 10,
}: Props<T>) {
  const [sort, setSort] = useState(defaultSort ?? { id: columns[0]?.id ?? "", direction: "asc" as const });
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [sort]);

  const filtered = useMemo(() => {
    const column = columns.find((item) => item.id === sort.id);
    if (!column?.sortValue) return rows;
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = column.sortValue?.(a);
      const right = column.sortValue?.(b);
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left).localeCompare(String(right)) * direction;
    });
  }, [columns, rows, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);
  const showActions = Boolean(onEdit || onDelete);

  function toggleSort(id: string) {
    setSort((prev) =>
      prev.id === id ? { id, direction: prev.direction === "asc" ? "desc" : "asc" } : { id, direction: "asc" },
    );
  }

  return (
    <section className="rounded-card bg-card shadow-card">
      {isLoading ? (
        <div className="space-y-3 p-4" aria-busy="true" aria-live="polite">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
          {onRetry ? (
            <Button type="button" variant="ghost" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-muted">{emptyLabel}</p>
          {onAdd ? (
            <Button type="button" onClick={onAdd}>
              {addLabel}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <tr>
                {columns.map((column) => (
                  <TableHead key={column.id} className={column.align === "right" ? "text-right" : undefined}>
                    {column.sortValue ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort(column.id)}
                      >
                        {column.header}
                        {sort.id === column.id ? (
                          sort.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" aria-label="Sorted ascending" />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-label="Sorted descending" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
                {showActions ? <TableHead className="text-right">Actions</TableHead> : null}
              </tr>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.align === "right" ? "text-right" : undefined}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                  {showActions ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(row)}>
                            {editLabel}
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setPendingDelete(row)}>
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {filtered.length > pageSize ? (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
          <span>
            Page {current + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent title="Delete record">
          <p className="text-sm text-muted">
            Delete {pendingDelete && deleteLabel ? deleteLabel(pendingDelete) : "this record"}? This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={() => {
                if (!pendingDelete || !onDelete) return;
                setDeleting(true);
                Promise.resolve(onDelete(pendingDelete))
                  .then(() => setPendingDelete(null))
                  .finally(() => setDeleting(false));
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
