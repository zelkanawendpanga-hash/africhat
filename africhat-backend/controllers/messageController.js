const Message = require("../models/Message");
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

const uploadMedia = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier reçu." });
  }

  res.status(201).json({
    id: req.file.filename,
    name: path.basename(req.file.originalname),
    mimeType: req.file.mimetype,
    type: req.file.mimetype.startsWith("video/") ? "video" : "image",
    size: req.file.size,
  });
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

module.exports = { getConversation, getMedia, uploadMedia, uploadMediaFile };
