import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, EyeOff, RotateCw, Wallet, Plus, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react-native";

import { useAuthStore } from "../store/authStore";
import { useBalance } from "../hooks/use-balance";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";

export default function WalletSummary() {
    const router = useRouter();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const user = useAuthStore((s) => s.user);
    console.log(`user: ${user?.id}`);
    const { balance, loading, error, getBalance } = useBalance();
    const [showBalance, setShowBalance] = useState(true);
    const currency = "EUR";

    const formatAmount = (amount: Number | String) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));
    };

    const maskedOrValue = useMemo(() => {
        if (!showBalance) return "••••••";
        if (balance === null) return "--";
        return formatAmount(balance);
    }, [showBalance, balance]);

    useEffect(() => {
        if (!user?.id) return;
        (async () => {
            await getBalance(user.id, currency);
        })();
    }, [user?.id, currency, getBalance]);

    return (
        <View style={styles.card}>
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} start={[0,0]} end={[1,1]} style={styles.header}>
                <View style={styles.headerLeft}>
                    <View >
                        <Wallet color="#fff" size={20} />
                    </View>
                    <Text style={styles.small}>Solde disponible</Text>
                    <View style={styles.rowTop}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.balance}>{maskedOrValue}</Text>
                        )}
                    </View>
                    <View >
                        <TrendingUp color="#bbf7d0" size={14} />
                        <Text >+2.5% ce mois</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => setShowBalance((s) => !s)} style={styles.iconButton}>
                        {showBalance ? <Eye color="#fff" size={18} /> : <EyeOff color="#fff" size={18} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => getBalance(user?.id as string, currency)} style={styles.iconButton}>
                        <RotateCw color="#fff" size={18} />
                    </TouchableOpacity>
                </View>

                {/* decorative circles */}
                <View pointerEvents="none" />
                <View pointerEvents="none" />
            </LinearGradient>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.primary]} onPress={() => router.push('/wallet/deposit')}>
                    <View ><Plus color="#fff" size={16} /></View>
                    <Text style={styles.actionText}>Recharger</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.success]} onPress={() => router.push('/wallet/transfert')}>
                    <View ><ArrowUpRight color="#fff" size={16} /></View>
                    <Text style={styles.actionText}>Envoyer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.warn]} onPress={() => router.push('/wallet/withdraw')}>
                    <View ><ArrowDownRight color="#fff" size={16} /></View>
                    <Text style={styles.actionText}>Retirer</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity >
                    <Text style={styles.details}>Voir les détails</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

}

const getStyles = (theme: Theme) => StyleSheet.create({
    card: {
        margin: theme.spacing.s,
        borderRadius: theme.borderRadius.l,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
    },
    small: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        marginBottom: theme.spacing.xs,
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balance: {
        color: theme.colors.onPrimary,
        fontSize: 26,
        fontWeight: '700',
    },
    headerRight: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        marginLeft: theme.spacing.s,
    },
    iconButton: {
        padding: theme.spacing.xs,
        borderRadius: theme.borderRadius.m,
    },
    iconText: {
        color: theme.colors.onPrimary,
        fontSize: 18,
    },
    actions: {
        padding: theme.spacing.s,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        marginHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
    },
    actionText: {
        color: theme.colors.onPrimary,
        fontWeight: '700',
    },
    primary: {
        backgroundColor: theme.colors.primary,
    },
    success: {
        backgroundColor: theme.colors.success,
    },
    warn: {
        backgroundColor: theme.colors.warning,
    },
    footer: {
        padding: theme.spacing.s,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
        alignItems: 'center',
    },
    details: {
        color: theme.colors.primary,
        fontWeight: '700',
    }
});
