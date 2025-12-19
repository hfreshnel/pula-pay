import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useWithdraw } from '../../../hooks/use-withdraw';
import { useAuthStore } from '../../../store/authStore';
import PhoneInput from 'react-native-international-phone-number';
import Screen from '@/src/components/screen';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from "@/src/theme";
import Button from '../../../components/ui/button';

export default function Withdraw() {
    const theme = useTheme();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('MTN_MoMo');
    const [phone, setPhone] = useState('');
    const [submittedTx, setSubmittedTx] = useState<{ amount: string; recipient_phone: string; method: string; txId: string | null } | null>(null);
    const { txId, status, loading, error, startWithdraw } = useWithdraw();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.phone) setPhone(user.phone);
    }, [user]);

    useEffect(() => {
        if (status === 'SUCCESS' && !submittedTx) {
            setSubmittedTx({
                amount,
                recipient_phone: phone,
                method,
                txId,
            });
        }
    }, [status, submittedTx, amount, phone, method, txId]);

    const handleSubmit = async () => {
        if (!user?.id) {
            Alert.alert('Erreur', 'Utilisateur non authentifié');
            return;
        }

        try {
            if (method === 'MTN_MoMo') {
                await startWithdraw({ userId: user.id, amount, msisdn: phone, currency: 'EUR' });
            } else {
                Alert.alert('Erreur', 'Méthode non encore supportée');
            }
        } catch (err: any) {
            Alert.alert('Erreur retrait', err.message || 'Une erreur est survenue');
        }
    };

    if (submittedTx) {
        return (
            <Screen>
                <ArrowLeft onPress={() => router.replace("/(main)/wallet")} />
                <Text style={styles.successTitle}>Retrait effectué</Text>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>Méthode:</Text>
                    <Text style={styles.value}>{submittedTx.method}</Text>
                    <Text style={styles.label}>Montant:</Text>
                    <Text style={styles.value}>{submittedTx.amount} €</Text>
                    <Text style={styles.label}>Numéro:</Text>
                    <Text style={styles.value}>{submittedTx.recipient_phone}</Text>
                    {submittedTx.txId && (
                        <>
                            <Text style={styles.label}>txId:</Text>
                            <Text style={styles.value}>{submittedTx.txId}</Text>
                        </>
                    )}
                </View>
                <Button title="Voir transactions" onPress={() => {/* Navigate to Transactions */ }} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ArrowLeft onPress={() => router.replace("/(main)/wallet")} color={theme.text} />
            <Text style={[styles.title, { color: theme.text }]}>Demande de retrait</Text>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Montant à retirer (EUR)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="Ex: 100.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Moyen de paiement</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    value={method}
                    editable={false}
                    placeholderTextColor={theme.placeholder}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Numéro associé</Text>
                <PhoneInput
                    value={phone.slice(3)}
                    defaultCountry="BJ"
                    disabled
                />
            </View>
            <Button
                title={loading ? 'Envoi...' : 'Retirer'}
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !amount}
            />
            {loading && <ActivityIndicator style={styles.loader} color={theme.primary} />}
            {error && <Text style={[styles.error, { color: '#ef4444' }]}>{String(error)}</Text>}
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