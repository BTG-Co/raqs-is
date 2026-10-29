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

  if (ready && session) {
    return <Redirect href={session.user.role === "STAFF" ? "/(app)/(tabs)/inventory" : "/(app)/(tabs)"} />;
  }

  return (
    <View style={[ui.screen, { justifyContent: "center", padding: spacing[4] }]}>
      <View style={[ui.card, { gap: spacing[4] }]}>
        <Text style={ui.title}>Sign in</Text>
        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        <TextInput
          accessibilityLabel="Username"
          autoCapitalize="none"
          editable={!pending}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          style={[ui.input, pending && { opacity: 0.6 }]}
        />
        <TextInput
          accessibilityLabel="Password"
          secureTextEntry
          editable={!pending}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          style={[ui.input, pending && { opacity: 0.6 }]}
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
          style={[ui.primaryButton, pending && { opacity: 0.6 }]}
        >
          <Text style={ui.primaryButtonText}>{pending ? "Signing in…" : "Sign in"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
