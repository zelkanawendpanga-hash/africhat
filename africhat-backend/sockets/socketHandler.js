const Message = require("../models/Message");
const MediaAsset = require("../models/MediaAsset");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Garde en mémoire la correspondance userId -> socket.id
const onlineUsers = new Map();

function socketHandler(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentification requise"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id");
      if (!user) {
        return next(new Error("Utilisateur introuvable"));
      }
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error("Authentification socket invalide"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Nouvelle connexion socket :", socket.id);

    // Le client rejoint une conversation
    socket.on("join-chat", async ({ userId, contactId }) => {
      if (userId !== socket.userId) {
        socket.emit("chat-error", { message: "Non autorisé." });
        return;
      }

      onlineUsers.set(socket.userId, socket.id);
      socket.currentChat = contactId;

      await User.findByIdAndUpdate(socket.userId, { isOnline: true });

      // Informe tout le monde que cet utilisateur est en ligne
      io.emit("user_status_changed", { userId, isOnline: true });
    });

    // Envoi d'un message
    socket.on("send-message", async ({ sender, receiver, content, media }) => {
      try {
        if (sender && sender !== socket.userId) {
          socket.emit("message-error", { message: "Non autorisé." });
          return;
        }

        let savedMedia;
        if (media?.id) {
          const asset = await MediaAsset.findOne({
            id: media.id,
            owner: socket.userId,
          });
          if (!asset) {
            socket.emit("message-error", { message: "Média introuvable ou non autorisé." });
            return;
          }
          savedMedia = {
            id: asset.id,
            name: asset.name,
            mimeType: asset.mimeType,
            type: asset.type,
            size: asset.size,
          };
        }

        const message = await Message.create({
          sender: socket.userId,
          receiver,
          content: content || savedMedia?.name || "Média",
          media: savedMedia,
        });

        // Envoie au destinataire s'il est connecté
        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive-message", message);
        }

        // Confirme à l'expéditeur que le message est bien enregistré
        socket.emit("message-sent", message);
      } catch (error) {
        socket.emit("message-error", { message: "Échec de l'envoi du message" });
      }
    });

    // Marquer un message comme lu
    socket.on("mark-read", async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { isRead: true });

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message-read", { messageId });
        }
      } catch (error) {
        console.error("Erreur lors du marquage comme lu:", error);
      }
    });

    // Indicateur "en train d'écrire..."
    socket.on("typing", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-typing", { senderId });
      }
    });

    socket.on("stop-typing", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-stop-typing", { senderId });
      }
    });

    // Déconnexion
    socket.on("disconnect", async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit("user_status_changed", { userId: socket.userId, isOnline: false });
      }
      console.log("❌ Déconnexion socket :", socket.id);
    });
  });
}

module.exports = socketHandler;
