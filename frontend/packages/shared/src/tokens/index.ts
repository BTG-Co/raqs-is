import paletteData from "./palette.json";

export type ColorMode = "light" | "dark";

export type ColorToken = {
  light: string;
  dark: string;
};

export const palette = paletteData;

export const colors = palette.colors;
export const primaryScale = palette.primaryScale;
export const secondaryScale = palette.secondaryScale;
export const spacing = palette.spacing;
export const radii = palette.radii;
export const fontSizes = palette.fontSizes;
export const touchTarget = palette.touchTarget;

export function color(token: ColorToken, mode: ColorMode = "light"): string {
  return token[mode];
}

export const theme = {
  mode: "light" as ColorMode,
  colors: {
    primary: colors.primary.light,
    secondary: colors.secondary.light,
    warning: colors.warning.light,
    error: colors.error.light,
    success: colors.success.light,
    support: colors.support.light,
    textOnWarning: colors.textOnWarning.light,
    textOnSecondary: colors.textOnSecondary.light,
    textOnPrimary: colors.textOnPrimary.light,
    background: colors.background.light,
    card: colors.card.light,
    sidebar: colors.sidebar.light,
    border: colors.border.light,
    text: colors.text.light,
    textMuted: colors.textMuted.light,
    navbar: colors.navbar.light,
    white: colors.white.light,
  },
  spacing,
  radii,
  fontSizes,
  touchTarget,
};

export type Theme = typeof theme;
