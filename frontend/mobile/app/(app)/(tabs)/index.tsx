import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { BarChart } from "react-native-gifted-charts";
import {
  dashboardStats,
  formatRelativeTime,
  formatReportDate,
  isAdmin,
  toDateInputValue,
  useDailySalesReport,
  useInventoryList,
  useMeasurements,
  useProducts,
  useUsers,
} from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { RetryBanner } from "../../../src/components/retry-banner";
import { colors, fontSizes, spacing, ui } from "../../../src/theme";

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const [reportDate, setReportDate] = useState(() => toDateInputValue());
  const products = useProducts();
  const inventory = useInventoryList();
  const measurements = useMeasurements();
  const users = useUsers();
  const dailySales = useDailySalesReport(reportDate);
  const failed = products.error || inventory.error || measurements.error || users.error || dailySales.error;
  const pending =
    products.isLoading || inventory.isLoading || measurements.isLoading || users.isLoading || dailySales.isLoading;
  const today = toDateInputValue();

  if (session && !isAdmin(session.user.role)) return <Redirect href="/(app)/(tabs)/inventory" />;

  function retry() {
    void products.refetch();
    void inventory.refetch();
    void measurements.refetch();
    void users.refetch();
    void dailySales.refetch();
  }

  if (!session || (pending && !dailySales.data) || !products.data || !inventory.data || !measurements.data || !users.data) {
    return (
      <View style={ui.screen}>
        {failed ? <RetryBanner message="Could not load the dashboard." onRetry={retry} /> : null}
      </View>
    );
  }

  const stats = dashboardStats({
    products: products.data,
    inventory: inventory.data,
    measurements: measurements.data,
    users: users.data,
    role: session.user.role,
  });
  const report = dailySales.data;
  const chartRows = report?.products ?? [];
  const cards = [
    { label: "Products", value: stats.productCount, background: colors.support, color: colors.textOnPrimary },
    { label: "Inventory records", value: stats.inventoryCount, background: colors.primary, color: colors.textOnPrimary },
    { label: "Low stock", value: stats.lowStockCount, background: colors.warning, color: colors.textOnWarning },
    { label: stats.fourth.label, value: stats.fourth.value, background: colors.success, color: colors.textOnPrimary },
  ];

  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
      <View>
        <Text style={ui.title}>Hi, {session.user.name || session.user.username}</Text>
        <Text style={ui.muted}>Inventory overview</Text>
      </View>
      {cards.map((card) => (
        <View key={card.label} style={[ui.card, { backgroundColor: card.background }]}>
          <Text style={{ color: card.color, fontSize: fontSizes.stat, fontWeight: "700" }}>{card.value}</Text>
          <Text style={{ color: card.color }}>{card.label}</Text>
        </View>
      ))}
      <View style={ui.card}>
        <Text style={ui.title}>Daily sales report</Text>
        <Text style={ui.muted}>As of {formatReportDate(report?.date ?? reportDate)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[3], marginTop: spacing[3] }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            onPress={() => setReportDate((current) => shiftDate(current, -1))}
            style={ui.primaryButton}
          >
            <Text style={ui.primaryButtonText}>Prev</Text>
          </Pressable>
          <Text style={[ui.body, { flex: 1, textAlign: "center" }]}>{formatReportDate(reportDate)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next day"
            disabled={reportDate >= today}
            onPress={() => setReportDate((current) => shiftDate(current, 1))}
            style={[ui.primaryButton, reportDate >= today && { opacity: 0.5 }]}
          >
            <Text style={ui.primaryButtonText}>Next</Text>
          </Pressable>
        </View>
        <Text style={[ui.body, { marginTop: spacing[3] }]}>
          {Number(report?.total_kg ?? 0).toFixed(2)} kg · Php {Number(report?.total_price ?? 0).toFixed(2)}
        </Text>
        {chartRows.length === 0 ? (
          <Text style={[ui.muted, { marginTop: spacing[3] }]}>No approved sales recorded for this day.</Text>
        ) : (
          <BarChart
            data={chartRows.slice(0, 8).map((item) => ({
              value: item.kg,
              label: item.name.slice(0, 8),
              frontColor: colors.primary,
              topLabelComponent: () => (
                <Text style={{ color: colors.textMuted, fontSize: 10, marginBottom: 4 }}>{item.kg.toFixed(1)}</Text>
              ),
            }))}
            barWidth={18}
            spacing={14}
            noOfSections={4}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            rulesColor={colors.border}
            yAxisColor={colors.border}
            xAxisColor={colors.border}
          />
        )}
        {chartRows.map((row) => (
          <Text key={row.product_id} style={[ui.body, { marginTop: spacing[2] }]}>
            {row.name} · {row.kg.toFixed(2)} kg · Php {row.total_price.toFixed(2)}
          </Text>
        ))}
      </View>
      <View style={ui.card}>
        <Text style={ui.title}>Low stock</Text>
        {stats.lowStock.length === 0 ? <Text style={ui.muted}>Nothing is below 10.</Text> : null}
        {stats.lowStock.slice(0, 6).map((row) => (
          <Text key={row.id} style={ui.body}>
            {row.productName} · {row.amount} {row.measurementShort}
          </Text>
        ))}
      </View>
      <View style={ui.card}>
        <Text style={ui.title}>Recent inventory</Text>
        {stats.recent.map((row) => (
          <Text key={row.id} style={ui.body}>
            {row.productName} · {row.amount} {row.measurementShort} · {formatRelativeTime(row.updatedAt)}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
