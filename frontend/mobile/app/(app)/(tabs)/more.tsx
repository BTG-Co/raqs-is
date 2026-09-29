import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { isAdmin } from "@raqs/shared";
import { useAuth } from "../../../src/auth/auth-context";
import { colors, spacing, ui } from "../../../src/theme";

export default function MoreScreen() {
  const { session, logout } = useAuth();
  const items = isAdmin(session?.user.role)
    ? [
        { label: "Measurements", href: "/(app)/measurements" as const },
        { label: "Conversions", href: "/(app)/conversions" as const },
        { label: "Users", href: "/(app)/users" as const },
        { label: "Profile", href: "/(app)/profile" as const },
      ]
    : [];

  return (
    <View style={[ui.screen, { padding: spacing[4], gap: spacing[3] }]}>
      {items.map((item) => (
        <Pressable
          key={item.href}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={() => router.push(item.href)}
          style={ui.card}
        >
          <Text style={ui.body}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={() => {
          void logout().then(() => router.replace("/login"));
        }}
        style={[ui.card, { backgroundColor: colors.sidebar }]}
      >
        <Text style={ui.body}>Log out</Text>
      </Pressable>
    </View>
  );
}
