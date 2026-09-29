import { StyleSheet } from "react-native";
import { theme } from "@raqs/shared";

export const colors = theme.colors;
export const spacing = theme.spacing;
export const radii = theme.radii;
export const fontSizes = theme.fontSizes;
export const touchTarget = theme.touchTarget;

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing[4],
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: "600",
  },
  body: {
    color: colors.text,
    fontSize: fontSizes.md,
  },
  muted: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: spacing[3],
    fontSize: fontSizes.md,
  },
  primaryButton: {
    minHeight: touchTarget,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: spacing[4],
    bottom: spacing[6],
    minWidth: touchTarget,
    minHeight: touchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  banner: {
    backgroundColor: colors.error,
    padding: spacing[3],
  },
  bannerText: {
    color: colors.textOnPrimary,
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
});
