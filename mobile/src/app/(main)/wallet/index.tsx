import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import WalletSummary from '../../../components/wallet-summary';
import RecentTransactions from '../../../components/recent-transactions';
import { router } from 'expo-router';
import Screen from '@/src/components/screen';

export default function Wallet() {

  return (
    <Screen>
      <WalletSummary />
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Activité du portefeuille</Text>
        <TouchableOpacity
          style={styles.rechargeButton}
          onPress={() => router.push("/wallet/deposit")}
        >
          <Text style={styles.rechargeButtonText}>+ Recharger</Text>
        </TouchableOpacity>
      </View>
      <RecentTransactions />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  rechargeButton: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rechargeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});