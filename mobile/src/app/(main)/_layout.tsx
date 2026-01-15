import { Tabs, Redirect } from "expo-router";

import { useAuthStore } from "../../store/authStore";
import { useTheme } from "@/src/theme";
import LoadingSpinner from "@/src/components/ui/loading-spinner";
import BrandHeader from "@/src/components/brand-header";
import { House, Wallet, History, ArrowLeftRight, Settings } from "lucide-react-native";

export default function MainLayout() {
    const status = useAuthStore((s) => s.status);
    const theme = useTheme();

    if (status === "bootstrapping") {
        return <LoadingSpinner message="Chargement…" />;
    }

    if (status !== "authenticated") {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                header: () => <BrandHeader />,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.placeholder,
                tabBarStyle: { backgroundColor: theme.colors.background }
            }}>
            <Tabs.Screen name="dashboard" options={{
                title: "Home",
                tabBarIcon: ({ color, size }) => (
                    <House color={color} size={size} />
                )
            }} />
            <Tabs.Screen name="wallet" options={{
                title: "Wallet",
                tabBarIcon: ({ color, size }) => (
                    <Wallet color={color} size={size} />
                )
            }} />
            <Tabs.Screen name="history" options={{
                title: "History",
                tabBarIcon: ({ color, size }) => (
                    <History color={color} size={size} />
                )
            }} />
            <Tabs.Screen name="profile" options={{
                title: "Profil",
                tabBarIcon: ({ color, size }) => (
                    <Settings color={color} size={size} />
                )
            }} />
        </Tabs>
    );
};