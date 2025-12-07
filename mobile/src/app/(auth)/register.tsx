import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import PhoneNumberInput, { ICountry, isValidPhoneNumber } from "react-native-international-phone-number";
import { register, verify } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { sanitizeCountryCode, sanitizePhoneNumber } from "../../utils/phone";
import { getErrorMessage } from "../../utils/httpError";

export default function Register() {
    const { t } = useTranslation();
    const router = useRouter();

    const [phone, setPhone] = useState("");
    const [contryCode, setCountryCode] = useState<null | ICountry>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!phone || !password || !confirmPassword) {
                setError("Veuillez remplir tous les champs");
                return;
            }
            if (password !== confirmPassword) {
                setError("Les mots de passe ne correspondent pas.");
                return;
            }
            
            const formattedPhone = `${sanitizeCountryCode(contryCode?.idd.root as string)}${sanitizePhoneNumber(phone)}`;
            await register(formattedPhone, password);
            router.push({ pathname: "/(auth)/verify-opt", params: { phone: formattedPhone } });
        } catch (e) {
            setError(getErrorMessage(e) || "Erreur d'inscription");
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.logo}>Pulapay</Text>
                <Text style={styles.title}>{t("register.title")}</Text>

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

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("register.confirmPassword")}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
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
                        <Text style={styles.buttonText}>{t("register.button")}</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>{t("register.goToLogin")} </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkButton}>{t("login.title")}</Text>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    otpCard: {
        width: "90%",
        maxWidth: 360,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
    },
    otpTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#6366f1",
        marginBottom: 8,
    },
    otpSubtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 16,
    },
    otpInput: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 18,
        textAlign: "center",
        letterSpacing: 4,
        width: "70%",
        color: "#111827",
        marginBottom: 16,
    },
    phoneContainer: {
        width: "100%",
        backgroundColor: "#fff",
    },
    phoneTextContainer: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 8,
    },
    phoneInput: {
        fontSize: 16,
        color: "#111827",
        paddingVertical: 10,
    },
    phoneCodeText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
