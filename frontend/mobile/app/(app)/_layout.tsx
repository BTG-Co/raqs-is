import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/auth/auth-context";
import { colors, ui } from "../../src/theme";

export default function AppLayout() {
  const { ready, session } = useAuth();
  if (!ready) {
    return (
      <View style={[ui.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navbar },
        headerTintColor: colors.textOnPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="measurements" options={{ title: "Measurements" }} />
      <Stack.Screen name="conversions" options={{ title: "Conversions" }} />
      <Stack.Screen name="users" options={{ title: "Users" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="product-form" options={{ title: "Product", presentation: "modal" }} />
      <Stack.Screen name="inventory-form" options={{ title: "Inventory", presentation: "modal" }} />
      <Stack.Screen name="transaction-form" options={{ title: "Transaction", presentation: "modal" }} />
      <Stack.Screen name="measurement-form" options={{ title: "Measurement", presentation: "modal" }} />
      <Stack.Screen name="conversion-form" options={{ title: "Conversion", presentation: "modal" }} />
      <Stack.Screen name="user-form" options={{ title: "User", presentation: "modal" }} />
    </Stack>
  );
}
