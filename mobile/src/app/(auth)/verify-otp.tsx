import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useTranslation } from "react-i18next";

import Screen from "@/src/components/screen";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/button";
import type { Theme } from "@/src/theme/types";
import { useTheme } from "@/src/theme";
import { useStyles } from "@/src/hooks/use-styles";

import { verify } from "@/src/api/auth";
import { getErrorMessage } from "@/src/utils/httpError";

export default function VerifyOpt() {
    const { t } = useTranslation();
    const router = useRouter();
    const styles = useStyles(getStyles);
    const params = useLocalSearchParams<{ phone?: string }>();
    const phone = params.phone ?? "";

    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        try {
            setError(null);
            
            if (!otp || otp.length !== 6) {
                setError(t("register.enterOtp") || "Veuillez entrer un code à 6 chiffres.");
                return;
            }
            setVerifying(true);
            await verify(phone, otp);

            router.replace("/(auth)/login");
        } catch (e) {
            setError(getErrorMessage(e) || t("register.invalidOtp") || "Code OTP invalide");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <Screen scroll style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>{t("register.verifyPhone")}</Text>
                <Text style={styles.otpSubtitle}>{t("register.otpSent")}</Text>

                <Input

                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                    keyboardType="number-pad"
                    placeholder="000000"
                />

                {error && <Text style={styles.error}>{error}</Text>}

                <Button
                    title={t("register.verifyButton")}
                    onPress={handleVerify}
                    loading={verifying}
                    disabled={verifying}
                    style={[styles.button, verifying && styles.buttonDisabled]}
                />

                <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>{t("register.goToLogin")} </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkButton}>{t("login.title")}</Text>
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
        width: "100%",
        maxWidth: 420,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.primary,
        marginBottom: theme.spacing.xs,
        textAlign: "center",
    },
    otpSubtitle: {
        color: theme.colors.textMuted,
        textAlign: "center",
        marginBottom: 16,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        alignItems: "center",
        marginTop: theme.spacing.m,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: theme.colors.onPrimary,
    },
    error: {
        ...theme.typography.caption,
        color: theme.colors.danger,
        marginTop: theme.spacing.s,
        textAlign: "center",
    },
    linkButton: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        textAlign: "center",
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
});
