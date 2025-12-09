import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { StyleSheet } from "react-native";
import { House, Wallet, History, ArrowLeftRight, Settings } from "lucide-react-native";

export default function MainLayout() {
    const status = useAuthStore((s) => s.status);
    if (status !== "authenticated") {
        return <Redirect href="/(auth)/login" />;
    }
    return (
        <Tabs screenOptions={{ headerShown: true }}>
            <Tabs.Screen name="dashboard" options={{
                title: "Home",
                tabBarIcon: ({ color, size, focused }) => (
                    <House color={focused ? "#7c3aed" : color} size={size} />
                )
            }} />
            <Tabs.Screen name="wallet" options={{
                title: "Wallet",
                tabBarIcon: ({ color, size, focused }) => (
                    <Wallet color={focused ? "#7c3aed" : color} size={size} />
                )
            }} />
            <Tabs.Screen name="history" options={{
                title: "History",
                tabBarIcon: ({ color, size, focused }) => (
                    <History color={focused ? "#7c3aed" : color} size={size} />
                )
            }} />
            <Tabs.Screen name="profile" options={{
                title: "Profil",
                tabBarIcon: ({ color, size, focused }) => (
                    <Settings color={focused ? "#7c3aed" : color} size={size} />
                )
            }} />
        </Tabs>
    );
};