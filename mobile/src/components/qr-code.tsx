import { View, Text, StyleSheet, Share, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { Share2 } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { useStyles } from '@/src/hooks/use-styles';
import type { Theme } from '@/src/theme/types';

type ReceiveQRCodeProps = {
    address: string | null;
    blockchain?: string | null;
    amount?: string;
    loading?: boolean;
    size?: number;
};

const BLOCKCHAIN_NAMES: Record<string, string> = {
    POLYGON_AMOY: 'Polygon Amoy (Testnet)',
    POLYGON: 'Polygon',
    ARBITRUM: 'Arbitrum',
};

export default function ReceiveQRCode({
    address,
    blockchain,
    amount,
    loading = false,
    size = 200,
}: ReceiveQRCodeProps) {
    const { t } = useTranslation();
    const styles = useStyles(getStyles);
    const theme = useTheme();

    const handleShare = async () => {
        if (!address) return;

        const message = amount
            ? t('receive.shareMessageWithAmount', { address, amount })
            : t('receive.shareMessage', { address });

        await Share.share({
            message: `${message}\n\n${address}`,
            title: t('receive.shareTitle'),
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
        );
    }

    if (!address) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{t('receive.noAddress')}</Text>
            </View>
        );
    }

    const networkName = blockchain ? BLOCKCHAIN_NAMES[blockchain] ?? blockchain : '';
    const isTestnet = blockchain?.includes('AMOY') || blockchain?.includes('TESTNET');

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('receive.scanQr')}</Text>

            <View style={styles.qrContainer}>
                <QRCode
                    value={address}
                    size={size}
                    backgroundColor={theme.colors.background}
                    color={theme.colors.text}
                />
            </View>

            {isTestnet && (
                <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>
                        {t('receive.testnetWarning')}
                    </Text>
                </View>
            )}

            <View style={styles.networkInfo}>
                <Text style={styles.networkLabel}>{t('receive.network')}</Text>
                <Text style={styles.networkValue}>{networkName}</Text>
            </View>

            <Text style={styles.warning}>
                {t('receive.warning', { network: networkName })}
            </Text>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={20} color={theme.colors.primary} />
                <Text style={styles.shareText}>{t('receive.share')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: theme.spacing.m,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    qrContainer: {
        padding: theme.spacing.m,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.m,
    },
    warningBanner: {
        backgroundColor: theme.colors.warning + '20',
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.s,
        borderRadius: theme.borderRadius.s,
        marginBottom: theme.spacing.m,
    },
    warningText: {
        ...theme.typography.caption,
        color: theme.colors.warning,
        fontWeight: '600',
        textAlign: 'center',
    },
    networkInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    networkLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginRight: theme.spacing.xs,
    },
    networkValue: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: '600',
    },
    warning: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.m,
        paddingHorizontal: theme.spacing.m,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: theme.borderRadius.m,
    },
    shareText: {
        ...theme.typography.body,
        color: theme.colors.primary,
        marginLeft: theme.spacing.xs,
        fontWeight: '600',
    },
    errorText: {
        ...theme.typography.body,
        color: theme.colors.danger,
    },
});
