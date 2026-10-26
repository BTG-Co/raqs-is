import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Providers } from "../src/providers";
import { colors } from "../src/theme";

export default function RootLayout() {
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
