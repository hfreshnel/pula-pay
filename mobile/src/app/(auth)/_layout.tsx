import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export default function AuthLayout() {
    const status = useAuthStore((s) => s.status);

  if (status === "authenticated") {
    return <Redirect href="/(main)/dashboard" />;
  }
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="verify-otp" />
        </Stack>
    )
}