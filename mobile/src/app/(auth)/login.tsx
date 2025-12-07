import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import PhoneNumberInput, { ICountry, isValidPhoneNumber } from "react-native-international-phone-number";
import { login } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { sanitizeCountryCode, sanitizePhoneNumber } from "../../utils/phone";
import { getErrorMessage } from "../../utils/httpError";

export default function Login() {
    const { t } = useTranslation();
    const router = useRouter();
    const useLoginContext = useAuthStore((s) => s.login);

    const [phone, setPhone] = useState("");
    const [contryCode, setCountryCode] = useState<null | ICountry>(null);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!phone || !password) {
                setError("Veuillez remplir tous les champs");
                return;
            }
            /*if (!isValidPhoneNumber(phone, contryCode as ICountry)) {
                setError("Numéro de téléphone invalide");
                return;
            }*/
            const formattedPhone = `${sanitizeCountryCode(contryCode?.idd.root as string)}${sanitizePhoneNumber(phone)}`;
            const res = await login(formattedPhone, password);
            await useLoginContext(res.token);
            router.replace("/(main)/dashboard");
        } catch (e) {
            setError(getErrorMessage(e) || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.logo}>Pulapay</Text>
                <Text style={styles.title}>{t("login.title")}</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("login.phone")}</Text>
                    <PhoneNumberInput
                        value={phone}
                        onChangePhoneNumber={setPhone}
                        defaultCountry="BJ"
                        onChangeSelectedCountry={setCountryCode}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("login.password")}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!loading}
                    />
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>{t("login.button")}</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>{t("login.goToRegister")} </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkButton}>{t("register.title")}</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        padding: 16,
    },
    card: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
        borderWidth: 1,
        borderColor: "rgba(139, 92, 246, 0.1)",
    },
    logo: {
        fontSize: 32,
        fontWeight: "700",
        color: "#6366f1",
        textAlign: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#6366f1",
        textAlign: "center",
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: "#111827",
    },
    button: {
        backgroundColor: "#6366f1",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    error: {
        color: "#dc2626",
        fontSize: 13,
        marginTop: 12,
        fontWeight: "500",
    },
    linkContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 16,
    },
    linkText: {
        color: "#6b7280",
        fontSize: 13,
    },
    linkButton: {
        color: "#6366f1",
        fontWeight: "700",
        fontSize: 13,
    },
    phoneInputField: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: "#111827",
    },
});
