import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Contexte
import { AuthProvider } from './src/context/AuthContext';

// Écrans
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StatusScreen from './src/screens/StatusScreen';
import CreateStatusScreen from './src/screens/CreateStatusScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import PaymentHistoryScreen from './src/screens/PaymentHistoryScreen';

// Créer le "stack" de navigation
const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#111418' },
            headerTintColor: '#e8b94f',
            headerTitleStyle: { fontWeight: 'bold' },
            cardStyle: { backgroundColor: '#0a0c0f' }
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ title: 'Créer un compte' }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Conversation' }}
          />
          <Stack.Screen 
            name="Contacts" 
            component={ContactsScreen}
            options={{ title: 'Contacts' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Mon Profil' }}
          />
          <Stack.Screen
            name="Status"
            component={StatusScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateStatus"
            component={CreateStatusScreen}
            options={{ title: 'Créer un statut' }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ title: 'Paiement' }}
          />
          <Stack.Screen
            name="PaymentHistory"
            component={PaymentHistoryScreen}
            options={{ title: 'Historique' }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
