import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import { useRecipientId } from '../../../hooks/use-recipient-id';
import { useTransfer } from '../../../hooks/use-transfert';
import { useAuthStore } from '../../../store/authStore';
import { sanitizeCountryCode, sanitizePhoneNumber } from "@/src/utils/phone";
import Screen from '@/src/components/screen';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from "@/src/theme";
import { useStyles } from "@/src/hooks/use-styles";
import type { Theme } from "@/src/theme/types";
import Button from '../../../components/ui/button';

export default function Transfert() {
    const theme = useTheme();
    const styles = useStyles(getStyles);
    const [queryPhone, setQueryPhone] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [contryCode, setCountryCode] = useState<null | ICountry>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [submittedTx, setSubmittedTx] = useState<{ amount: string; recipientPhone: string | null; txId: string | null; } | null>(null);
    const [ackTxId, setAckTxId] = useState(null);

    const { recipientId, error: getPhoneUserIdError, getPhoneUserId } = useRecipientId();
    const { txId, status, loading, error, startTransfer } = useTransfer();
    const { user } = useAuthStore();
    const userId = user?.id;

    useEffect(() => {
        if (!userId || !queryPhone) return;
        const handler = setTimeout(() => {
            const formattedPhone = `${sanitizeCountryCode(contryCode?.idd.root as string)}${sanitizePhoneNumber(queryPhone)}`;
            getPhoneUserId(formattedPhone);
        }, 400);
        return () => clearTimeout(handler);
    }, [userId, queryPhone, getPhoneUserId, contryCode]);

    useEffect(() => {
        if (status === 'SUCCESS' && txId && txId !== ackTxId) {
            setSubmittedTx({
                amount,
                recipientPhone,
                txId,
            });
            setAckTxId(txId);
        }
    }, [status, submittedTx, amount, recipientPhone, txId, ackTxId]);

    useEffect(() => {
        if (recipientId && !recipientPhone && queryPhone) {
            setRecipientPhone(`${sanitizeCountryCode(contryCode?.idd.root as string)}${sanitizePhoneNumber(queryPhone)}`);
        }
    }, [recipientId, queryPhone, recipientPhone, contryCode]);

    const handleSubmit = async () => {
        if (!recipientPhone || !amount || !recipientId || !userId) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs requis.');
            return;
        }

        try {
            await startTransfer({
                senderId: userId,
                receiverId: recipientId,
                amount: String(amount),
                currency: 'EUR',
                note,
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            Alert.alert('Erreur transfert', errorMessage);
        }
    };

    if (submittedTx) {
        return (
            <Screen>
                <ArrowLeft onPress={() => router.replace("/(main)/wallet")} color={theme.colors.text} />
                <Text style={styles.successTitle}>Transfert P2P effectué</Text>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>Bénéficiaire:</Text>
                    <Text style={styles.value}>{submittedTx.recipientPhone}</Text>
                    <Text style={styles.label}>Montant:</Text>
                    <Text style={styles.value}>{submittedTx.amount} €</Text>
                    <Text style={styles.label}>Référence:</Text>
                    <Text style={styles.value}>{submittedTx.txId}</Text>
                </View>
                <Button title="Voir transactions" onPress={() => { router.push("/history") }} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ArrowLeft color={theme.colors.text} onPress={() => router.replace("/(main)/wallet")} />
            <Text style={styles.title}>Transfert PulaPay → PulaPay</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro du bénéficiaire</Text>
                <PhoneInput
                    value={queryPhone}
                    onChangePhoneNumber={setQueryPhone}
                    defaultCountry="BJ"
                    onChangeSelectedCountry={setCountryCode}
                />
                {recipientId && !getPhoneUserIdError && (
                    <Text style={styles.successMessage}>Utilisateur trouvé: {queryPhone}</Text>
                )}
                {getPhoneUserIdError && queryPhone && (
                    <Text style={styles.error}>{getPhoneUserIdError}</Text>
                )}
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant (EUR)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 2000"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.placeholder}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Message (optionnel)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Participation, cadeau..."
                    value={note}
                    onChangeText={setNote}
                    placeholderTextColor={theme.colors.placeholder}
                />
            </View>
            <Button
                title={loading ? 'Envoi...' : 'Envoyer l\'argent'}
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !recipientPhone || !amount}
            />
            {loading && <ActivityIndicator style={styles.loader} color={theme.colors.primary} />}
            {error && <Text style={styles.error}>{String(error)}</Text>}
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