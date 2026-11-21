const Message = require("../models/Message");
const User = require("../models/User");

// Garde en mémoire la correspondance userId -> socket.id
const onlineUsers = new Map();

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Nouvelle connexion socket :", socket.id);

    // Le client rejoint une conversation
    socket.on("join-chat", async ({ userId, contactId }) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.currentChat = contactId;

      await User.findByIdAndUpdate(userId, { isOnline: true });

      // Informe tout le monde que cet utilisateur est en ligne
      io.emit("user_status_changed", { userId, isOnline: true });
    });

    // Envoi d'un message
    socket.on("send-message", async ({ sender, receiver, content, media }) => {
      try {
        const message = await Message.create({
          sender,
          receiver,
          content: content || media?.name || "Média",
          media,
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
