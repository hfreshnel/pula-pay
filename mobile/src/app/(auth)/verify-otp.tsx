import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { useTranslation } from "react-i18next";

import Screen from "@/src/components/screen";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/button";
import type { Theme } from "@/src/theme/types";
import { useStyles } from "@/src/hooks/use-styles";

import { verify, requestOtp } from "@/src/api/auth";
import { createWallet } from "@/src/api/wallet";
import { useAuthStore } from "@/src/store/authStore";
import { getApiError } from "@/src/utils/api-error";

export default function VerifyOpt() {
    const { t } = useTranslation();
    const styles = useStyles(getStyles);
    const login = useAuthStore((s) => s.login);
    const params = useLocalSearchParams<{ phone?: string }>();
    const phone = params.phone ?? "";

    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [requestingOtp, setRequestingOtp] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    // Request OTP on mount
    const handleRequestOtp = useCallback(async () => {
        if (!phone || requestingOtp) return;

        try {
            setRequestingOtp(true);
            setError(null);
            const response = await requestOtp(phone);
            setOtpRequested(true);
            setInfo(t("register.otpSentSuccess", { expiresIn: response.expiresIn }));
        } catch (e) {
            const { code, translationKey, message } = getApiError(e);
            if (code === "VALIDATION_ERROR" && message) {
                setError(message);
            } else {
                setError(t(translationKey));
            }
        } finally {
            setRequestingOtp(false);
        }
    }, [phone, requestingOtp, t]);

    // Auto-request OTP when page loads
    useEffect(() => {
        if (phone && !otpRequested) {
            handleRequestOtp();
        }
    }, [phone, otpRequested, handleRequestOtp]);

    const handleVerify = async () => {
        try {
            setError(null);
            setInfo(null);

            if (!otp || otp.length !== 6) {
                setError(t("validation.invalidOtp"));
                return;
            }
            setVerifying(true);
            const { accessToken, refreshToken } = await verify(phone, otp);

            // Log user in directly after OTP verification
            await login(accessToken, refreshToken);

            // Create wallet after successful verification
            try {
                await createWallet();
            } catch (walletError) {
                // Wallet creation failed but user is logged in
                // This is non-blocking - wallet can be created later
                console.warn("Wallet creation failed:", walletError);
            }
        } catch (e) {
            const { code, translationKey, message } = getApiError(e);
            if (code === "VALIDATION_ERROR" && message) {
                setError(message);
            } else {
                setError(t(translationKey));
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
        <Screen scroll style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>{t("register.verifyPhone")}</Text>
                <Text style={styles.otpSubtitle}>
                    {requestingOtp ? t("register.otpSending") : t("register.otpSent")}
                </Text>

                {info && <Text style={styles.info}>{info}</Text>}

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
                    disabled={verifying || requestingOtp}
                    style={[styles.button, (verifying || requestingOtp) && styles.buttonDisabled]}
                />

                <TouchableOpacity
                    onPress={handleRequestOtp}
                    disabled={requestingOtp}
                    style={styles.resendContainer}
                >
                    <Text style={[styles.resendText, requestingOtp && styles.resendDisabled]}>
                        {requestingOtp ? t("register.otpSending") : t("register.resendOtp")}
                    </Text>
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
    info: {
        ...theme.typography.caption,
        color: theme.colors.success,
        marginBottom: theme.spacing.s,
        textAlign: "center",
    },
    resendContainer: {
        marginTop: theme.spacing.m,
        alignItems: "center",
    },
    resendText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
    },
    resendDisabled: {
        color: theme.colors.textMuted,
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
