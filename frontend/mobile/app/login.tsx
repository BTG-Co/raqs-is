import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Redirect, router } from "expo-router";
import { ApiError } from "@raqs/shared";
import { useAuth } from "../src/auth/auth-context";
import { colors, spacing, ui } from "../src/theme";

export default function LoginScreen() {
  const { session, ready, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const mock = process.env.EXPO_PUBLIC_AUTH_MODE === "mock";

  if (ready && session) {
    return <Redirect href={session.user.role === "STAFF" ? "/(app)/(tabs)/inventory" : "/(app)/(tabs)"} />;
  }

  return (
    <View style={[ui.screen, { justifyContent: "center", padding: spacing[4] }]}>
      <View style={[ui.card, { gap: spacing[4] }]}>
        <Text style={ui.title}>Sign in</Text>
        {mock ? (
          <Text style={{ backgroundColor: colors.warning, color: colors.textOnWarning, padding: spacing[3], borderRadius: 8 }}>
            Dev login. Password is not checked.
          </Text>
        ) : null}
        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        <TextInput
          accessibilityLabel="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          style={ui.input}
        />
        <TextInput
          accessibilityLabel="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          style={ui.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          disabled={pending}
          onPress={() => {
            setPending(true);
            setError(null);
            void login(username.trim(), password)
              .then((next) => router.replace(next.user.role === "STAFF" ? "/(app)/(tabs)/inventory" : "/(app)/(tabs)"))
              .catch((loginError: unknown) => {
                setError(loginError instanceof ApiError ? loginError.message : "Login failed.");
              })
              .finally(() => setPending(false));
          }}
          style={ui.primaryButton}
        >
          <Text style={ui.primaryButtonText}>{pending ? "Signing in…" : "Sign in"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
