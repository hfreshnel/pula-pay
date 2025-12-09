import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTransactions } from '../hooks/use-transactions';
import { useAuthStore } from '../store/authStore';

export default function Transactions() {
  const { transactions, loading, error, getTransactions } = useTransactions();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    if (user?.id) {
      getTransactions(user.id);
    }
  }, [user, getTransactions]);

  useEffect(() => {
    if (query) {
      const lowerQuery = query.toLowerCase();
      setFilteredTransactions(
        transactions.filter(
          (t : any) =>
            t.externalId?.toLowerCase().includes(lowerQuery) ||
            t.id?.toLowerCase().includes(lowerQuery) ||
            JSON.stringify(t.meta || '').toLowerCase().includes(lowerQuery)
        )
      );
    } else {
      setFilteredTransactions(transactions);
    }
  }, [query, transactions]);

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionId}>Référence: {item.externalId || item.id}</Text>
      <Text>Type: {item.kind}</Text>
      <Text>Montant: {item.amount} {item.currency || 'XOF'}</Text>
      <Text>Statut: {item.status}</Text>
      <Text>Date: {new Date(item.createdAt || item.created_date).toLocaleString('fr-FR')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique des transactions</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher par référence ou description"
        value={query}
        onChangeText={setQuery}
      />
      {error && <Text style={styles.errorText}>Erreur: {String(error)}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color="#7c3aed" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune transaction trouvée</Text>}
        />
      )}
      <TouchableOpacity style={styles.refreshButton} onPress={() => getTransactions(user?.id)} disabled={loading}>
        <Text style={styles.refreshButtonText}>{loading ? 'Rafraîchissement...' : 'Rafraîchir'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  transactionItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  transactionId: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  loader: {
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 16,
  },
  refreshButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});