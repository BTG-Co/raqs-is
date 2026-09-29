import { ScrollView, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { BarChart } from "react-native-gifted-charts";
import { dashboardStats, formatRelativeTime, isAdmin, useInventoryList, useMeasurements, useProducts, useUsers } from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { RetryBanner } from "../../../src/components/retry-banner";
import { colors, fontSizes, radii, spacing, ui } from "../../../src/theme";

export default function DashboardScreen() {
  const { session } = useAuth();
  const products = useProducts();
  const inventory = useInventoryList();
  const measurements = useMeasurements();
  const users = useUsers();
  const failed = products.error || inventory.error || measurements.error || users.error;
  const pending = products.isLoading || inventory.isLoading || measurements.isLoading || users.isLoading;

  if (session && !isAdmin(session.user.role)) return <Redirect href="/(app)/(tabs)/inventory" />;

  function retry() {
    void products.refetch();
    void inventory.refetch();
    void measurements.refetch();
    void users.refetch();
  }

  if (!session || pending || !products.data || !inventory.data || !measurements.data || !users.data) {
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
        <Text style={ui.title}>Inventory by product</Text>
        <Text style={ui.muted}>Totals add raw amounts. Units are not converted.</Text>
        {stats.byProduct.length === 0 ? (
          <Text style={[ui.muted, { marginTop: spacing[3] }]}>No inventory yet.</Text>
        ) : (
          <BarChart
            data={stats.byProduct.slice(0, 8).map((item) => ({
              value: item.amount,
              label: item.name.slice(0, 8),
              frontColor: colors.primary,
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
        <Text style={ui.title}>Products by measurement</Text>
        {stats.byMeasurement.map((item) => (
          <View key={item.measurementId} style={{ marginTop: spacing[3] }}>
            <Text style={ui.body}>
              {item.name} {Math.round(item.share * 100)}%
            </Text>
            <View style={{ height: 8, borderRadius: radii.pill, backgroundColor: colors.border }}>
              <View
                style={{
                  height: 8,
                  borderRadius: radii.pill,
                  backgroundColor: colors.primary,
                  width: `${Math.max(item.share * 100, 4)}%`,
                }}
              />
            </View>
          </View>
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
