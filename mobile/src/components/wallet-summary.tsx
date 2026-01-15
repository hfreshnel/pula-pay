import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, EyeOff, RotateCw, Wallet, Plus, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useWalletStore } from "../store/walletStore";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";

export default function WalletSummary() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const { balance, currency, loading, fetchBalance } = useWalletStore();
    const [showBalance, setShowBalance] = useState(true);
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const formatAmount = (amount: number | string) => {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));
    };

    const maskedOrValue = useMemo(() => {
        if (!showBalance) return "••••••";
        if (balance === null) return "--";
        return formatAmount(balance);
    }, [showBalance, balance, currency]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return (
        <View style={styles.card}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} start={[0,0]} end={[1,1]} style={styles.header}>
                <View style={styles.headerLeft}>
                    <View >
                        <Wallet color={theme.colors.onPrimary} size={20} />
                    </View>
                    <Text style={styles.small}>{t('wallet.availableBalance')}</Text>
                    <View style={styles.rowTop}>
                        {loading ? (
                            <ActivityIndicator color={theme.colors.onPrimary} />
                        ) : (
                            <Text style={styles.balance}>{maskedOrValue}</Text>
                        )}
                    </View>
                    <View style={styles.trendRow}>
                        <TrendingUp color={theme.colors.success} size={14} />
                        <Text style={styles.trendText}>{t('wallet.trendThisMonth', { percent: '2.5' })}</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => setShowBalance((s) => !s)} style={styles.iconButton}>
                        {showBalance ? <Eye color={theme.colors.onPrimary} size={18} /> : <EyeOff color={theme.colors.onPrimary} size={18} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={fetchBalance} style={styles.iconButton}>
                        <RotateCw color={theme.colors.onPrimary} size={18} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.primary]} onPress={() => router.push('/wallet/deposit')}>
                    <View ><Plus color={theme.colors.onPrimary} size={16} /></View>
                    <Text style={styles.actionText}>{t('wallet.deposit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.success]} onPress={() => router.push('/wallet/transfert')}>
                    <View ><ArrowUpRight color={theme.colors.onPrimary} size={16} /></View>
                    <Text style={styles.actionText}>{t('wallet.send')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.warn]} onPress={() => router.push('/wallet/withdraw')}>
                    <View ><ArrowDownRight color={theme.colors.onPrimary} size={16} /></View>
                    <Text style={styles.actionText}>{t('wallet.withdraw')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity >
                    <Text style={styles.details}>{t('wallet.viewDetails')}</Text>
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
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: theme.spacing.xs,
    },
    trendText: {
        color: theme.colors.success,
        fontSize: 12,
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
