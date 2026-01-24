import { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import PhoneInput from '@/src/components/ui/phone-input';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useAuthStore } from '@/src/store/authStore';
import { useWalletStore } from '@/src/store/walletStore';
import { useConversion } from '@/src/hooks/use-conversion';
import { getApiError } from '@/src/utils/api-error';
import { toast } from '@/src/store/toastStore';
import { useTheme } from '@/src/theme';
import { useStyles } from '@/src/hooks/use-styles';
import Screen from '@/src/components/screen';
import Button from '@/src/components/ui/button';
import ExchangeRateIndicator from '@/src/components/exchange-rate';
import type { Theme } from '@/src/theme/types';

export default function Withdraw() {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const [method] = useState('MTN_MOMO');
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [submittedTx, setSubmittedTx] = useState<{
        amount: string;
        amountUsdc: string;
        phone: string;
        method: string;
        txId: string | null;
    } | null>(null);

    const { user } = useAuthStore();
    const { withdraw, loading, error, displayCurrency, balanceUsdc, syncWalletStatus } = useWalletStore();
    const { toUsdc, toDisplay, rate, loading: rateLoading, refresh: refreshRate } = useConversion(displayCurrency);

    const formatAmount = (value: string) => {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: displayCurrency,
            maximumFractionDigits: displayCurrency === 'XOF' ? 0 : 2,
        }).format(Number(value || 0));
    };

    const estimatedUsdc = amount ? toUsdc(amount) : '0';
    const availableDisplay = balanceUsdc ? toDisplay(balanceUsdc) : '—';

    useEffect(() => {
        if (user?.phone) {
            setPhone(user.phone);
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!user?.id) {
            toast.error(t('errors.unauthenticated'));
            return;
        }

        if (method !== 'MTN_MOMO') {
            toast.error(t('withdraw.methodNotSupported'));
            return;
        }

        // Check if user has enough balance
        if (balanceUsdc && parseFloat(estimatedUsdc) > parseFloat(balanceUsdc)) {
            toast.error(t('withdraw.insufficientFunds'));
            return;
        }

        try {
            // Check and sync wallet status before attempting transaction
            toast.info(t('withdraw.checkingWallet'), 3000);
            const { wasUpdated, currentStatus } = await syncWalletStatus();

            if (wasUpdated) {
                toast.success(t('withdraw.walletActivated'), 3000);
            }

            if (currentStatus !== 'ACTIVE') {
                toast.error(t('withdraw.walletNotActive'), 5000);
                return;
            }

            const txId = await withdraw({
                amount,
                currency: displayCurrency,
                provider: 'MTN_MOMO',
                msisdn: phone,
            });
            setSubmittedTx({
                amount,
                amountUsdc: estimatedUsdc,
                phone,
                method,
                txId,
            });
            toast.success(t('withdraw.success'));
        } catch (err: unknown) {
            const { translationKey, message } = getApiError(err);
            const errorMessage = message || t(translationKey);
            toast.error(errorMessage, 6000);
        }
    };

    if (submittedTx) {
        return (
            <Screen>
                <ArrowLeft onPress={() => router.replace('/(main)/wallet')} color={theme.colors.text} />
                <View style={styles.container}>
                    <Text style={styles.successTitle}>{t('withdraw.success')}</Text>
                    <View style={styles.detailsContainer}>
                        <Text style={styles.label}>{t('withdraw.method')}:</Text>
                        <Text style={styles.value}>{submittedTx.method}</Text>
                        <Text style={styles.label}>{t('withdraw.amount')}:</Text>
                        <Text style={styles.value}>{formatAmount(submittedTx.amount)}</Text>
                        <Text style={styles.label}>{t('withdraw.amountUsdc')}:</Text>
                        <Text style={styles.value}>~{parseFloat(submittedTx.amountUsdc).toFixed(2)} USDC</Text>
                        <Text style={styles.label}>{t('withdraw.phone')}:</Text>
                        <Text style={styles.value}>{submittedTx.phone}</Text>
                        {submittedTx.txId && (
                            <>
                                <Text style={styles.label}>{t('withdraw.txId')}:</Text>
                                <Text style={styles.value}>{submittedTx.txId}</Text>
                            </>
                        )}
                    </View>
                    <Button title={t('withdraw.viewTransactions')} onPress={() => router.push('/history')} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <ArrowLeft onPress={() => router.replace('/(main)/wallet')} color={theme.colors.text} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{t('withdraw.title')}</Text>

                <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>{t('withdraw.availableBalance')}</Text>
                    <Text style={styles.balanceValue}>{availableDisplay}</Text>
                    {balanceUsdc && (
                        <Text style={styles.balanceUsdc}>({parseFloat(balanceUsdc).toFixed(2)} USDC)</Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('withdraw.amount')} ({displayCurrency})</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('withdraw.amountPlaceholder')}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.placeholder}
                    />
                    {amount && (
                        <Text style={styles.usdcEquivalent}>
                            {t('withdraw.amountUsdc')}: ~{parseFloat(estimatedUsdc).toFixed(2)} USDC
                        </Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('withdraw.method')}</Text>
                    <TextInput
                        style={styles.input}
                        value={method}
                        editable={false}
                        placeholderTextColor={theme.colors.placeholder}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('withdraw.phone')}</Text>
                    <PhoneInput
                        value={phone.slice(3)}
                        defaultCountry="BJ"
                        disabled
                    />
                </View>

                <View style={styles.inputGroup}>
                    <ExchangeRateIndicator
                        rate={rate}
                        currency={displayCurrency}
                        loading={rateLoading}
                        onRefresh={refreshRate}
                    />
                </View>

                <Button
                    title={loading ? t('withdraw.submitting') : t('withdraw.submit')}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading || !amount}
                />

                {loading && <ActivityIndicator style={styles.loader} color={theme.colors.primary} />}
                {error && <Text style={styles.error}>{error}</Text>}
            </ScrollView>
        </Screen>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing.xl,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    balanceInfo: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    balanceLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
    },
    balanceValue: {
        ...theme.typography.h2,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    balanceUsdc: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
    },
    inputGroup: {
        marginBottom: theme.spacing.m,
    },
    label: {
        ...theme.typography.caption,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.s,
        fontSize: 16,
        backgroundColor: theme.colors.inputBackground,
        color: theme.colors.text,
        borderColor: theme.colors.outline,
    },
    usdcEquivalent: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
    },
    loader: {
        marginTop: theme.spacing.m,
    },
    error: {
        ...theme.typography.caption,
        color: theme.colors.danger,
        marginTop: theme.spacing.xs,
    },
    successTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    detailsContainer: {
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.s,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outline,
    },
    value: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: 'bold',
        marginBottom: theme.spacing.xs,
    },
});
