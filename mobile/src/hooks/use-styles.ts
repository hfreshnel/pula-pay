import { useMemo } from "react";
import { useTheme } from "@/src/hooks/use-theme";
import type { Theme } from "@/src/theme/types";

export function useStyles<T>(styleGenerator: (theme: Theme) => T): T {
    const theme = useTheme();
    return useMemo(() => styleGenerator(theme), [styleGenerator, theme]);
}
