import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';

const API_URL = 'http://localhost:5001';
const MAX_MEDIA_SIZE = 25 * 1024 * 1024;

function VideoAttachment({ uri, headers }) {
  const player = useVideoPlayer({ uri, headers });
  return (
    <VideoView
      player={player}
      style={styles.mediaVideo}
      nativeControls
      contentFit="contain"
    />
  );
}

export default function ChatScreen({ route, navigation }) {
  const { user, token } = useAuth();
  const { contactId, contactName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const loadedMediaRef = useRef(new Set());
  const mediaObjectUrlsRef = useRef(new Set());
  const [mediaUrls, setMediaUrls] = useState({});

  useEffect(() => {
    if (!contactId) return;

    // Initialiser la connexion Socket.io
    socketRef.current = io(API_URL, {
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('Connecté au serveur Socket.io');
      socketRef.current.emit('join-chat', { userId: user._id, contactId });
    });

    socketRef.current.on('receive-message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socketRef.current.on('message-read', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    // Charger l'historique des messages
    loadMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [contactId, user._id, token]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    messages.forEach((message) => {
      const mediaId = message.media?.id;
      if (!mediaId || loadedMediaRef.current.has(mediaId)) return;
      loadedMediaRef.current.add(mediaId);

      fetch(`${API_URL}/api/messages/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Impossible de charger le média.');
          }
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          mediaObjectUrlsRef.current.add(objectUrl);
          setMediaUrls((previous) => ({ ...previous, [mediaId]: objectUrl }));
        })
        .catch((error) => {
          loadedMediaRef.current.delete(mediaId);
          console.error('Erreur lors du chargement du média:', error);
        });
    });
  }, [messages, token]);

  useEffect(() => () => {
    mediaObjectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/${contactId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      // Envoyer via Socket.io pour temps réel
      socketRef.current.emit('send-message', {
        sender: user._id,
        receiver: contactId,
        content: messageContent,
      });

      // Ajouter localement pour affichage immédiat
      const tempMessage = {
        _id: Date.now().toString(),
        sender: user._id,
        receiver: contactId,
        content: messageContent,
        isRead: false,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempMessage]);

      // Faire défiler vers le bas
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setLoading(false);
    }
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.fileSize > MAX_MEDIA_SIZE) {
        Alert.alert('Fichier trop volumineux', 'La taille maximale est de 25 Mo.');
        return;
      }

      setLoading(true);
      const mimeType = asset.mimeType || asset.file?.type ||
        (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
      const fileName = asset.fileName || `media-${Date.now()}`;
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const file = asset.file || await fetch(asset.uri).then((response) => response.blob());
        formData.append('file', file, fileName);
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        });
      }

      const response = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const media = await response.json();
      if (!response.ok) {
        throw new Error(media.message || 'Impossible d’envoyer ce fichier.');
      }

      if (!socketRef.current?.connected) {
        throw new Error('La connexion au chat est interrompue. Réessayez.');
      }

      const message = {
        sender: user._id,
        receiver: contactId,
        content: media.name,
        media,
      };
      socketRef.current.emit('send-message', message);
      setMessages((previous) => [
        ...previous,
        { ...message, _id: Date.now().toString(), createdAt: new Date(), isRead: false },
      ]);
    } catch (error) {
      console.error('Erreur lors de l’envoi du média:', error);
      Alert.alert('Erreur', error.message || 'Impossible d’envoyer le média.');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.sender === user._id;
    const mediaUri = item.media?.id
      ? mediaUrls[item.media.id] || `${API_URL}/api/messages/media/${item.media.id}`
      : null;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.messageOwn : styles.messageOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          {item.media?.type === 'image' ? (
            <Image
              source={{
                uri: mediaUri,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : item.media?.type === 'video' ? (
            <VideoAttachment
              uri={mediaUri}
              headers={Platform.OS === 'web' ? undefined : { Authorization: `Bearer ${token}` }}
            />
          ) : null}
          {item.media ? (
            <Text style={[styles.mediaName, isOwn && styles.textOwn]}>
              {item.media.name}
            </Text>
          ) : (
            <Text style={[styles.messageText, isOwn && styles.textOwn]}>
              {item.content}
            </Text>
          )}
          <View style={styles.messageMeta}>
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isOwn && (
              <Text style={styles.messageStatus}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{contactName || 'Contact'}</Text>
          <Text style={styles.headerStatus}>En ligne</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Text style={styles.headerIcon}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction}>
          <Text style={styles.headerIcon}>📹</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id || item.createdAt?.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Barre de saisie */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={pickMedia} disabled={loading}>
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Écrivez un message..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.emojiButton}>
          <Text style={styles.emojiIcon}>😊</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendIcon}>
            {inputText.trim() ? '➤' : '🎤'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 24,
    color: colors.text,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.gold,
  },
  headerAction: {
    marginLeft: 12,
  },
  headerIcon: {
    fontSize: 20,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 8,
  },
  messageOwn: {
    alignItems: 'flex-end',
  },
  messageOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: colors.gold,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  mediaImage: {
    width: 240,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  mediaVideo: {
    width: 260,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  mediaName: {
    color: colors.text,
    fontSize: 13,
    marginTop: 6,
  },
  textOwn: {
    color: colors.background,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginRight: 4,
  },
  messageStatus: {
    fontSize: 11,
    color: colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    padding: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: colors.text,
    marginHorizontal: 8,
  },
  emojiButton: {
    padding: 8,
  },
  emojiIcon: {
    fontSize: 20,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 20,
  },
});
