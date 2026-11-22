const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MediaAsset", mediaAssetSchema);
