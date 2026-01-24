import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import Screen from "@/src/components/screen";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/button";
import PhoneInput, { ICountry } from "@/src/components/ui/phone-input";

import { login } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { sanitizeCountryCode, sanitizePhoneNumber } from "../../utils/phone";
import { getApiError } from "../../utils/api-error";

import { useStyles } from "@/src/hooks/use-styles";
import type { Theme } from "@/src/theme/types";

export default function Login() {
    const { t } = useTranslation();
    const styles = useStyles(getStyles);
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
                setError(t("validation.fillAllFields"));
                return;
            }
            if (!contryCode?.idd?.root) {
                setError(t("validation.invalidPhone"));
                return;
            }

            const formattedPhone = sanitizeCountryCode(contryCode.idd.root) + sanitizePhoneNumber(phone);
            const { accessToken, refreshToken } = await login(formattedPhone, password);
            await useLoginContext(accessToken, refreshToken);
        } catch (e) {
            const { code, translationKey, message } = getApiError(e);
            if (code === "VALIDATION_ERROR" && message) {
                setError(message);
            } else {
                setError(t(translationKey));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scroll style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.logo}>Pulapay</Text>
                <Text style={styles.title}>{t("login.title")}</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("login.phone")}</Text>
                    <PhoneInput
                        value={phone}
                        onChangePhoneNumber={setPhone}
                        onChangeSelectedCountry={setCountryCode}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t("login.password")}</Text>
                    <Input
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!loading}
                    />
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                <Button
                    title={t("login.button")}
                    onPress={handleSubmit}
                    loading={loading}
                    fullWidth
                />

                <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>{t("login.goToRegister")} </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkButton}>{t("register.title")}</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </Screen>
    );
}

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.m,
        backgroundColor: theme.colors.background,
    },
    card: {
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.surfaceVariant,
    },
    logo: {
        ...theme.typography.h1,
        color: theme.colors.primary,
        textAlign: "center",
        marginBottom: theme.spacing.s,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: theme.spacing.l,
    },
    formGroup: {
        marginBottom: theme.spacing.m,
    },
    label: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
    },
    error: {
        ...theme.typography.caption,
        color: theme.colors.danger,
        marginTop: theme.spacing.m,
        fontWeight: "500",
    },
    linkContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: theme.spacing.l,
    },
    linkText: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
    },
    linkButton: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: "700",
    },
});