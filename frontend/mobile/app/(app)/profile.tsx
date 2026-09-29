import { Pressable, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "../../src/auth/auth-context";
import { spacing, ui } from "../../src/theme";

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  if (session && session.user.role !== "ADMIN") return <Redirect href="/(app)/(tabs)/inventory" />;
  if (!session) return null;

  return (
    <View style={[ui.screen, { padding: spacing[4], gap: spacing[4] }]}>
      <View style={[ui.card, { gap: spacing[3] }]}>
        <Text style={ui.muted}>Name</Text>
        <Text style={ui.body}>{session.user.name}</Text>
        <Text style={ui.muted}>Username</Text>
        <Text style={ui.body}>{session.user.username}</Text>
        <Text style={ui.muted}>Role</Text>
        <Text style={ui.body}>{session.user.role}</Text>
        <Text style={ui.muted}>Profile edits need a future auth endpoint. This screen is read-only.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={() => {
          void logout().then(() => router.replace("/login"));
        }}
        style={ui.primaryButton}
      >
        <Text style={ui.primaryButtonText}>Log out</Text>
      </Pressable>
    </View>
  );
}
