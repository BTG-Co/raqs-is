import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { isAdmin } from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { colors } from "../../../src/theme";

export default function TabsLayout() {
  const { session } = useAuth();
  const admin = isAdmin(session?.user.role);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.navbar },
        headerTintColor: colors.textOnPrimary,
        tabBarStyle: { backgroundColor: colors.card },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          href: admin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
