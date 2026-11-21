# AfriChat — Backend

Backend Node.js/Express avec Socket.io (temps réel) et MongoDB pour l'application de messagerie AfriChat.

## 1. Prérequis

- **Node.js** installé (v18 ou v20 recommandé)
- **MongoDB** installé en local

Si MongoDB n'est pas encore installé sur votre PC :
- Téléchargez "MongoDB Community Server" depuis https://www.mongodb.com/try/download/community
- Installez-le en gardant les options par défaut (il s'installe comme un service qui démarre automatiquement avec Windows)
- Vérifiez qu'il tourne bien en ouvrant "Services" (services.msc) et en cherchant "MongoDB Server"

## 2. Installation

Dans le dossier `africhat-backend`, ouvrez un terminal et lancez :

```bash
npm install
```

## 3. Configuration

Copiez le fichier `.env.example` en `.env` :

```bash
copy .env.example .env
```

Le fichier `.env` par défaut fonctionne tel quel pour un usage local. Vous pouvez changer `JWT_SECRET` par une chaîne de caractères aléatoire de votre choix (c'est ce qui sécurise vos tokens de connexion).

## 4. Lancer le serveur

```bash
npm run dev
```

Si tout fonctionne, vous devriez voir :

```
✅ MongoDB connecté
🚀 Serveur démarré sur le port 5000
```

Le serveur tourne alors sur `http://localhost:5000`.

## 5. Se connecter depuis l'app React Native (Expo)

⚠️ Important : sur votre téléphone (Expo Go), `localhost` ne fonctionnera PAS, car votre téléphone ne peut pas accéder au "localhost" de votre PC.

À la place, utilisez l'adresse IP locale de votre PC. Pour la trouver sous Windows :

```bash
ipconfig
```

Cherchez la ligne "Adresse IPv4" (souvent du type `192.168.x.x`). Utilisez ensuite dans votre app :

```js
const API_URL = "http://192.168.x.x:5000";
```

Assurez-vous que votre téléphone et votre PC sont connectés au **même réseau Wi-Fi**.

## 6. Endpoints disponibles

### Authentification
- `POST /api/auth/register` — body: `{ name, phone, password }`
- `POST /api/auth/login` — body: `{ phone, password }`

Les deux renvoient un objet utilisateur + un `token` JWT à conserver côté app (ex. dans AsyncStorage) et à envoyer dans le header `Authorization: Bearer <token>` pour les routes protégées.

### Contacts
- `GET /api/users` — liste de tous les utilisateurs (sauf soi-même)
- `GET /api/users/:id` — détails d'un utilisateur

### Messages (historique)
- `GET /api/messages/:contactId` — historique des messages avec un contact donné
- `POST /api/messages/upload` — upload authentifié d'une image/GIF ou vidéo (multipart, 25 Mo max)
- `GET /api/messages/media/:mediaId` — lecture d'un média par un participant à la conversation

Les fichiers sont stockés dans `africhat-backend/uploads` en développement. Ce dossier est ignoré par Git. Pour la production, remplacer ce stockage local par MinIO/S3.

### Temps réel (Socket.io)
Événements émis/écoutés :
- `user_connected` (client → serveur) : envoyer son `userId` juste après connexion
- `send_message` (client → serveur) : `{ senderId, receiverId, content }`
- `receive_message` (serveur → client) : nouveau message reçu
- `message_sent` (serveur → client) : confirmation d'envoi
- `typing` / `stop_typing` : indicateur "en train d'écrire"
- `user_status_changed` (serveur → client) : `{ userId, isOnline }`

## 7. Prochaine étape

Une fois ce backend lancé et testé, on pourra connecter votre app React Native dessus (écrans Login/Register, ChatScreen avec Socket.io, etc.).
