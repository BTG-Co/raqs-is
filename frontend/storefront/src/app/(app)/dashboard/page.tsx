"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Boxes, Package, TriangleAlert, Users } from "lucide-react";
import {
  dashboardStats,
  formatRelativeTime,
  formatReportDate,
  toDateInputValue,
  useDailySalesReport,
  useInventoryList,
  useMeasurements,
  useProducts,
  useUsers,
} from "@raqs/shared";
import { useSessionUser } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/utils";

export default function DashboardPage() {
  const user = useSessionUser();
  const [reportDate, setReportDate] = useState(() => toDateInputValue());
  const products = useProducts();
  const inventory = useInventoryList();
  const measurements = useMeasurements();
  const users = useUsers();
  const dailySales = useDailySalesReport(reportDate);
  const pending =
    products.isLoading || inventory.isLoading || measurements.isLoading || users.isLoading || dailySales.isLoading;
  const failed = products.error || inventory.error || measurements.error || users.error || dailySales.error;

  if (pending && !dailySales.data) {
    return (
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]" aria-busy="true">
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (failed || !products.data || !inventory.data || !measurements.data || !users.data) {
    return (
      <section className="rounded-card bg-card p-6 shadow-card">
        <p className="text-sm text-error" role="alert">
          {errorMessage(failed)}
        </p>
        <Button
          type="button"
          className="mt-4"
          variant="ghost"
          onClick={() => {
            void products.refetch();
            void inventory.refetch();
            void measurements.refetch();
            void users.refetch();
            void dailySales.refetch();
          }}
        >
          Retry
        </Button>
      </section>
    );
  }

  const stats = dashboardStats({
    products: products.data,
    inventory: inventory.data,
    measurements: measurements.data,
    users: users.data,
    role: user.role,
  });
  const report = dailySales.data;
  const chartRows =
    report?.products.map((row) => ({
      name: row.name,
      kg: row.kg,
      totalPrice: row.total_price,
    })) ?? [];

  const cards = [
    { label: "Products", value: stats.productCount, tone: "bg-support text-on-primary", icon: Package },
    { label: "Inventory records", value: stats.inventoryCount, tone: "bg-primary text-on-primary", icon: Boxes },
    { label: "Low stock", value: stats.lowStockCount, tone: "bg-warning text-on-warning", icon: TriangleAlert },
    {
      label: stats.fourth.label,
      value: stats.fourth.value,
      tone: "bg-success text-on-primary",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Hi, {user.name || user.username}</h1>
        <p className="text-sm text-muted">Inventory overview</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className={`flex items-center justify-between rounded-card p-4 shadow-card ${card.tone}`}>
                <div>
                  <p className="text-3xl font-semibold">{card.value}</p>
                  <p className="text-sm opacity-90">{card.label}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/15" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
              </article>
            );
          })}
        </div>
        <section className="rounded-card bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Daily sales report</h2>
              <p className="mt-1 text-xs text-muted">
                As of {formatReportDate(report?.date ?? reportDate)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-date" className="text-xs text-muted">
                Report day
              </Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                max={toDateInputValue()}
                onChange={(event) => setReportDate(event.target.value)}
                className="w-auto"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Total sold" value={`${Number(report?.total_kg ?? 0).toFixed(2)} kg`} />
            <MiniStat label="Total sales" value={`Php ${Number(report?.total_price ?? 0).toFixed(2)}`} />
          </div>
          <div className="mt-4 h-64">
            {dailySales.isFetching && !report ? (
              <Skeleton className="h-full w-full" />
            ) : chartRows.length === 0 ? (
              <p className="text-sm text-muted">No approved sales recorded for this day.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} hide={chartRows.length > 8} />
                  <YAxis tick={{ fontSize: 12 }} unit=" kg" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "kg") return [`${Number(value).toFixed(2)} kg`, "Sold"];
                      if (name === "totalPrice") return [`Php ${Number(value).toFixed(2)}`, "Total"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey="kg" name="kg" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {chartRows.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-line pt-3">
              {chartRows.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">{row.name}</span>
                  <span className="text-muted">
                    {row.kg.toFixed(2)} kg · Php {row.totalPrice.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-card bg-card p-4 shadow-card">
          <h2 className="mb-3 text-base font-semibold text-ink">Low stock</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted">Nothing is below 10.</p>
          ) : (
            <ul className="space-y-3">
              {stats.lowStock.slice(0, 6).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{row.productName}</p>
                    <p className="text-xs text-muted">
                      {row.amount} {row.measurementShort}
                    </p>
                  </div>
                  <Badge tone="warning">Low</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-card bg-card p-4 shadow-card">
          <h2 className="mb-3 text-base font-semibold text-ink">Recent inventory</h2>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted">No inventory yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{row.productName}</p>
                    <p className="text-xs text-muted">{row.measurementName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-ink">
                      {row.amount} {row.measurementShort}
                    </p>
                    <p className="text-xs text-muted">{formatRelativeTime(row.updatedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
