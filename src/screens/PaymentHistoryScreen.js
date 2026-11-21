import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

export default function PaymentHistoryScreen({ navigation }) {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const API_URL = 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/payments/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const renderTransaction = ({ item }) => {
    const isSent = item.sender._id === item.sender._id; // Simplifié
    const operatorColors = {
      orange: '#FF7900',
      moov: '#00A651',
      wave: '#00D4FF',
      coris: '#9B59B6',
    };

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => navigation.navigate('PaymentDetail', { reference: item.reference })}
      >
        <View style={[styles.operatorIcon, { backgroundColor: operatorColors[item.operator] || colors.gold }]}>
          <Text style={styles.operatorIconText}>{item.operator[0].toUpperCase()}</Text>
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>
            {item.type === 'merchant' ? 'Paiement marchand' : isSent ? 'Envoyé' : 'Reçu'}
          </Text>
          <Text style={styles.transactionDescription}>
            {item.type === 'merchant' ? item.merchantCode : item.receiver?.name || item.sender?.name}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.transactionAmount}>
          <Text style={[styles.amount, isSent ? styles.amountSent : styles.amountReceived]}>
            {isSent ? '-' : '+'}{item.amount.toLocaleString()} FCFA
          </Text>
          <View style={[
            styles.statusBadge,
            item.status === 'completed' && styles.statusCompleted,
            item.status === 'pending' && styles.statusPending,
            item.status === 'failed' && styles.statusFailed,
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'completed' ? 'Succès' : item.status === 'pending' ? 'En cours' : 'Échec'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerClose}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des paiements</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Envoyé</Text>
          <Text style={styles.statValue}>
            {transactions
              .filter(t => t.sender._id === t.sender._id)
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()} FCFA
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Reçu</Text>
          <Text style={styles.statValue}>
            {transactions
              .filter(t => t.receiver && t.receiver._id)
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()} FCFA
          </Text>
        </View>
      </View>

      {/* Liste */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  headerClose: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  list: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  operatorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  operatorIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  transactionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountSent: {
    color: colors.text,
  },
  amountReceived: {
    color: '#00A651',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusCompleted: {
    backgroundColor: '#00A65120',
  },
  statusPending: {
    backgroundColor: '#FF790020',
  },
  statusFailed: {
    backgroundColor: '#E74C3C20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  empty: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
