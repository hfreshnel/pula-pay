import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { useStyles } from '../hooks/use-styles';
import type { Theme } from '../theme/types';
import type { TxDTO } from '../api/types';
import { getTxIcon, isCredit, getStatusColors, formatAmount, formatTxDate } from '../utils/transactions';

type TransactionItemProps = {
    transaction: TxDTO;
    showYear?: boolean;
};

export default function TransactionItem({ transaction, showYear = true }: TransactionItemProps) {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const Icon = getTxIcon(transaction.type);
    const credit = isCredit(transaction.direction);
    const statusColors = getStatusColors(transaction.status, theme);

    return (
        <View style={styles.container}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight ?? theme.colors.surfaceVariant }]}>
                <Icon color={theme.colors.primary} size={20} />
            </View>

            <View style={styles.details}>
                <Text style={styles.type}>{t(`transactions.type.${transaction.type}`)}</Text>
                <Text style={styles.ref}>
                    {transaction.externalRef || transaction.id.slice(0, 8)}
                </Text>
                <Text style={styles.date}>
                    {formatTxDate(transaction.createdAt, locale, showYear)}
                </Text>
            </View>

            <View style={styles.rightCol}>
                <Text style={[styles.amount, credit ? styles.amountCredit : styles.amountDebit]}>
                    {credit ? '+' : '-'}
                    {formatAmount(transaction.displayAmount, transaction.displayCurrency, locale)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {t(`transactions.status.${transaction.status}`)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.s,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.s,
    },
    details: {
        flex: 1,
    },
    type: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    ref: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    date: {
        color: theme.colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    rightCol: {
        alignItems: 'flex-end',
        minWidth: 100,
    },
    amount: {
        fontWeight: '700',
        fontSize: 14,
    },
    amountCredit: {
        color: theme.colors.success,
    },
    amountDebit: {
        color: theme.colors.text,
    },
    statusBadge: {
        marginTop: 4,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.s,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
});
