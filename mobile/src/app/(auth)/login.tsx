import { useState } from "react";
import { View, Text } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { login } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { getErrorMessage } from "../../utils/httpError";

export default function Login() {
  const { t } = useTranslation();
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await login(phone, password);
      await setToken(res.token);
      router.replace("/(main)/dashboard");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          {t("login.title")}
        </Text>

        <Input
          label={t("login.phone")}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Input
          label={t("login.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && (
          <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>
        )}

        <Button
          title={t("login.button")}
          onPress={onSubmit}
          loading={loading}
        />

        <View style={{ marginTop: 16 }}>
          <Link href="/(auth)/register">{t("login.goToRegister")}</Link>
        </View>
      </View>
    </Screen>
  );
}
