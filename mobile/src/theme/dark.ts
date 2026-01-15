import { ColorPalette, Theme } from "./types";
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from "@/src/constants/theme";

const darkPalette: ColorPalette = {
    primary: "#a78bfa",
    primaryDark: "#7c3aed",
    onPrimary: "#FFFFFF",
    secondary: "#475569",
    onSecondary: "#F8FAFC",
    background: "#0F172A",
    surface: "#1E293B",
    surfaceVariant: "#334155",
    text: "#F8FAFC",
    textMuted: "#94a3b8",
    outline: "#334155",
    inputBackground: "#0F172A",
    placeholder: "#64748b",
    success: "#4ade80",
    successLight: "#14532d",
    danger: "#f87171",
    dangerLight: "#7f1d1d",
    warning: "#fbbf24",
    warningLight: "#78350f",
    primaryLight: "#4c1d95",
};

const dark: Theme = {
    mode: "dark" as const,
    colors: darkPalette,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: TYPOGRAPHY,
};

export default dark;
