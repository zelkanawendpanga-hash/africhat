const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Stockage temporaire des OTP (en production, utiliser Redis)
const otpStore = new Map();
const verifiedPhones = new Map();

const normalizePhone = (phone) => phone.replace(/[^\d+]/g, "");

// Génère un OTP à 6 chiffres
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route  POST /api/auth/request-otp
const requestOTP = async (req, res) => {
  try {
    const { phone: rawPhone } = req.body;

    if (!rawPhone) {
      return res.status(400).json({ message: "Numéro de téléphone requis" });
    }

    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        message: "La vérification par SMS n'est pas encore configurée.",
      });
    }

    const phone = normalizePhone(rawPhone);
    if (await User.exists({ phone })) {
      return res.status(409).json({ message: "Ce numéro est déjà utilisé" });
    }

    const otp = generateOTP();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 minutes

    res.json({ 
      message: "Code de vérification généré pour le mode local",
      otp,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { phone: rawPhone, otp } = req.body;

    if (!rawPhone || !otp) {
      return res.status(400).json({ message: "Numéro et OTP requis" });
    }

    const phone = normalizePhone(rawPhone);
    const storedData = otpStore.get(phone);

    if (!storedData) {
      return res.status(400).json({ message: "Code expiré ou invalide" });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: "Code expiré" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Code incorrect" });
    }

    otpStore.delete(phone);
    verifiedPhones.set(phone, Date.now() + 10 * 60 * 1000);
    res.json({ verified: true, message: "Numéro vérifié avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, phone: rawPhone, password } = req.body;

    if (!name || !rawPhone || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    const phone = normalizePhone(rawPhone);
    const verificationExpiry = verifiedPhones.get(phone);
    if (!verificationExpiry || Date.now() > verificationExpiry) {
      verifiedPhones.delete(phone);
      return res.status(400).json({ message: "Veuillez vérifier votre numéro avant de créer le compte" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Ce numéro est déjà utilisé" });
    }

    const user = await User.create({ name, phone, password });
    verifiedPhones.delete(phone);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/auth/login
const login = async (req, res) => {
  try {
    const { phone: rawPhone, password } = req.body;

    if (!rawPhone || !password) {
      return res.status(400).json({ message: "Numéro et mot de passe requis" });
    }

    const phone = normalizePhone(rawPhone);
    const user = await User.findOne({ phone });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Numéro ou mot de passe incorrect" });
    }

    user.isOnline = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = { register, login, requestOTP, verifyOTP };
