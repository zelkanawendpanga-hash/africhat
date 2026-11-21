import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Créer le contexte (boîte à données globale)
const AuthContext = createContext();

// Le "fournisseur" qui enveloppe toute l'app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // Utilisateur connecté
  const [loading, setLoading] = useState(true); // Chargement en cours

  // Au démarrage : vérifier si déjà connecté
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Erreur auth:', error);
    }
    setLoading(false);
  };

  // Connexion (à connecter à votre API plus tard)
  const login = async (phone, password) => {
    // SIMULATION (remplacer par vrai appel API)
    const mockUser = {
      id: '1',
      phone: phone,
      displayName: 'Utilisateur Test',
      status: 'Hey !',
    };
    
    await AsyncStorage.setItem('token', 'fake-token-123');
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
    return { success: true };
  };

  // Inscription
  const register = async (phone, password, displayName) => {
    const mockUser = {
      id: '1',
      phone,
      displayName,
      status: 'Nouveau sur AfriChat',
    };
    
    await AsyncStorage.setItem('token', 'fake-token-123');
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
    return { success: true };
  };

  // Déconnexion
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser l'auth partout
export function useAuth() {
  return useContext(AuthContext);
}
