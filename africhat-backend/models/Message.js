const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    media: {
      id: { type: String },
      name: { type: String },
      mimeType: { type: String },
      type: { type: String, enum: ["image", "video", "audio"] },
      size: { type: Number },
      duration: { type: Number }, // en secondes pour audio/vidéo
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    reactions: [{
      emoji: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    }],
  },
  { timestamps: true }
);

// Index pour conversations individuelles
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
// Index pour conversations de groupe
messageSchema.index({ group: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
