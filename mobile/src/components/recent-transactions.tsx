import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../theme';
import { useStyles } from '../hooks/use-styles';
import type { Theme } from '../theme/types';
import { sortByDateDesc } from '../utils/transactions';
import TransactionItem from './transaction-item';

const MAX_RECENT_TRANSACTIONS = 3;

export default function RecentTransactions() {
    const router = useRouter();
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const { transactions } = useWalletStore();

    const recentTransactions = useMemo(() => {
        return sortByDateDesc(transactions).slice(0, MAX_RECENT_TRANSACTIONS);
    }, [transactions]);

    if (!recentTransactions.length) {
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

            <View style={styles.list}>
                {recentTransactions.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} showYear={false} />
                ))}
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
});
