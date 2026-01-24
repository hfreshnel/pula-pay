import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";

type QuickAction = {
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  emoji: string;
  route: string;
};

const quickActionsData: QuickAction[] = [
  {
    titleKey: "quickActions.deposit.title",
    subtitleKey: "quickActions.deposit.subtitle",
    descriptionKey: "quickActions.deposit.description",
    emoji: "💰",
    route: "/wallet/deposit",
  },
  {
    titleKey: "quickActions.receive.title",
    subtitleKey: "quickActions.receive.subtitle",
    descriptionKey: "quickActions.receive.description",
    emoji: "📥",
    route: "/wallet/receive",
  },
  {
    titleKey: "quickActions.transfer.title",
    subtitleKey: "quickActions.transfer.subtitle",
    descriptionKey: "quickActions.transfer.description",
    emoji: "💸",
    route: "/wallet/transfert",
  },
  {
    titleKey: "quickActions.withdraw.title",
    subtitleKey: "quickActions.withdraw.subtitle",
    descriptionKey: "quickActions.withdraw.description",
    emoji: "🏧",
    route: "/wallet/withdraw",
  },
  {
    titleKey: "quickActions.recharge.title",
    subtitleKey: "quickActions.recharge.subtitle",
    descriptionKey: "quickActions.recharge.description",
    emoji: "📱",
    route: "#",
  },
  {
    titleKey: "quickActions.bills.title",
    subtitleKey: "quickActions.bills.subtitle",
    descriptionKey: "quickActions.bills.description",
    emoji: "🧾",
    route: "#",
  },
];

export default function QuickActions() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(getStyles);

  const goTo = (route: string) => {
    if (route !== "#") {
      router.push(route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t("quickActions.title")}</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.seeAll}>{t("quickActions.seeAll")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {quickActionsData.map((action) => (
          <TouchableOpacity
            key={action.titleKey}
            style={styles.card}
            onPress={() => goTo(action.route)}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{action.emoji}</Text>
            </View>
            <Text style={styles.cardTitle}>{t(action.titleKey)}</Text>
            <Text style={styles.cardSubtitle}>{t(action.subtitleKey)}</Text>
            <Text style={styles.cardDesc}>{t(action.descriptionKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.s,
    marginTop: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  seeAll: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.s,
    marginBottom: theme.spacing.s,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  icon: {
    fontSize: 26,
  },
  cardTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  cardDesc: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
