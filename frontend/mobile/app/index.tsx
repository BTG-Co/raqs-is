import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/auth/auth-context";
import { colors, ui } from "../src/theme";

export default function Index() {
  const { ready, session } = useAuth();
  if (!ready) {
    return (
      <View style={[ui.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;
  return <Redirect href={session.user.role === "STAFF" ? "/(app)/(tabs)/inventory" : "/(app)/(tabs)"} />;
}
