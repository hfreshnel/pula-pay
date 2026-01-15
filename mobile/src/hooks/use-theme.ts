import { useColorScheme } from "react-native";
import { useUIStore } from "@/src/store/uiStore";
import type { Theme } from "@/src/theme/types";
import light from "@/src/theme/light";
import dark from "@/src/theme/dark";

export function useTheme() : Theme {
    const system = useColorScheme();
    const override = useUIStore((s) => s.theme);

    const mode = override === "system" || !override ? system || "light" : override;
    return mode === "dark" ? dark : light;
}