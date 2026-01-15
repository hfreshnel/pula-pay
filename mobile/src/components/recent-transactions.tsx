import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, RotateCcw, RefreshCw } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useWalletStore } from "../store/walletStore";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";
import type { TxDTO, EntryKind } from "../api/types";

const KIND_ICONS: Record<EntryKind, typeof ArrowUpRight> = {
    DEPOSIT: ArrowDownRight,
    WITHDRAWAL: ArrowUpRight,
    TRANSFER: ArrowLeftRight,
    REFUND: RotateCcw,
    FEE: ArrowUpRight,
    ADJUSTMENT: RefreshCw,
};

export default function RecentTransactions() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const { transactions, currency } = useWalletStore();
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [transactions]);

    const formatAmount = (amount: string) => {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString(locale, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return { backgroundColor: theme.colors.successLight, color: theme.colors.success };
            case 'PENDING':
                return { backgroundColor: theme.colors.warningLight, color: theme.colors.warning };
            case 'FAILED':
            case 'CANCELLED':
                return { backgroundColor: theme.colors.dangerLight, color: theme.colors.danger };
            default:
                return { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.textMuted };
        }
    };

    if (!sortedTransactions.length) {
        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{t('transactions.recentTitle')}</Text>
                    <TouchableOpacity onPress={() => router.push('/history')}>
                        <Text style={styles.seeAll}>{t('transactions.seeAll')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.emptyBody}>
                    <View style={styles.emptyIcon}>
                        <ArrowUpRight color={theme.colors.textMuted} size={28} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('transactions.emptyTitle')}</Text>
                    <Text style={styles.emptySubtitle}>{t('transactions.emptySubtitle')}</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/wallet/deposit')}>
                        <Text style={styles.primaryButtonText}>{t('transactions.firstTransaction')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{t('transactions.recentTitle')}</Text>
                <TouchableOpacity onPress={() => router.push('/history')}>
                    <Text style={styles.seeAll}>{t('transactions.seeAll')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.list} nestedScrollEnabled={false}>
                {sortedTransactions.slice(0, 3).map((tx: TxDTO) => {
                    const Icon = KIND_ICONS[tx.kind] || ArrowLeftRight;
                    const statusStyle = getStatusStyle(tx.status);
                    const isCredit = tx.kind === 'DEPOSIT' || tx.kind === 'REFUND';

                    return (
                        <View key={tx.id} style={styles.itemRow}>
                            <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight }]}>
                                <Icon color={theme.colors.primary} size={20} />
                            </View>

                            <View style={styles.centerCol}>
                                <Text style={styles.itemTitle}>{t(`transactions.kind.${tx.kind}`)}</Text>
                                <View style={styles.rowMeta}>
                                    <Text style={styles.dateText}>{formatDate(tx.createdAt)}</Text>
                                </View>
                            </View>

                            <View style={styles.rightCol}>
                                <Text style={[styles.amountText, isCredit ? styles.amountCredit : styles.amountDebit]}>
                                    {isCredit ? '+' : '-'}{formatAmount(tx.amount)}
                                </Text>
                                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                        {t(`transactions.status.${tx.status}`)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    card: {
        margin: theme.spacing.s,
        borderRadius: theme.borderRadius.l,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        shadowColor: theme.colors.text,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        paddingBottom: theme.spacing.xs,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.s,
        paddingBottom: theme.spacing.xs,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    seeAll: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    emptyBody: {
        padding: theme.spacing.l,
        alignItems: 'center',
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.l,
        backgroundColor: theme.colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.s,
    },
    emptyTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    emptySubtitle: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.s,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
    },
    primaryButtonText: {
        color: theme.colors.onPrimary,
        fontWeight: '700',
    },
    list: {
        paddingHorizontal: theme.spacing.xs,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.s,
    },
    centerCol: {
        flex: 1,
    },
    itemTitle: {
        ...theme.typography.body,
        fontWeight: '700',
        color: theme.colors.text,
    },
    rowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    dateText: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
    },
    rightCol: {
        alignItems: 'flex-end',
        minWidth: 120,
    },
    amountText: {
        ...theme.typography.body,
        fontWeight: '700',
    },
    amountCredit: {
        color: theme.colors.success,
    },
    amountDebit: {
        color: theme.colors.text,
    },
    statusBadge: {
        marginTop: theme.spacing.xs,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.m,
    },
    statusText: {
        ...theme.typography.caption,
        fontWeight: '600',
    },
});
