import { View, Text } from "react-native";
import Screen from "../../components/Screen";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  //const user = useAuthStore((s) => s.user);

  return (
    <Screen>
      <View>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
          {t("home.welcome!")}
        </Text>
        {/* Plus tard : solde, actions rapides, etc. */}
      </View>
    </Screen>
  );
}
