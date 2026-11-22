import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

const API_URL = 'http://localhost:5001';

export default function CreateGroupScreen({ navigation }) {
  const { token } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContacts();
  }, [token]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Impossible de charger les contacts.');
      }
      setContacts(data);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les contacts.');
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Erreur', 'Le nom du groupe est requis');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un membre');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim(),
          memberIds: selectedContacts,
          isPrivate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', 'Groupe créé avec succès !');
        navigation.goBack();
      } else {
        Alert.alert('Erreur', data.message || 'Impossible de créer le groupe');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le groupe');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContactItem = ({ item }) => {
    const isSelected = selectedContacts.includes(item._id);
    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
        onPress={() => toggleContact(item._id)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <Text style={styles.contactName}>{item.name}</Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau groupe</Text>
        <TouchableOpacity onPress={handleCreate} disabled={submitting}>
          <Text style={[styles.createButton, submitting && styles.createButtonDisabled]}>
            {submitting ? 'Création...' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Nom du groupe */}
        <View style={styles.section}>
          <Text style={styles.label}>Nom du groupe</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Famille, Collègues..."
            placeholderTextColor={colors.textMuted}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Décrivez ce groupe..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={styles.label}>Confidentialité</Text>
          <TouchableOpacity
            style={[styles.option, isPrivate && styles.optionActive]}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={[styles.optionDot, isPrivate && styles.optionDotActive]} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Groupe privé</Text>
              <Text style={styles.optionDesc}>
                Seuls les membres peuvent voir ce groupe
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sélection des membres */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Membres ({selectedContacts.length})</Text>
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun contact disponible</Text>}
              renderItem={renderContactItem}
              style={styles.contactsList}
            />
          )}
        </View>
      </ScrollView>
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
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: colors.surface,
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}20`,
  },
  optionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
  },
  optionDotActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactsList: {
    maxHeight: 300,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  contactItemSelected: {
    backgroundColor: `${colors.gold}20`,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.background,
  },
  contactName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  checkmark: {
    fontSize: 18,
    color: colors.gold,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    padding: 16,
  },
});
