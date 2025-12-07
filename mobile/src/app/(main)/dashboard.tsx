import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Screen from "../../components/Screen";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";

import QuickActions from "@/src/components/quick-actions";
import RecentTransactions from "@/src/components/recent-transactions";
import SafeComponent from "@/src/components/safe-component";
import WalletSummary from "@/src/components/wallet-summary";

export default function Dashboard() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    console.log(`Dashboard user: ${user?.id}`);
    const greeting = user && (user.name || user.firstName)
        ? `Bonjour ${user.name || user.firstName} 👋`
        : "Bonjour 👋";

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container}>
                <SafeComponent>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>{greeting}</Text>
                            <Text style={styles.date}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationButton} onPress={() => { /* TODO: open notifications */ }}>
                            <Text style={styles.notificationText}>🔔</Text>
                        </TouchableOpacity>
                    </View>
                </SafeComponent>

                <SafeComponent>
                    <View style={{ width: '100%' }}>
                        <WalletSummary />
                    </View>
                </SafeComponent>

                <SafeComponent>
                    <View style={{ width: '100%' }}>
                        <QuickActions />
                    </View>
                </SafeComponent>

                {/* Promo card */}
                <SafeComponent>
                    <View style={styles.promoCard}>
                        <View style={styles.promoLeft}>
                            <Text style={styles.promoTitle}>Offre spéciale</Text>
                            <Text style={styles.promoSubtitle}>5% de réduction sur les recharges aujourd'hui</Text>
                        </View>
                        <TouchableOpacity style={styles.promoButton} onPress={() => { /* TODO: promo action */ }}>
                            <Text style={styles.promoButtonText}>Profiter</Text>
                        </TouchableOpacity>
                    </View>
                </SafeComponent>

                <SafeComponent>
                    <View style={{ width: '100%' }}>
                        <RecentTransactions />
                    </View>
                </SafeComponent>
                
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 40,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    date: {
        color: '#6b7280',
        marginTop: 4,
    },
    notificationButton: {
        padding: 8,
        borderRadius: 10,
    },
    notificationText: {
        fontSize: 18,
    },
    promoCard: {
        width: '100%',
        backgroundColor: '#7c3aed',
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    promoLeft: {
        flex: 1,
    },
    promoTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    promoSubtitle: {
        color: '#fff',
    },
    promoButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    promoButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    logoutButton: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#ef4444',
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
