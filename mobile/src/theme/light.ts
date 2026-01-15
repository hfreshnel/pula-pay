import { ColorPalette, Theme } from "./types";
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from "@/src/constants/theme";

const lightPalette: ColorPalette = {
    primary: "#7c3aed",
    primaryDark: "#6d28d9",
    onPrimary: "#FFFFFF",
    secondary: "#94a3b8",
    onSecondary: "#FFFFFF",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceVariant: "#F1F5F9",
    text: "#0F172A",
    textMuted: "#64748b",
    outline: "#E2E8F0",
    inputBackground: "#FFFFFF",
    placeholder: "#94a3b8",
    success: "#22c55e",
    successLight: "#dcfce7",
    danger: "#ef4444",
    dangerLight: "#fee2e2",
    warning: "#f59e0b",
    warningLight: "#fef3c7",
    primaryLight: "#ede9fe",
};

const light: Theme = {
    mode: "light" as const,
    colors: lightPalette,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: TYPOGRAPHY,
};

export default light;
