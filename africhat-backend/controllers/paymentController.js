const Transaction = require("../models/Transaction");
const User = require("../models/User");

// Génération d'une référence unique
const generateReference = () => {
  return `AFR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Simulation des intégrations Mobile Money (en production, utiliser les APIs réelles)
const mobileMoneyIntegrations = {
  orange: {
    name: "Orange Money",
    initiatePayment: async (amount, phone, reference) => {
      // TODO: Intégrer avec l'API Orange Money
      console.log(`[Orange Money] Initiation: ${amount} FCFA vers ${phone}, Ref: ${reference}`);
      return { success: true, transactionId: `OM${reference}` };
    },
    checkStatus: async (transactionId) => {
      // TODO: Vérifier le statut via l'API Orange Money
      return { status: "completed" };
    },
  },
  moov: {
    name: "Moov Money",
    initiatePayment: async (amount, phone, reference) => {
      // TODO: Intégrer avec l'API Moov Money
      console.log(`[Moov Money] Initiation: ${amount} FCFA vers ${phone}, Ref: ${reference}`);
      return { success: true, transactionId: `MV${reference}` };
    },
    checkStatus: async (transactionId) => {
      // TODO: Vérifier le statut via l'API Moov Money
      return { status: "completed" };
    },
  },
  wave: {
    name: "Wave",
    initiatePayment: async (amount, phone, reference) => {
      // TODO: Intégrer avec l'API Wave
      console.log(`[Wave] Initiation: ${amount} FCFA vers ${phone}, Ref: ${reference}`);
      return { success: true, transactionId: `WV${reference}` };
    },
    checkStatus: async (transactionId) => {
      // TODO: Vérifier le statut via l'API Wave
      return { status: "completed" };
    },
  },
  coris: {
    name: "CORIS Money",
    initiatePayment: async (amount, phone, reference) => {
      // TODO: Intégrer avec l'API CORIS
      console.log(`[CORIS] Initiation: ${amount} FCFA vers ${phone}, Ref: ${reference}`);
      return { success: true, transactionId: `CR${reference}` };
    },
    checkStatus: async (transactionId) => {
      // TODO: Vérifier le statut via l'API CORIS
      return { status: "completed" };
    },
  },
};

// @route  POST /api/payments/send
// Envoi d'argent entre utilisateurs (P2P)
const sendMoney = async (req, res) => {
  try {
    const { receiverId, amount, operator, description } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !amount || !operator) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    if (amount < 100) {
      return res.status(400).json({ message: "Le montant minimum est de 100 FCFA" });
    }

    if (!["orange", "moov", "wave", "coris"].includes(operator)) {
      return res.status(400).json({ message: "Opérateur invalide" });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: "Destinataire introuvable" });
    }

    const reference = generateReference();
    const integration = mobileMoneyIntegrations[operator];

    // Initier le paiement via l'opérateur
    const paymentResult = await integration.initiatePayment(
      amount,
      receiver.phone,
      reference
    );

    if (!paymentResult.success) {
      return res.status(500).json({ message: "Échec de l'initiation du paiement" });
    }

    // Créer la transaction
    const transaction = await Transaction.create({
      sender: senderId,
      receiver: receiverId,
      amount,
      operator,
      type: "p2p",
      reference,
      externalReference: paymentResult.transactionId,
      description: description || "",
      fee: Math.round(amount * 0.01), // 1% de frais
    });

    // Simuler la confirmation (en production, utiliser webhooks)
    setTimeout(async () => {
      const statusResult = await integration.checkStatus(paymentResult.transactionId);
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: statusResult.status,
      });
    }, 3000);

    res.status(201).json({
      transaction,
      message: "Transaction initiée avec succès",
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/payments/merchant
// Paiement marchand via QR Code
const payMerchant = async (req, res) => {
  try {
    const { merchantCode, amount, operator, description } = req.body;
    const senderId = req.user._id;

    if (!merchantCode || !amount || !operator) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    if (amount < 100) {
      return res.status(400).json({ message: "Le montant minimum est de 100 FCFA" });
    }

    const reference = generateReference();
    const integration = mobileMoneyIntegrations[operator];

    // Initier le paiement
    const paymentResult = await integration.initiatePayment(
      amount,
      merchantCode,
      reference
    );

    if (!paymentResult.success) {
      return res.status(500).json({ message: "Échec de l'initiation du paiement" });
    }

    // Créer la transaction
    const transaction = await Transaction.create({
      sender: senderId,
      merchantCode,
      amount,
      operator,
      type: "merchant",
      reference,
      externalReference: paymentResult.transactionId,
      description: description || "",
      fee: Math.round(amount * 0.015), // 1.5% de frais pour marchands
    });

    // Simuler la confirmation
    setTimeout(async () => {
      const statusResult = await integration.checkStatus(paymentResult.transactionId);
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: statusResult.status,
      });
    }, 3000);

    res.status(201).json({
      transaction,
      message: "Paiement initié avec succès",
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/payments/history
// Historique des transactions de l'utilisateur
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name phone avatar")
      .populate("receiver", "name phone avatar")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transaction.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    res.json({
      transactions,
      total,
      hasMore: total > parseInt(skip) + parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/payments/:reference
// Détails d'une transaction
const getTransaction = async (req, res) => {
  try {
    const { reference } = req.params;

    const transaction = await Transaction.findOne({ reference })
      .populate("sender", "name phone avatar")
      .populate("receiver", "name phone avatar");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction introuvable" });
    }

    // Vérifier si l'utilisateur a le droit de voir cette transaction
    if (
      transaction.sender._id.toString() !== req.user._id.toString() &&
      transaction.receiver?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/payments/:reference/cancel
// Annulation d'une transaction
const cancelTransaction = async (req, res) => {
  try {
    const { reference } = req.params;

    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction introuvable" });
    }

    if (transaction.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Transaction ne peut plus être annulée" });
    }

    transaction.status = "cancelled";
    await transaction.save();

    res.json({ message: "Transaction annulée", transaction });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  sendMoney,
  payMerchant,
  getTransactionHistory,
  getTransaction,
  cancelTransaction,
};
