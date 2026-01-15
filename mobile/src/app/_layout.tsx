import "../i18n";
import { Slot } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme";

export default function RootLayout() {
    const theme = useTheme();
    const status = useAuthStore((s) => s.status);
    const bootstrap = useAuthStore((s) => s.bootstrap);

    const hasBootstrappedRef = useRef(false);

    useEffect(() => {
        if (hasBootstrappedRef.current) {
            return;
        }
        hasBootstrappedRef.current = true;
        bootstrap();
    }, [bootstrap]);

    if (status === "bootstrapping") {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: theme.background,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator />
            </View>
        );
    }

    return <Slot />;
}