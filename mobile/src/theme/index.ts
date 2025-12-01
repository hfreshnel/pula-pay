import { useColorScheme } from "react-native";
import { useUIStore } from "../store/uiStore";
import type { Theme } from "./theme";
import light from "./light";
import dark from "./dark";

export function useTheme() : Theme {
    const system = useColorScheme();
    const override = useUIStore((s) => s.theme);

    const mode = override === "system" || !override ? system || "light" : override;
    return mode === "dark" ? dark : light;
}