import { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useRecipientId } from '@/src/hooks/use-recipient-id';
import { useAuthStore } from '@/src/store/authStore';
import { useWalletStore } from '@/src/store/walletStore';
import { sanitizeCountryCode, sanitizePhoneNumber } from '@/src/utils/phone';
import { useTheme } from '@/src/theme';
import { useStyles } from '@/src/hooks/use-styles';
import Screen from '@/src/components/screen';
import Button from '@/src/components/ui/button';
import type { Theme } from '@/src/theme/types';

export default function Transfer() {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';

    const [queryPhone, setQueryPhone] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [countryCode, setCountryCode] = useState<null | ICountry>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [submittedTx, setSubmittedTx] = useState<{
        amount: string;
        recipientPhone: string | null;
        txId: string | null;
    } | null>(null);

    const { recipientId, error: recipientError, getPhoneUserId } = useRecipientId();
    const { user } = useAuthStore();
    const { transfer, loading, error, currency } = useWalletStore();

    const formatAmount = (value: string) => {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(Number(value || 0));
    };

    // Debounced phone lookup
    useEffect(() => {
        if (!user?.id || !queryPhone) return;
        const handler = setTimeout(() => {
            const formattedPhone = `${sanitizeCountryCode(countryCode?.idd.root as string)}${sanitizePhoneNumber(queryPhone)}`;
            getPhoneUserId(formattedPhone);
        }, 400);
        return () => clearTimeout(handler);
    }, [user?.id, queryPhone, getPhoneUserId, countryCode]);

    // Set recipient phone when user is found
    useEffect(() => {
        if (recipientId && !recipientPhone && queryPhone) {
            setRecipientPhone(`${sanitizeCountryCode(countryCode?.idd.root as string)}${sanitizePhoneNumber(queryPhone)}`);
        }
    }, [recipientId, queryPhone, recipientPhone, countryCode]);

    const handleSubmit = async () => {
        if (!recipientPhone || !amount || !recipientId || !user?.id) {
            Alert.alert(t('errors.title'), t('transfer.fillAllFields'));
            return;
        }

        try {
            const txId = await transfer({
                receiverId: recipientId,
                amount: String(amount),
                currency: currency as any,
            });
            setSubmittedTx({
                amount,
                recipientPhone,
                txId,
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : t('errors.generic');
            Alert.alert(t('errors.transferFailed'), errorMessage);
        }
    };

    if (submittedTx) {
        return (
            <Screen>
                <ArrowLeft onPress={() => router.replace('/(main)/wallet')} color={theme.colors.text} />
                <View style={styles.container}>
                    <Text style={styles.successTitle}>{t('transfer.success')}</Text>
                    <View style={styles.detailsContainer}>
                        <Text style={styles.label}>{t('transfer.recipient')}:</Text>
                        <Text style={styles.value}>{submittedTx.recipientPhone}</Text>
                        <Text style={styles.label}>{t('transfer.amount')}:</Text>
                        <Text style={styles.value}>{formatAmount(submittedTx.amount)}</Text>
                        <Text style={styles.label}>{t('transfer.txId')}:</Text>
                        <Text style={styles.value}>{submittedTx.txId}</Text>
                    </View>
                    <Button title={t('transfer.viewTransactions')} onPress={() => router.push('/history')} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <ArrowLeft onPress={() => router.replace('/(main)/wallet')} color={theme.colors.text} />
            <Text style={styles.title}>{t('transfer.title')}</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('transfer.recipientPhone')}</Text>
                <PhoneInput
                    value={queryPhone}
                    onChangePhoneNumber={setQueryPhone}
                    defaultCountry="BJ"
                    onChangeSelectedCountry={setCountryCode}
                    ref={null}
                    theme={theme.mode === 'dark' ? 'dark' : 'light'}
                />
                {recipientId && !recipientError && (
                    <Text style={styles.successMessage}>{t('transfer.userFound')}: {queryPhone}</Text>
                )}
                {recipientError && queryPhone && (
                    <Text style={styles.error}>{recipientError}</Text>
                )}
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('transfer.amount')} ({currency})</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('transfer.amountPlaceholder')}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.placeholder}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('transfer.note')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('transfer.notePlaceholder')}
                    value={note}
                    onChangeText={setNote}
                    placeholderTextColor={theme.colors.placeholder}
                />
            </View>
            <Button
                title={loading ? t('transfer.submitting') : t('transfer.submit')}
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !recipientPhone || !amount}
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
    successMessage: {
        ...theme.typography.caption,
        color: theme.colors.success,
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
