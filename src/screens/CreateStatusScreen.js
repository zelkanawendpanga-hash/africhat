import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'http://localhost:5001';

export default function CreateStatusScreen({ navigation }) {
  const { user, token } = useAuth();
  const [type, setType] = useState('text'); // 'text' or 'image'
  const [textContent, setTextContent] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [audience, setAudience] = useState('all'); // 'all', 'contacts', 'private'
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setType('image');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setType('image');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const handlePublish = async () => {
    if (type === 'text' && !textContent.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un texte');
      return;
    }

    if (type === 'image' && !imageUri) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image');
      return;
    }

    setLoading(true);

    try {
      const items = type === 'text' 
        ? [{ type: 'text', content: textContent.trim() }]
        : [{ type: 'image', content: imageUri }];

      const response = await fetch(`${API_URL}/api/statuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          audience,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', 'Statut publié avec succès !');
        navigation.goBack();
      } else {
        Alert.alert('Erreur', data.message || 'Impossible de publier le statut');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier le statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerClose}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon statut</Text>
        <TouchableOpacity onPress={handlePublish} disabled={loading}>
          <Text style={[styles.headerPublish, loading && styles.headerPublishDisabled]}>
            {loading ? 'Publication...' : 'Publier'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Type selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'text' && styles.typeButtonActive]}
            onPress={() => setType('text')}
          >
            <Text style={[styles.typeButtonText, type === 'text' && styles.typeButtonTextActive]}>
              📝 Texte
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'image' && styles.typeButtonActive]}
            onPress={() => setType('image')}
          >
            <Text style={[styles.typeButtonText, type === 'image' && styles.typeButtonTextActive]}>
              📷 Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {type === 'text' ? (
          <View style={styles.textContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Partagez ce qui vous passe par l'esprit..."
              placeholderTextColor={colors.textMuted}
              value={textContent}
              onChangeText={setTextContent}
              multiline
              textAlign="center"
              maxLength={700}
            />
            <Text style={styles.charCount}>{textContent.length}/700</Text>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Text style={styles.imagePlaceholder}>Image sélectionnée</Text>
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={pickImage}
                >
                  <Text style={styles.changeImageText}>Changer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto}>
                  <Text style={styles.imageActionIcon}>📷</Text>
                  <Text style={styles.imageActionText}>Prendre une photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>
                  <Text style={styles.imageActionIcon}>🖼️</Text>
                  <Text style={styles.imageActionText}>Galerie</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Audience selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audience</Text>
          <View style={styles.audienceOptions}>
            <TouchableOpacity
              style={[styles.audienceOption, audience === 'all' && styles.audienceOptionActive]}
              onPress={() => setAudience('all')}
            >
              <Text style={styles.audienceIcon}>🌍</Text>
              <View style={styles.audienceInfo}>
                <Text style={styles.audienceLabel}>Tous mes contacts</Text>
                <Text style={styles.audienceDesc}>Vos contacts verront ce statut</Text>
              </View>
              {audience === 'all' && <Text style={styles.audienceCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.audienceOption, audience === 'contacts' && styles.audienceOptionActive]}
              onPress={() => setAudience('contacts')}
            >
              <Text style={styles.audienceIcon}>⭐</Text>
              <View style={styles.audienceInfo}>
                <Text style={styles.audienceLabel}>Contacts favoris</Text>
                <Text style={styles.audienceDesc}>Seuls vos favoris verront ce statut</Text>
              </View>
              {audience === 'contacts' && <Text style={styles.audienceCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.audienceOption, audience === 'private' && styles.audienceOptionActive]}
              onPress={() => setAudience('private')}
            >
              <Text style={styles.audienceIcon}>🔒</Text>
              <View style={styles.audienceInfo}>
                <Text style={styles.audienceLabel}>Privé</Text>
                <Text style={styles.audienceDesc}>Seulement vous pouvez voir ce statut</Text>
              </View>
              {audience === 'private' && <Text style={styles.audienceCheck}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionLabel}>Réponses</Text>
            <Text style={styles.optionValue}>Activées</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionLabel}>Réactions</Text>
            <Text style={styles.optionValue}>Activées</Text>
          </TouchableOpacity>
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
    fontSize: 28,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerPublish: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  headerPublishDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.gold,
  },
  typeButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  typeButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  textContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
    minHeight: 200,
  },
  textInput: {
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 16,
  },
  imageContainer: {
    padding: 24,
    backgroundColor: colors.surface,
    minHeight: 300,
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 16,
    color: colors.textMuted,
  },
  changeImageButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.gold,
    borderRadius: 8,
  },
  changeImageText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '600',
  },
  imageActions: {
    gap: 16,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    gap: 12,
  },
  imageActionIcon: {
    fontSize: 24,
  },
  imageActionText: {
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  audienceOptions: {
    gap: 8,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  audienceOptionActive: {
    backgroundColor: `${colors.gold}20`,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  audienceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  audienceInfo: {
    flex: 1,
  },
  audienceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  audienceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  audienceCheck: {
    fontSize: 20,
    color: colors.gold,
    fontWeight: '700',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 15,
    color: colors.text,
  },
  optionValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
