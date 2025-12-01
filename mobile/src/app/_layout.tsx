import "../i18n";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme";

export default function RootLayout() {
    const [ready, setReady] = useState(false);
    const loadTokenFromStorage = useAuthStore((s) => s.loadTokenFromStorage);
    const theme = useTheme();

    useEffect(() => {
        (async () => {
            await loadTokenFromStorage();
            setReady(true);
        })();
    }, []);

    if (!ready) {
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