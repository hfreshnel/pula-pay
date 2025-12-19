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
import Button from '../../../components/ui/button';

export default function Transfert() {
    const theme = useTheme();
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
            getPhoneUserId(userId, formattedPhone);
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
                <ArrowLeft onPress={() => router.replace("/(main)/wallet")} color={theme.text} />
                <Text style={[styles.successTitle, { color: theme.text }]}>Transfert P2P effectué</Text>
                <View style={[styles.detailsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Bénéficiaire:</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{submittedTx.recipientPhone}</Text>
                    <Text style={[styles.label, { color: theme.text }]}>Montant:</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{submittedTx.amount} €</Text>
                    <Text style={[styles.label, { color: theme.text }]}>Référence:</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{submittedTx.txId}</Text>
                </View>
                <Button title="Voir transactions" onPress={() => { router.push("/history") }} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ArrowLeft color={theme.text} onPress={() => router.replace("/(main)/wallet")} />
            <Text style={[styles.title, { color: theme.text }]}>Transfert PulaPay → PulaPay</Text>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Numéro du bénéficiaire</Text>
                <PhoneInput
                    value={queryPhone}
                    onChangePhoneNumber={setQueryPhone}
                    defaultCountry="BJ"
                    onChangeSelectedCountry={setCountryCode}
                />
                {recipientId && !getPhoneUserIdError && (
                    <Text style={[styles.successMessage, {color: theme.text}]}>Utilisateur trouvé: {queryPhone}</Text>
                )}
                {getPhoneUserIdError && queryPhone && (
                    <Text style={[styles.error, {color: theme.text}]}>{getPhoneUserIdError}</Text>
                )}
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Montant (EUR)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="Ex: 2000"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Message (optionnel)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="Ex: Participation, cadeau..."
                    value={note}
                    onChangeText={setNote}
                    placeholderTextColor={theme.placeholder}
                />
            </View>
            <Button
                title={loading ? 'Envoi...' : 'Envoyer l\'argent'}
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !recipientPhone || !amount}
            />
            {loading && <ActivityIndicator style={styles.loader} color={theme.primary} />}
            {error && <Text style={[styles.error, { color: '#ef4444' }]}>{String(error)}</Text>}
            {error && <Text style={styles.error}>{String(error)}</Text>}
        </Screen>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    loader: {
        marginTop: 16,
    },
    error: {
        marginTop: 8,
        fontSize: 14,
    },
    successMessage: {
        marginTop: 8,
        fontSize: 14,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailsContainer: {
        marginBottom: 16,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
});