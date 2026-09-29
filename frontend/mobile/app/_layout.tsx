import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Providers } from "../src/providers";
import { colors, spacing, ui } from "../src/theme";

export default function RootLayout() {
  if (!__DEV__ && process.env.EXPO_PUBLIC_AUTH_MODE === "mock") {
    return (
      <View style={[ui.screen, { padding: spacing[6], justifyContent: "center" }]}>
        <Text style={ui.title}>Mock auth is disabled</Text>
        <Text style={ui.muted}>
          Replace MockAuthProvider with POST /auth/login before shipping a production build.
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <Providers>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
