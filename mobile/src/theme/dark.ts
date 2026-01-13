import { ColorPalette, Theme } from "./types";
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from "@/src/constants/theme";

const darkPalette: ColorPalette = {
    primary: "#818cf8",
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
    danger: "#f87171",
    warning: "#fbbf24",
};

const dark: Theme = {
    mode: "dark" as const,
    colors: darkPalette,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: TYPOGRAPHY,
};

export default dark;
