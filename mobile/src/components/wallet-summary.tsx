import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, EyeOff, RotateCw, Wallet, Plus, ArrowUpRight, ArrowDownRight, Download, AlertCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useWalletStore } from "../store/walletStore";
import { useAuthStore } from "../store/authStore";
import { createWallet } from "../api/wallet";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";

export default function WalletSummary() {
    const { t } = useTranslation();
    const router = useRouter();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const user = useAuthStore((s) => s.user);
    const { balanceUsdc, displayBalance, loading, fetchBalance, walletNotFound } = useWalletStore();
    const [showBalance, setShowBalance] = useState(true);
    const [creatingWallet, setCreatingWallet] = useState(false);

    const maskedOrValue = useMemo(() => {
        if (!showBalance) return "••••••";
        if (displayBalance === null) return "--";
        return displayBalance;
    }, [showBalance, displayBalance]);

    const usdcValue = useMemo(() => {
        if (!showBalance) return "••••••";
        if (balanceUsdc === null) return "--";
        return `${parseFloat(balanceUsdc).toFixed(2)} USDC`;
    }, [showBalance, balanceUsdc]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    // Handle wallet creation when wallet not found
    const handleCreateWallet = async () => {
        setCreatingWallet(true);
        try {
            await createWallet();
            await fetchBalance();
        } catch (error) {
            // If wallet creation fails, redirect to verify-otp to complete KYC
            if (user?.phone) {
                router.replace({ pathname: "/(auth)/verify-otp", params: { phone: user.phone } });
            }
        } finally {
            setCreatingWallet(false);
        }
    };

    // Show wallet creation prompt if wallet not found
    if (walletNotFound) {
        return (
            <View style={styles.card}>
                <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} start={[0, 0]} end={[1, 1]} style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <AlertCircle color={theme.colors.onPrimary} size={20} />
                            <Text style={styles.small}>{t('wallet.notFound')}</Text>
                        </View>
                        <Text style={[styles.balance, { fontSize: 18, marginTop: 8 }]}>
                            {t('wallet.createWalletPrompt')}
                        </Text>
                    </View>
                </LinearGradient>
                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={handleCreateWallet}
                        disabled={creatingWallet}
                        style={{ opacity: creatingWallet ? 0.6 : 1 }}
                    >
                        {creatingWallet ? (
                            <ActivityIndicator color={theme.colors.primary} />
                        ) : (
                            <Text style={styles.details}>{t('wallet.createWallet')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} start={[0, 0]} end={[1, 1]} style={styles.header}>
                <View style={styles.headerLeft}>
                    <View>
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
                    <View style={styles.usdcRow}>
                        <Text style={styles.usdcText}>{usdcValue}</Text>
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
                    <View><Plus color={theme.colors.onPrimary} size={16} /></View>
                    <Text style={styles.actionText}>{t('wallet.deposit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.success]} onPress={() => router.push('/wallet/transfert')}>
                    <View><ArrowUpRight color={theme.colors.onPrimary} size={16} /></View>
                    <Text style={styles.actionText}>{t('wallet.send')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.info]} onPress={() => router.push('/wallet/receive' as any)}>
                    <View><Download color={theme.colors.onPrimary} size={16} /></View>
                    <Text style={styles.actionText}>{t('wallet.receive')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.warn]} onPress={() => router.push('/wallet/withdraw')}>
                    <View><ArrowDownRight color={theme.colors.onPrimary} size={16} /></View>
                    <Text style={styles.actionText}>{t('wallet.withdraw')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity>
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
    usdcRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    usdcText: {
        color: 'rgba(255,255,255,0.7)',
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
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
    },
    actionBtn: {
        flex: 1,
        minWidth: 70,
        marginHorizontal: 2,
        paddingVertical: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
    },
    actionText: {
        color: theme.colors.onPrimary,
        fontWeight: '700',
        fontSize: 11,
        marginTop: 2,
    },
    primary: {
        backgroundColor: theme.colors.primary,
    },
    success: {
        backgroundColor: theme.colors.success,
    },
    info: {
        backgroundColor: theme.colors.secondary,
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
