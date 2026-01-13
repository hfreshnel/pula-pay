import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useWithdraw } from '../../../hooks/use-withdraw';
import { useAuthStore } from '../../../store/authStore';
import PhoneInput from 'react-native-international-phone-number';
import Screen from '@/src/components/screen';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from "@/src/theme";
import { useStyles } from "@/src/hooks/use-styles";
import type { Theme } from "@/src/theme/types";
import Button from '../../../components/ui/button';

export default function Withdraw() {
    const theme = useTheme();
    const styles = useStyles(getStyles);
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
                <ArrowLeft onPress={() => router.replace("/(main)/wallet")} color={theme.colors.text} />
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
                <Button title="Voir transactions" onPress={() => { router.push("/history") }} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ArrowLeft onPress={() => router.replace("/(main)/wallet")} color={theme.colors.text} />
            <Text style={styles.title}>Demande de retrait</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant à retirer (EUR)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 100.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.placeholder}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Moyen de paiement</Text>
                <TextInput
                    style={styles.input}
                    value={method}
                    editable={false}
                    placeholderTextColor={theme.colors.placeholder}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro associé</Text>
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