import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

const API_URL = 'http://localhost:5001';

export default function GroupListScreen({ navigation }) {
  const { token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroups();
  }, [token]);

  const loadGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Impossible de charger les groupes.');
      }
      setGroups(data);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les groupes.');
    } finally {
      setLoading(false);
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Chat', {
        groupId: item._id,
        groupName: item.name,
        isGroup: true,
      })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.members}>
          {item.members.length} membres
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Groupes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des groupes */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun groupe. Créez-en un !</Text>}
        renderItem={renderGroupItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyText: { 
    color: colors.textSecondary, 
    textAlign: 'center', 
    padding: 24 
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
  backButton: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    fontSize: 28,
    color: colors.gold,
    fontWeight: '700',
  },
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  members: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});
