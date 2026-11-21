import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(user?.name || user?.displayName || 'Utilisateur')
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </Text>
      </View>
      <Text style={styles.name}>{user?.name || user?.displayName || 'Utilisateur'}</Text>
      <Text style={styles.phone}>{user?.phone || ''}</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Se deconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: { color: '#000', fontSize: 28, fontWeight: 'bold' },
  name: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  phone: { color: colors.textSecondary, marginTop: 8 },
  button: {
    marginTop: 32,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  buttonText: { color: colors.primary, fontWeight: 'bold' },
});