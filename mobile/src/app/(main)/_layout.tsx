import { Tabs } from "expo-router";

export default function MainLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Tabs.Screen name="transfer" options={{ title: "Transfert" }} />
            <Tabs.Screen name="deposit" options={{ title: "Dépôt" }} />
            <Tabs.Screen name="withdraw" options={{ title: "Retrait" }} />
            <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
            <Tabs.Screen name="profile" options={{ title: "Profil" }} />
        </Tabs>
    );
};