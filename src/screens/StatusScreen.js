import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

const API_URL = 'http://localhost:5001';

export default function StatusScreen({ navigation }) {
  const { user, token } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatuses();
  }, [token]);

  const loadStatuses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/statuses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Impossible de charger les statuts.');
      }
      setStatuses(data);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les statuts.');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusItem = ({ item }) => (
    <TouchableOpacity
      style={styles.statusItem}
      onPress={() => {
        setSelectedStatus(item);
        setCurrentIndex(0);
      }}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.user.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.statusRing} />
      </View>
      <View style={styles.statusInfo}>
        <Text style={styles.userName}>{item.user.name}</Text>
        <Text style={styles.statusTime}>
          {item.items[0]?.time || 'Aujourd\'hui'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderStatusViewer = () => {
    if (!selectedStatus) return null;

    const currentItem = selectedStatus.items[currentIndex];

    return (
      <View style={styles.viewerContainer}>
        {/* Header */}
        <View style={styles.viewerHeader}>
          <TouchableOpacity onPress={() => setSelectedStatus(null)}>
            <Text style={styles.viewerClose}>✕</Text>
          </TouchableOpacity>
          <View style={styles.viewerUserInfo}>
            <Text style={styles.viewerUserName}>{selectedStatus.user.name}</Text>
            <Text style={styles.viewerTime}>{currentItem.time}</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewerMore}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          {selectedStatus.items.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressItem,
                index < currentIndex && styles.progressSeen,
                index === currentIndex && styles.progressCurrent,
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.viewerContent}>
          {currentItem.type === 'image' ? (
            <Image
              source={{ uri: currentItem.content }}
              style={styles.statusImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.textStatusContainer}>
              <Text style={styles.textStatus}>{currentItem.content}</Text>
            </View>
          )}
        </View>

        {/* Reactions */}
        <View style={styles.viewerFooter}>
          <TouchableOpacity style={styles.reactionButton}>
            <Text style={styles.reactionIcon}>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionButton}>
            <Text style={styles.reactionIcon}>❤️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionButton}>
            <Text style={styles.reactionIcon}>😂</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionButton}>
            <Text style={styles.reactionIcon}>😮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionButton}>
            <Text style={styles.reactionIcon}>😢</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <View style={styles.viewerNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
              else setSelectedStatus(null);
            }}
          >
            <Text style={styles.navIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (currentIndex < selectedStatus.items.length - 1) {
                setCurrentIndex(currentIndex + 1);
              } else {
                setSelectedStatus(null);
              }
            }}
          >
            <Text style={styles.navIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Reply input */}
        <View style={styles.replyContainer}>
          <Text style={styles.replyText}>Répondre à {selectedStatus.user.name}...</Text>
        </View>
      </View>
    );
  };

  if (selectedStatus) {
    return renderStatusViewer();
  }

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
        <Text style={styles.headerTitle}>Statuts</Text>
        <TouchableOpacity
          style={styles.addStatusButton}
          onPress={() => navigation.navigate('CreateStatus')}
        >
          <Text style={styles.addStatusIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Mon statut */}
      <TouchableOpacity
        style={styles.myStatus}
        onPress={() => navigation.navigate('CreateStatus')}
      >
        <View style={styles.myAvatarContainer}>
          <View style={styles.myAvatar}>
            <Text style={styles.avatarText}>
              {user?.name?.split(' ').map(n => n[0]).join('') || 'M'}
            </Text>
          </View>
          <View style={styles.addStatusRing}>
            <Text style={styles.addStatusRingIcon}>+</Text>
          </View>
        </View>
        <View style={styles.myStatusInfo}>
          <Text style={styles.myStatusLabel}>Mon statut</Text>
          <Text style={styles.myStatusHint}>
            Appuyez pour ajouter une mise à jour
          </Text>
        </View>
      </TouchableOpacity>

      {/* Liste des statuts */}
      {statuses.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Statuts récents</Text>
        </View>
      )}

      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun statut récent.</Text>}
        renderItem={renderStatusItem}
        contentContainerStyle={styles.statusList}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  addStatusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStatusIcon: {
    fontSize: 20,
    color: colors.background,
    fontWeight: '700',
  },
  myStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  myAvatarContainer: {
    marginRight: 16,
  },
  myAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStatusRing: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  addStatusRingIcon: {
    fontSize: 16,
    color: colors.background,
    fontWeight: '700',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.background,
  },
  myStatusInfo: {
    flex: 1,
  },
  myStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  myStatusHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusList: {
    paddingVertical: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  statusRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  statusInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  viewerClose: {
    fontSize: 28,
    color: '#fff',
    marginRight: 16,
  },
  viewerUserInfo: {
    flex: 1,
  },
  viewerUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  viewerTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  viewerMore: {
    fontSize: 24,
    color: '#fff',
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 4,
  },
  progressItem: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressSeen: {
    backgroundColor: '#fff',
  },
  progressCurrent: {
    backgroundColor: colors.gold,
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusImage: {
    width: '100%',
    height: '100%',
  },
  textStatusContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  textStatus: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  viewerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  reactionButton: {
    padding: 12,
  },
  reactionIcon: {
    fontSize: 32,
  },
  viewerNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navButton: {
    padding: 16,
  },
  navIcon: {
    fontSize: 24,
    color: '#fff',
  },
  replyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  replyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
