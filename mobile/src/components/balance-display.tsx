import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/theme';
import { useStyles } from '@/src/hooks/use-styles';
import type { Theme } from '@/src/theme/types';
import type { DisplayCurrency } from '@/src/api/types';

type BalanceDisplayProps = {
    balanceUsdc: string | null;
    displayBalance: string | null;
    displayCurrency: DisplayCurrency;
    showUsdc?: boolean;
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
};

const SIZE_CONFIG = {
    small: { primary: 20, secondary: 12 },
    medium: { primary: 28, secondary: 14 },
    large: { primary: 36, secondary: 16 },
};

export default function BalanceDisplay({
    balanceUsdc,
    displayBalance,
    displayCurrency,
    showUsdc = false,
    size = 'medium',
    loading = false,
}: BalanceDisplayProps) {
    const { t } = useTranslation();
    const styles = useStyles(getStyles);
    const theme = useTheme();

    const sizeConfig = SIZE_CONFIG[size];

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    const formattedDisplay = displayBalance ?? '—';
    const formattedUsdc = balanceUsdc ? `${parseFloat(balanceUsdc).toFixed(2)} USDC` : '—';

    return (
        <View style={styles.container}>
            <Text style={[styles.primaryBalance, { fontSize: sizeConfig.primary }]}>
                {formattedDisplay}
            </Text>
            {showUsdc && (
                <Text style={[styles.secondaryBalance, { fontSize: sizeConfig.secondary }]}>
                    {t('wallet.balanceUsdc')}: {formattedUsdc}
                </Text>
            )}
        </View>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBalance: {
        ...theme.typography.h1,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    secondaryBalance: {
        ...theme.typography.caption,
        color: theme.colors.secondary,
        marginTop: theme.spacing.xs,
    },
});
