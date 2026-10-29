import { ScrollView, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { BarChart } from "react-native-gifted-charts";
import {
  dailySalesByProduct,
  dashboardStats,
  findKgMeasurement,
  formatRelativeTime,
  isAdmin,
  useInventoryList,
  useMeasurementConversions,
  useMeasurements,
  useProducts,
  useTransactions,
  useUsers,
} from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { RetryBanner } from "../../../src/components/retry-banner";
import { colors, fontSizes, spacing, ui } from "../../../src/theme";

export default function DashboardScreen() {
  const { session } = useAuth();
  const products = useProducts();
  const inventory = useInventoryList();
  const measurements = useMeasurements();
  const conversions = useMeasurementConversions();
  const transactions = useTransactions();
  const users = useUsers();
  const failed =
    products.error ||
    inventory.error ||
    measurements.error ||
    conversions.error ||
    transactions.error ||
    users.error;
  const pending =
    products.isLoading ||
    inventory.isLoading ||
    measurements.isLoading ||
    conversions.isLoading ||
    transactions.isLoading ||
    users.isLoading;

  if (session && !isAdmin(session.user.role)) return <Redirect href="/(app)/(tabs)/inventory" />;

  function retry() {
    void products.refetch();
    void inventory.refetch();
    void measurements.refetch();
    void conversions.refetch();
    void transactions.refetch();
    void users.refetch();
  }

  if (
    !session ||
    pending ||
    !products.data ||
    !inventory.data ||
    !measurements.data ||
    !conversions.data ||
    !transactions.data ||
    !users.data
  ) {
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
  const dailySales = dailySalesByProduct({
    transactions: transactions.data,
    inventory: inventory.data,
    products: products.data,
    measurements: measurements.data,
    conversions: conversions.data,
  });
  const kg = findKgMeasurement(measurements.data);
  const dailyTotalKg = dailySales.reduce((sum, row) => sum + row.kg, 0);
  const dailyTotalPrice = dailySales.reduce((sum, row) => sum + row.totalPrice, 0);
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
        <Text style={ui.muted}>Approved sales today, converted to kg per product.</Text>
        <Text style={[ui.body, { marginTop: spacing[3] }]}>
          {dailyTotalKg.toFixed(2)} kg · Php {dailyTotalPrice.toFixed(2)}
        </Text>
        {!kg ? (
          <Text style={[ui.muted, { marginTop: spacing[3] }]}>Create a kg measurement to see the daily sales chart.</Text>
        ) : dailySales.length === 0 ? (
          <Text style={[ui.muted, { marginTop: spacing[3] }]}>No approved sales recorded today.</Text>
        ) : (
          <BarChart
            data={dailySales.slice(0, 8).map((item) => ({
              value: item.kg,
              label: item.name.slice(0, 8),
              frontColor: colors.primary,
              topLabelComponent: () => (
                <Text style={{ color: colors.textMuted, fontSize: 10, marginBottom: 4 }}>
                  {item.kg.toFixed(1)}
                </Text>
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
        {dailySales.map((row) => (
          <Text key={row.productId} style={[ui.body, { marginTop: spacing[2] }]}>
            {row.name} · {row.kg.toFixed(2)} kg · Php {row.totalPrice.toFixed(2)}
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
