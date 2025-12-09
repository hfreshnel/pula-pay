import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import { useRecipientId } from '../../../hooks/use-recipient-id';
import { useTransfer } from '../../../hooks/use-transfert';
import { useAuthStore } from '../../../store/authStore';
import { sanitizeCountryCode, sanitizePhoneNumber } from "@/src/utils/phone";
import Screen from '@/src/components/screen';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function Transfert() {
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
                <ArrowLeft onPress={() => router.replace("/(main)/wallet")} />
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
        <Screen style={styles.container}>
            <ArrowLeft onPress={() => router.replace("/(main)/wallet")} />
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
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Message (optionnel)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Participation, cadeau..."
                    value={note}
                    onChangeText={setNote}
                />
            </View>
            <Button
                title={loading ? 'Envoi...' : 'Envoyer l\'argent'}
                onPress={handleSubmit}
                disabled={loading || !recipientPhone || !amount}
            />
            {loading && <ActivityIndicator style={styles.loader} />}
            {error && <Text style={styles.error}>{String(error)}</Text>}
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f9f9f9',
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
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        fontSize: 16,
    },
    loader: {
        marginTop: 16,
    },
    error: {
        color: 'red',
        marginTop: 8,
    },
    successMessage: {
        color: 'green',
        marginTop: 8,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailsContainer: {
        marginBottom: 16,
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
});