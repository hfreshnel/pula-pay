import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useWalletAddress } from '@/src/hooks/use-wallet-address';
import { useTheme } from '@/src/theme';
import { useStyles } from '@/src/hooks/use-styles';
import Screen from '@/src/components/screen';
import WalletAddressComponent from '@/src/components/wallet-address';
import ReceiveQRCode from '@/src/components/qr-code';
import type { Theme } from '@/src/theme/types';

export default function Receive() {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);

    const { address, blockchain, loading, copyToClipboard, copied } = useWalletAddress();

    return (
        <Screen>
            <ArrowLeft
                onPress={() => router.replace('/(main)/wallet')}
                color={theme.colors.text}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{t('receive.title')}</Text>

                <ReceiveQRCode
                    address={address}
                    blockchain={blockchain}
                    loading={loading}
                />

                <View style={styles.addressSection}>
                    <Text style={styles.sectionTitle}>{t('receive.yourAddress')}</Text>
                    <WalletAddressComponent
                        address={address}
                        blockchain={blockchain}
                        loading={loading}
                        onCopy={copyToClipboard}
                        copied={copied}
                        truncate={false}
                    />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>{t('receive.onlyUsdc')}</Text>
                    <Text style={styles.infoText}>
                        {t('receive.usdcInfo')}
                    </Text>
                </View>
            </ScrollView>
        </Screen>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.m,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
        textAlign: 'center',
    },
    addressSection: {
        marginTop: theme.spacing.l,
    },
    sectionTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.s,
    },
    infoSection: {
        marginTop: theme.spacing.l,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    infoTitle: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
    },
    infoText: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        lineHeight: 20,
    },
});
