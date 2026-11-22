const Message = require("../models/Message");
const MediaAsset = require("../models/MediaAsset");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const mediaDirectory = path.join(__dirname, "..", "uploads");
const maxMediaSize = 25 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]);

fs.mkdirSync(mediaDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: mediaDirectory,
    filename: (req, file, callback) => callback(null, crypto.randomUUID()),
  }),
  limits: { fileSize: maxMediaSize, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Format non pris en charge. Choisissez une image ou une vidéo.");
      error.status = 415;
      return callback(error);
    }
    callback(null, true);
  },
});

const uploadMediaFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: "Fichier trop volumineux ou invalide." });
    }

    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    next(error);
  });
};

const uploadMedia = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier reçu." });
  }

  try {
    const asset = await MediaAsset.create({
      id: req.file.filename,
      owner: req.user._id,
      name: path.basename(req.file.originalname),
      mimeType: req.file.mimetype,
      type: req.file.mimetype.startsWith("video/") ? "video" : "image",
      size: req.file.size,
    });

    res.status(201).json({
      id: asset.id,
      name: asset.name,
      mimeType: asset.mimeType,
      type: asset.type,
      size: asset.size,
    });
  } catch (error) {
    try {
      await fs.promises.unlink(req.file.path);
    } catch (cleanupError) {
      console.error("Impossible de supprimer un média non enregistré:", cleanupError.message);
    }
    res.status(500).json({ message: "Impossible d'enregistrer le média.", error: error.message });
  }
};

const getMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mediaId)) {
      return res.status(404).json({ message: "Média introuvable." });
    }

    const message = await Message.findOne({
      "media.id": mediaId,
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    }).select("media");

    if (!message) {
      return res.status(404).json({ message: "Média introuvable." });
    }

    res.set("X-Content-Type-Options", "nosniff");
    res.type(message.media.mimeType);
    res.sendFile(path.join(mediaDirectory, mediaId), (error) => {
      if (error && !res.headersSent) {
        res.status(error.statusCode || 500).json({ message: "Impossible de lire le média." });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/messages/:contactId
// Récupère l'historique des messages entre l'utilisateur connecté et un contact
const getConversation = async (req, res) => {
  try {
    const { contactId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: contactId },
        { sender: contactId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/messages/group/:groupId
// Récupère l'historique des messages d'un groupe
const getGroupConversation = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;
    const Group = require("../models/Group");

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }

    const isMember = group.members.some(m => m.user.equals(myId));
    if (!isMember) {
      return res.status(403).json({ message: "Vous n'êtes pas membre de ce groupe" });
    }

    const messages = await Message.find({
      group: groupId,
    })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/messages
// Récupère la liste de toutes les conversations de l'utilisateur
const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;
    const User = require("../models/User");

    // Récupérer tous les messages où l'utilisateur est impliqué
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }],
    }).sort({ createdAt: -1 });

    // Grouper par contact et récupérer le dernier message
    const conversationsMap = new Map();

    for (const message of messages) {
      const contactId = message.sender.equals(myId) ? message.receiver : message.sender;
      
      if (!conversationsMap.has(contactId.toString())) {
        const contact = await User.findById(contactId).select('name phone isOnline');
        if (contact) {
          conversationsMap.set(contactId.toString(), {
            id: contactId.toString(),
            name: contact.name,
            phone: contact.phone,
            online: contact.isOnline || false,
            lastMessage: message.content,
            time: message.createdAt,
            unread: message.receiver.equals(myId) && !message.isRead ? 1 : 0,
          });
        }
      } else {
        // Compter les messages non lus
        if (message.receiver.equals(myId) && !message.isRead) {
          const conv = conversationsMap.get(contactId.toString());
          conv.unread += 1;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values()).map(conv => ({
      ...conv,
      time: formatTime(conv.time),
    }));

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 24) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (hours < 48) {
    return 'Hier';
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }
}

module.exports = { getConversation, getGroupConversation, getConversations, getMedia, uploadMedia, uploadMediaFile };
