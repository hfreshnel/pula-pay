import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { verify } from "../../api/auth";
import { getErrorMessage } from "../../utils/httpError";

export default function VerifyOpt() {
  const { t } = useTranslation();
  const router = useRouter();
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t("register.verifyPhone")}</Text>
        <Text style={styles.otpSubtitle}>{t("register.otpSent")}</Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          maxLength={6}
          keyboardType="number-pad"
          placeholder="000000"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, verifying && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("register.verifyButton")}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={{ marginTop: 12 }}
        >
          <Text style={styles.linkButton}>{t("register.goToLogin")}</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: 8,
    textAlign: "center",
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
    textAlign: "center",
  },
  linkButton: {
    color: "#6366f1",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
});
