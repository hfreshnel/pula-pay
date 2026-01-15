import { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import PhoneInput from 'react-native-international-phone-number';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useAuthStore } from '@/src/store/authStore';
import { useWalletStore } from '@/src/store/walletStore';
import { useTheme } from '@/src/theme';
import { useStyles } from '@/src/hooks/use-styles';
import Screen from '@/src/components/screen';
import Button from '@/src/components/ui/button';
import type { Theme } from '@/src/theme/types';

export default function Withdraw() {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const [method] = useState('MTN_MoMo');
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [submittedTx, setSubmittedTx] = useState<{
        amount: string;
        phone: string;
        method: string;
        txId: string | null;
    } | null>(null);

    const { user } = useAuthStore();
    const { withdraw, loading, error, currency } = useWalletStore();

    const formatAmount = (value: string) => {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(Number(value || 0));
    };

    useEffect(() => {
        if (user?.phone) {
            setPhone(user.phone);
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!user?.id) {
            Alert.alert(t('errors.title'), t('errors.unauthenticated'));
            return;
        }

        if (method !== 'MTN_MoMo') {
            Alert.alert(t('errors.title'), t('withdraw.methodNotSupported'));
            return;
        }

        try {
            const txId = await withdraw({ amount, msisdn: phone, currency: currency as any });
            setSubmittedTx({
                amount,
                phone,
                method,
                txId,
            });
        } catch (err: any) {
            Alert.alert(t('errors.withdrawFailed'), err.message || t('errors.generic'));
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
            <Text style={styles.title}>{t('withdraw.title')}</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('withdraw.amount')} ({currency})</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('withdraw.amountPlaceholder')}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.placeholder}
                />
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
                    ref={null}
                    theme={theme.mode === 'dark' ? 'dark' : 'light'}
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
        </Screen>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.background,
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
