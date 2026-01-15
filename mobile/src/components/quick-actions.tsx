import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";

const quickActionsData = [
  {
    title: "Recharge",
    subtitle: "Crédit mobile",
    description: "MTN, Moov, Celtiis",
    emoji: "📱",
    page: "Recharge",
  },
  {
    title: "Internet",
    subtitle: "Pass data",
    description: "Forfaits 3G/4G",
    emoji: "📶",
    page: "Internet",
  },
  {
    title: "Transfert",
    subtitle: "Argent mobile",
    description: "Mobile Money",
    emoji: "💸",
    page: "P2PTransfer",
  },
  {
    title: "Factures",
    subtitle: "Services",
    description: "SBEE, Canal+",
    emoji: "🧾",
    page: "Bills",
  },
  {
    title: "P2P",
    subtitle: "PulaPay",
    description: "Entre utilisateurs",
    emoji: "🔁",
    page: "P2PTransfer",
  },
  {
    title: "Entreprises",
    subtitle: "B2B",
    description: "Paiements pros",
    emoji: "🏢",
    page: "Bills",
  },
];

export default function QuickActions() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(getStyles);

  const goTo = (page: string) => {
    // Simple mapping: use `/${page}` as path — adjust if your routes differ
    const path = `/${page}`;
    router.push("#");
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Services</Text>
        <TouchableOpacity onPress={() => router.push('#')}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {quickActionsData.map((action) => (
          <TouchableOpacity
            key={action.title}
            style={styles.card}
            onPress={() => goTo(action.page)}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{action.emoji}</Text>
            </View>
            <Text style={styles.cardTitle}>{action.title}</Text>
            <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
            <Text style={styles.cardDesc}>{action.description}</Text>
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
