import { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import PhoneInput from '@/src/components/ui/phone-input';
import { router } from 'expo-router';
import { ArrowLeft, Smartphone, CreditCard, Download, Check } from 'lucide-react-native';

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
import type { OnRampProvider } from '@/src/api/types';

type DepositMethod = {
    id: OnRampProvider;
    name: string;
    icon: typeof Smartphone;
    available: boolean;
};

const DEPOSIT_METHODS: DepositMethod[] = [
    { id: 'MTN_MOMO', name: 'MTN Mobile Money', icon: Smartphone, available: true },
    { id: 'ORANGE_MONEY', name: 'Orange Money', icon: Smartphone, available: false },
    { id: 'CRYPTO', name: 'Receive Crypto', icon: Download, available: true },
];

export default function Deposit() {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const [selectedMethod, setSelectedMethod] = useState<OnRampProvider>('MTN_MOMO');
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [submittedTx, setSubmittedTx] = useState<{
        amount: string;
        amountUsdc: string;
        phone: string;
        method: OnRampProvider;
        txId: string | null;
    } | null>(null);

    const { user } = useAuthStore();
    const { deposit, loading, error, displayCurrency, syncWalletStatus } = useWalletStore();
    const { toUsdc, rate, loading: rateLoading, refresh: refreshRate } = useConversion(displayCurrency);

    const formatAmount = (value: string) => {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: displayCurrency,
            maximumFractionDigits: displayCurrency === 'XOF' ? 0 : 2,
        }).format(Number(value || 0));
    };

    const estimatedUsdc = amount ? toUsdc(amount) : '0';

    useEffect(() => {
        if (user?.phone) {
            setPhone(user.phone);
        }
    }, [user]);

    const handleMethodSelect = (method: OnRampProvider) => {
        if (method === 'CRYPTO') {
            router.push('/wallet/receive');
            return;
        }
        setSelectedMethod(method);
    };

    const handleSubmit = async () => {
        if (!user?.id) {
            toast.error(t('errors.unauthenticated'));
            return;
        }

        if (selectedMethod !== 'MTN_MOMO') {
            toast.error(t('deposit.methodNotSupported'));
            return;
        }

        try {
            // Check and sync wallet status before attempting transaction
            toast.info(t('deposit.checkingWallet'), 3000);
            const { wasUpdated, currentStatus } = await syncWalletStatus();

            if (wasUpdated) {
                toast.success(t('deposit.walletActivated'), 3000);
            }

            if (currentStatus !== 'ACTIVE') {
                toast.error(t('deposit.walletNotActive'), 5000);
                return;
            }

            const txId = await deposit({
                amount: parseFloat(amount).toString(),
                currency: displayCurrency,
                provider: selectedMethod,
                msisdn: phone,
            });
            setSubmittedTx({
                amount,
                amountUsdc: estimatedUsdc,
                phone,
                method: selectedMethod,
                txId,
            });
            toast.success(t('deposit.success'));
        } catch (err: unknown) {
            const { translationKey, message } = getApiError(err);
            // Show detailed message for better user feedback
            const errorMessage = message || t(translationKey);
            toast.error(errorMessage, 6000);
        }
    };

    if (submittedTx) {
        return (
            <Screen>
                <ArrowLeft onPress={() => router.replace('/(main)/wallet')} color={theme.colors.text} />
                <View style={styles.container}>
                    <Text style={styles.successTitle}>{t('deposit.success')}</Text>
                    <View style={styles.detailsContainer}>
                        <Text style={styles.label}>{t('deposit.method')}:</Text>
                        <Text style={styles.value}>{submittedTx.method}</Text>
                        <Text style={styles.label}>{t('deposit.amount')}:</Text>
                        <Text style={styles.value}>{formatAmount(submittedTx.amount)}</Text>
                        <Text style={styles.label}>{t('deposit.equivalentUsdc')}:</Text>
                        <Text style={styles.value}>~{parseFloat(submittedTx.amountUsdc).toFixed(2)} USDC</Text>
                        <Text style={styles.label}>{t('deposit.phone')}:</Text>
                        <Text style={styles.value}>{submittedTx.phone}</Text>
                        {submittedTx.txId && (
                            <>
                                <Text style={styles.label}>{t('deposit.txId')}:</Text>
                                <Text style={styles.value}>{submittedTx.txId}</Text>
                            </>
                        )}
                    </View>
                    <Button title={t('deposit.viewTransactions')} onPress={() => router.push('/history')} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <ArrowLeft onPress={() => router.replace('/(main)/wallet')} color={theme.colors.text} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{t('deposit.title')}</Text>

                {/* Method Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('deposit.selectMethod')}</Text>
                    <View style={styles.methodGrid}>
                        {DEPOSIT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isSelected = selectedMethod === method.id && method.id !== 'CRYPTO';
                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[
                                        styles.methodCard,
                                        isSelected && styles.methodCardSelected,
                                        !method.available && styles.methodCardDisabled,
                                    ]}
                                    onPress={() => method.available && handleMethodSelect(method.id)}
                                    disabled={!method.available}
                                >
                                    <Icon
                                        size={24}
                                        color={isSelected ? theme.colors.primary : theme.colors.text}
                                    />
                                    <Text style={[
                                        styles.methodName,
                                        isSelected && styles.methodNameSelected,
                                        !method.available && styles.methodNameDisabled,
                                    ]}>
                                        {t(`deposit.${method.id.toLowerCase()}`) || method.name}
                                    </Text>
                                    {!method.available && (
                                        <Text style={styles.comingSoon}>{t('common.comingSoon')}</Text>
                                    )}
                                    {isSelected && (
                                        <View style={styles.checkMark}>
                                            <Check size={16} color={theme.colors.primary} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Phone Input for MoMo */}
                {selectedMethod === 'MTN_MOMO' && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('deposit.phone')}</Text>
                            <PhoneInput
                                value={phone.slice(3)}
                                disabled
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('deposit.amount')} ({displayCurrency})</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('deposit.amountPlaceholder')}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholderTextColor={theme.colors.placeholder}
                            />
                            {amount && (
                                <Text style={styles.usdcEquivalent}>
                                    {t('deposit.equivalentUsdc')}: ~{parseFloat(estimatedUsdc).toFixed(2)} USDC
                                </Text>
                            )}
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
                            title={loading ? t('deposit.submitting') : t('deposit.submit')}
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={loading || !amount}
                        />
                    </>
                )}

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
    methodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.s,
    },
    methodCard: {
        flex: 1,
        minWidth: 100,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        position: 'relative',
    },
    methodCardSelected: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    methodCardDisabled: {
        opacity: 0.5,
    },
    methodName: {
        ...theme.typography.caption,
        color: theme.colors.text,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    methodNameSelected: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    methodNameDisabled: {
        color: theme.colors.textMuted,
    },
    comingSoon: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        fontSize: 10,
        marginTop: 2,
    },
    checkMark: {
        position: 'absolute',
        top: theme.spacing.xs,
        right: theme.spacing.xs,
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
