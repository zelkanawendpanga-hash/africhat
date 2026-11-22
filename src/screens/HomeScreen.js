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

// Un seul élément de la liste
function ConversationItem({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, item.online && styles.avatarOnline]}>
          <Text style={styles.avatarText}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.footer}>
          <Text 
            style={[styles.message, item.unread > 0 && styles.unreadText]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConversations();
  }, [token]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Impossible de charger les conversations.');
      }
      setConversations(data);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les conversations.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>AfriChat</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Contacts')}>
            <Text style={styles.icon}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.icon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Discussions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Status')}>
          <Text style={styles.tabText}>Statuts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('GroupList')}>
          <Text style={styles.tabText}>Groupes</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune conversation pour le moment.</Text>}
        renderItem={({ item }) => (
          <ConversationItem 
            item={item} 
            onPress={() => navigation.navigate('Chat', { 
              contactId: item.id, 
              contactName: item.name 
            })}
          />
        )}
      />

      {/* Bouton flottant */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Contacts')}>
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
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
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  icon: {
    color: colors.text,
    fontSize: 22,
    marginLeft: 18,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOnline: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  message: {
    flex: 1,
    color: colors.textSecondary,
  },
  unreadText: {
    color: colors.text,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 22,
  },
});
