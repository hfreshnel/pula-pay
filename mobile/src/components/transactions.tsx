import { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Search, RefreshCw, ArrowUpRight, ArrowDownRight, ArrowLeftRight, RotateCcw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../theme';
import { useStyles } from '../hooks/use-styles';
import type { Theme } from '../theme/types';
import type { TxDTO, EntryKind } from '../api/types';

const KIND_ICONS: Record<EntryKind, typeof ArrowUpRight> = {
    DEPOSIT: ArrowDownRight,
    WITHDRAWAL: ArrowUpRight,
    TRANSFER: ArrowLeftRight,
    REFUND: RotateCcw,
    FEE: ArrowUpRight,
    ADJUSTMENT: RefreshCw,
};

export default function Transactions() {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const { transactions, loading, error, fetchTransactions, currency } = useWalletStore();
    const [query, setQuery] = useState('');
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const filteredTransactions = useMemo(() => {
        if (!query) return transactions;
        const lowerQuery = query.toLowerCase();
        return transactions.filter(
            (t) =>
                t.externalId?.toLowerCase().includes(lowerQuery) ||
                t.id.toLowerCase().includes(lowerQuery) ||
                JSON.stringify(t.meta || '').toLowerCase().includes(lowerQuery)
        );
    }, [query, transactions]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SUCCESS': return styles.statusSuccess;
            case 'FAILED': return styles.statusFailed;
            case 'CANCELLED': return styles.statusCancelled;
            default: return styles.statusPending;
        }
    };

    const renderTransaction = ({ item }: { item: TxDTO }) => {
        const Icon = KIND_ICONS[item.kind] || ArrowLeftRight;
        const isCredit = item.kind === 'DEPOSIT' || item.kind === 'REFUND';

        return (
            <View style={styles.transactionItem}>
                <View style={styles.txIcon}>
                    <Icon color={theme.colors.primary} size={20} />
                </View>
                <View style={styles.txDetails}>
                    <Text style={styles.txKind}>{t(`transactions.kind.${item.kind}`)}</Text>
                    <Text style={styles.txRef}>{item.externalId || item.id.slice(0, 8)}</Text>
                    <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.txRight}>
                    <Text style={[styles.txAmount, isCredit ? styles.amountCredit : styles.amountDebit]}>
                        {isCredit ? '+' : '-'}{formatAmount(item.amount)}
                    </Text>
                    <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                        <Text style={styles.statusText}>{t(`transactions.status.${item.status}`)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('transactions.title')}</Text>

            <View style={styles.searchContainer}>
                <Search color={theme.colors.textMuted} size={18} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('transactions.searchPlaceholder')}
                    placeholderTextColor={theme.colors.placeholder}
                    value={query}
                    onChangeText={setQuery}
                />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransaction}
                refreshing={loading}
                onRefresh={fetchTransactions}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {loading ? '' : t('transactions.empty')}
                    </Text>
                }
                contentContainerStyle={filteredTransactions.length === 0 && styles.emptyList}
            />

            <TouchableOpacity
                style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
                onPress={fetchTransactions}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.onPrimary} size="small" />
                ) : (
                    <RefreshCw color={theme.colors.onPrimary} size={18} />
                )}
                <Text style={styles.refreshButtonText}>
                    {loading ? t('transactions.refreshing') : t('transactions.refresh')}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.background,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        paddingHorizontal: theme.spacing.s,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    searchInput: {
        flex: 1,
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.s,
        color: theme.colors.text,
        fontSize: 14,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.s,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.s,
    },
    txDetails: {
        flex: 1,
    },
    txKind: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    txRef: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    txDate: {
        color: theme.colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    txRight: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontWeight: '700',
        fontSize: 14,
    },
    amountCredit: {
        color: theme.colors.success,
    },
    amountDebit: {
        color: theme.colors.danger,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.s,
        marginTop: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.onPrimary,
    },
    statusSuccess: {
        backgroundColor: theme.colors.success,
    },
    statusFailed: {
        backgroundColor: theme.colors.danger,
    },
    statusCancelled: {
        backgroundColor: theme.colors.secondary,
    },
    statusPending: {
        backgroundColor: theme.colors.warning,
    },
    errorText: {
        color: theme.colors.danger,
        marginBottom: theme.spacing.m,
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xl,
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.m,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.m,
    },
    refreshButtonDisabled: {
        opacity: 0.7,
    },
    refreshButtonText: {
        color: theme.colors.onPrimary,
        fontWeight: '700',
    },
});
