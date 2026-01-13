import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme";
import { useStyles } from "../hooks/use-styles";
import type { Theme } from "../theme/types";

type Transaction = {
  id?: string | number;
  kind?: string;
  createdAt?: string;
  created_date?: string;
  operator?: string;
  meta?: any;
  amount?: number | string;
  currency?: string;
  status?: string;
};

function getTransactionEmoji(kind?: string) {
  switch ((kind || "").toUpperCase()) {
    case "DEPOSIT":
      return "⬇️";
    case "WITHDRAWAL":
      return "⬆️";
    case "TRANSFER":
      return "🔁";
    case "REFUND":
      return "↩️";
    case "FEE":
      return "🧾";
    case "ADJUSTMENT":
      return "⚙️";
    default:
      return "⬆️";
  }
}

function getKindColor(kind?: string) {
  switch ((kind || "").toUpperCase()) {
    case "DEPOSIT":
      return "#10b981"; // green
    case "WITHDRAWAL":
      return "#ef4444"; // red
    case "TRANSFER":
      return "#059669"; // teal
    case "REFUND":
      return "#3b82f6"; // blue
    case "FEE":
      return "#f59e0b"; // amber
    case "ADJUSTMENT":
      return "#6366f1"; // indigo
    default:
      return "#6b7280"; // neutral
  }
}

function getStatusStyle(status?: string) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "completed":
      return { backgroundColor: "#ecfdf5", color: "#065f46" };
    case "pending":
      return { backgroundColor: "#fff7ed", color: "#92400e" };
    case "failed":
      return { backgroundColor: "#fff1f2", color: "#9f1239" };
    default:
      return { backgroundColor: "#f3f4f6", color: "#374151" };
  }
}

function formatDate(dateInput?: string) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  try {
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return d.toISOString();
  }
}

export default function RecentTransactions({ transactions: transactionsProp }: { transactions?: Transaction[] }) {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(getStyles);

  const source = Array.isArray(transactionsProp) ? transactionsProp : [];

  const safeTransactions = Array.from(source).sort((a: Transaction, b: Transaction) => {
    const aDate = a?.createdAt ? new Date(a.createdAt) : (a?.created_date ? new Date(a.created_date) : new Date(0));
    const bDate = b?.createdAt ? new Date(b.createdAt) : (b?.created_date ? new Date(b.created_date) : new Date(0));
    return bDate.getTime() - aDate.getTime();
  });

  if (!safeTransactions.length) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Transactions récentes</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyBody}>
          <View style={styles.emptyIcon}>
            <Text style={{ fontSize: 28 }}>⬆️</Text>
          </View>
          <Text style={styles.emptyTitle}>Aucune transaction</Text>
          <Text style={styles.emptySubtitle}>Vos transactions récentes apparaîtront ici</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/wallet/deposit')}>
            <Text style={styles.primaryButtonText}>Première transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Activité récente</Text>
        <TouchableOpacity onPress={() => router.push('/history')}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} nestedScrollEnabled={false}>
        {safeTransactions.slice(0, 3).map((tx) => {
          if (!tx?.id) return null;
          const txDate = tx.createdAt ? tx.createdAt : tx.created_date;
          const emoji = getTransactionEmoji(tx.kind);
          const bg = getKindColor(tx.kind);
          const statusStyle = getStatusStyle(tx.status);

          return (
            <View key={String(tx.id)} style={styles.itemRow}>
              <View style={[styles.iconWrap, { backgroundColor: bg }]}> 
                <Text style={styles.iconEmoji}>{emoji}</Text>
              </View>

              <View style={styles.centerCol}>
                <Text style={styles.itemTitle}>{(tx.kind && tx.kind.toString()) ? tx.kind.toString().charAt(0).toUpperCase() + tx.kind!.toString().slice(1).toLowerCase() : 'Transaction'}</Text>
                <View style={styles.rowMeta}>
                  <Text style={styles.dateText}>{formatDate(txDate)}</Text>
                  {(tx.operator || (tx.meta && tx.meta.operator)) && (
                    <View style={styles.operatorBadge}><Text style={styles.operatorText}>{tx.operator || tx.meta.operator}</Text></View>
                  )}
                </View>
              </View>

              <View style={styles.rightCol}>
                <Text style={styles.amountText}>{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(Number(tx.amount || 0))} {tx.currency || 'XOF'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{(tx.status || '').toString()}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  card: {
    margin: theme.spacing.s,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    paddingBottom: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.s,
    paddingBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  seeAll: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyBody: {
    padding: theme.spacing.l,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: theme.spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.s,
  },
  iconEmoji: {
    fontSize: 20,
  },
  centerCol: {
    flex: 1,
  },
  itemTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  operatorBadge: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.m,
  },
  operatorText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  rightCol: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  amountText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusBadge: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.m,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
});
