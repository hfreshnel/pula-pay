import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

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

  const goTo = (page: string) => {
    // Simple mapping: use `/${page}` as path — adjust if your routes differ
    const path = `/${page}`;
    router.push(path);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Services</Text>
        <TouchableOpacity onPress={() => router.push('/Services')}>
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    color: '#6d28d9',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});
