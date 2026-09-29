import { Pressable, Text } from "react-native";
import { ui } from "../theme";

export function RetryBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Retry" onPress={onRetry} style={ui.banner}>
      <Text style={ui.bannerText}>{message} Tap to retry.</Text>
    </Pressable>
  );
}
