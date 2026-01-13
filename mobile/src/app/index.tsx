import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { ActivityIndicator, View } from "react-native";

import Screen from "../components/screen";

export default function Index() {
    const status = useAuthStore((s) => s.status);

    if (status === "bootstrapping") {
        return (
            <Screen>
                <ActivityIndicator size="large" />
            </Screen>
        );
    }

    if (status === "authenticated") {
        return <Redirect href="/(main)/dashboard" />;
    }

    return <Redirect href="/(auth)/login" />;
}