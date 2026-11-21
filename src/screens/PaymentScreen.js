import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import QRCode from 'react-native-qrcode-svg';

export default function PaymentScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { type = 'send', merchantCode } = route.params || {};
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState('orange');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const operators = [
    { id: 'orange', name: 'Orange Money', color: '#FF7900' },
    { id: 'moov', name: 'Moov Money', color: '#00A651' },
    { id: 'wave', name: 'Wave', color: '#00D4FF' },
    { id: 'coris', name: 'CORIS Money', color: '#9B59B6' },
  ];

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) < 100) {
      Alert.alert('Erreur', 'Le montant minimum est de 100 FCFA');
      return;
    }

    setLoading(true);

    try {
      const API_URL = 'http://localhost:5001';
      const endpoint = type === 'merchant' ? '/api/payments/merchant' : '/api/payments/send';
      
      const body = type === 'merchant'
        ? { merchantCode, amount: parseFloat(amount), operator, description }
        : { receiverId: merchantCode, amount: parseFloat(amount), operator, description };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Succès',
          'Transaction initiée avec succès',
          [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        Alert.alert('Erreur', data.message || 'Échec de la transaction');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter le paiement');
    } finally {
      setLoading(false);
    }
  };

  const renderSendForm = () => (
    <View style={styles.form}>
      <Text style={styles.label}>Destinataire</Text>
      <View style={styles.receiverContainer}>
        <Text style={styles.receiverText}>
          {merchantCode || 'Sélectionnez un contact'}
        </Text>
      </View>

      <Text style={styles.label}>Montant (FCFA)</Text>
      <TextInput
        style={styles.amountInput}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Opérateur</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.operatorsContainer}>
        {operators.map((op) => (
          <TouchableOpacity
            key={op.id}
            style={[
              styles.operatorCard,
              operator === op.id && styles.operatorCardActive,
              { borderColor: op.color },
            ]}
            onPress={() => setOperator(op.id)}
          >
            <View style={[styles.operatorDot, { backgroundColor: op.color }]} />
            <Text style={styles.operatorName}>{op.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Description (optionnel)</Text>
      <TextInput
        style={styles.input}
        placeholder="Motif du paiement..."
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />

      {amount && (
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montant</Text>
            <Text style={styles.summaryValue}>{parseFloat(amount).toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais (1%)</Text>
            <Text style={styles.summaryValue}>
              {Math.round(parseFloat(amount) * 0.01).toLocaleString()} FCFA
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {(parseFloat(amount) + Math.round(parseFloat(amount) * 0.01)).toLocaleString()} FCFA
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Traitement...' : 'Envoyer'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMerchantForm = () => (
    <View style={styles.form}>
      <Text style={styles.label}>Marchand</Text>
      <View style={styles.receiverContainer}>
        <Text style={styles.receiverText}>{merchantCode || 'Code marchand'}</Text>
      </View>

      <Text style={styles.label}>Montant (FCFA)</Text>
      <TextInput
        style={styles.amountInput}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Opérateur</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.operatorsContainer}>
        {operators.map((op) => (
          <TouchableOpacity
            key={op.id}
            style={[
              styles.operatorCard,
              operator === op.id && styles.operatorCardActive,
              { borderColor: op.color },
            ]}
            onPress={() => setOperator(op.id)}
          >
            <View style={[styles.operatorDot, { backgroundColor: op.color }]} />
            <Text style={styles.operatorName}>{op.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {amount && (
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montant</Text>
            <Text style={styles.summaryValue}>{parseFloat(amount).toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais (1.5%)</Text>
            <Text style={styles.summaryValue}>
              {Math.round(parseFloat(amount) * 0.015).toLocaleString()} FCFA
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {(parseFloat(amount) + Math.round(parseFloat(amount) * 0.015)).toLocaleString()} FCFA
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Traitement...' : 'Payer'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQRCode = () => (
    <View style={styles.qrContainer}>
      <TouchableOpacity onPress={() => setShowQR(false)} style={styles.qrClose}>
        <Text style={styles.qrCloseText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.qrTitle}>Mon code de paiement</Text>
      <View style={styles.qrCodeWrapper}>
        <QRCode
          value={`AFRICHA:${user._id}`}
          size={250}
          color={colors.text}
          backgroundColor={colors.background}
        />
      </View>
      <Text style={styles.qrHint}>
        Partagez ce code pour recevoir des paiements
      </Text>
      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => setShowQR(false)}
      >
        <Text style={styles.qrButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  );

  if (showQR) {
    return renderQRCode();
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerClose}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'merchant' ? 'Payer un marchand' : 'Envoyer de l\'argent'}
        </Text>
        <TouchableOpacity onPress={() => setShowQR(true)}>
          <Text style={styles.headerQR}>QR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {type === 'merchant' ? renderMerchantForm() : renderSendForm()}
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
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerQR: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },
  receiverContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiverText: {
    fontSize: 15,
    color: colors.text,
  },
  amountInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  operatorsContainer: {
    marginVertical: 8,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 140,
  },
  operatorCardActive: {
    backgroundColor: `${colors.gold}20`,
  },
  operatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  operatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  qrContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrClose: {
    position: 'absolute',
    top: 50,
    right: 16,
  },
  qrCloseText: {
    fontSize: 28,
    color: colors.text,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 32,
  },
  qrCodeWrapper: {
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  qrHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  qrButton: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 48,
  },
  qrButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
