import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Screen from "../../components/screen";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";

import QuickActions from "@/src/components/quick-actions";
import RecentTransactions from "@/src/components/recent-transactions";
import SafeComponent from "@/src/components/safe-component";
import WalletSummary from "@/src/components/wallet-summary";
import { useStyles } from "@/src/hooks/use-styles";
import type { Theme } from "@/src/theme/types";
import type { User } from "@/src/store/types";

export default function Dashboard() {
    const { t } = useTranslation();
    const styles = useStyles(getStyles);
    const user = useAuthStore((s) => s.user) as User | null;
    const greeting = user && (user.name || user.firstName)
        ? `Bonjour ${user.name || user.firstName} 👋`
        : "Bonjour 👋";

    return (
        <Screen scroll contentStyle={styles.container}>
            <SafeComponent>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greeting}</Text>
                        <Text style={styles.date}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                    </View>
                </View>
            </SafeComponent>

            <SafeComponent>
                <View style={{ width: '100%' }}>
                    <WalletSummary />
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

        </Screen>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        padding: theme.spacing.m,
        paddingBottom: theme.spacing.xxl,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    greeting: {
        ...theme.typography.h1,
        color: theme.colors.text,
    },
    date: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
    },
    promoCard: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginVertical: theme.spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    promoLeft: {
        flex: 1,
    },
    promoTitle: {
        ...theme.typography.h2,
        color: theme.colors.onPrimary,
        marginBottom: theme.spacing.xs,
    },
    promoSubtitle: {
        ...theme.typography.body,
        color: theme.colors.onPrimary,
    },
    promoButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
    },
    promoButtonText: {
        color: theme.colors.onPrimary,
        fontWeight: '700',
    },
});
