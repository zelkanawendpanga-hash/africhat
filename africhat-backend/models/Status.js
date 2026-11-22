const mongoose = require("mongoose");

const statusItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["text", "image"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  views: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
});

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [statusItemSchema],
    audience: {
      type: String,
      enum: ["all", "favorites", "private"],
      default: "all",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
    },
  },
  { timestamps: true }
);

statusSchema.index({ user: 1, createdAt: -1 });
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Status", statusSchema);
