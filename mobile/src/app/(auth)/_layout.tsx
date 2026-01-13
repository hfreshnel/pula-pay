import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../../components/ui/loading-spinner";

export default function AuthLayout() {
    const status = useAuthStore((s) => s.status);

    if (status === "bootstrapping") {
        return <LoadingSpinner message="Chargement…" />;
    }

    if (status === "authenticated") {
        return <Redirect href="/(main)/dashboard" />;
    }
    return (
        <Stack initialRouteName="login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="verify-otp" />
        </Stack>
    )
}