const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optionnel pour les paiements marchands
    },
    merchantCode: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: 100, // Minimum 100 FCFA
    },
    currency: {
      type: String,
      default: "XOF",
    },
    operator: {
      type: String,
      enum: ["orange", "moov", "wave", "coris"],
      required: true,
    },
    type: {
      type: String,
      enum: ["p2p", "merchant"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    externalReference: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      default: "",
    },
    fee: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index pour rechercher les transactions d'un utilisateur
transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
