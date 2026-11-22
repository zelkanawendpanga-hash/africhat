const Status = require("../models/Status");
const User = require("../models/User");

// @route  GET /api/statuses
// Récupère tous les statuts visibles par l'utilisateur
const getStatuses = async (req, res) => {
  try {
    const myId = req.user._id;

    // Récupérer les statuts actifs (non expirés)
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "name phone")
      .sort({ createdAt: -1 });

    // Filtrer pour ne pas inclure ses propres statuts dans la liste des autres
    const otherStatuses = statuses.filter(status => !status.user._id.equals(myId));

    // Formater les statuts pour le frontend
    const formattedStatuses = otherStatuses.map(status => ({
      id: status._id.toString(),
      user: {
        id: status.user._id.toString(),
        name: status.user.name,
        avatar: "",
      },
      items: status.items.map(item => ({
        id: `${status._id}-${item._id}`,
        type: item.type,
        content: item.content,
        time: formatTime(item.time),
        views: item.views.length,
      })),
    }));

    res.json(formattedStatuses);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/statuses/my
// Récupère les statuts de l'utilisateur connecté
const getMyStatuses = async (req, res) => {
  try {
    const myId = req.user._id;

    const statuses = await Status.find({
      user: myId,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/statuses
// Créer un nouveau statut
const createStatus = async (req, res) => {
  try {
    const { items, audience } = req.body;
    const myId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Les items du statut sont requis" });
    }

    const status = await Status.create({
      user: myId,
      items,
      audience: audience || "all",
    });

    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/statuses/:statusId/view
// Marquer un statut comme vu
const viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const myId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Statut introuvable" });
    }

    // Ajouter l'utilisateur aux vues s'il n'est pas déjà là
    for (const item of status.items) {
      if (!item.views.includes(myId)) {
        item.views.push(myId);
      }
    }

    await status.save();
    res.json({ message: "Statut marqué comme vu" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) {
    return "À l'instant";
  } else if (hours < 24) {
    return `Il y a ${hours}h`;
  } else {
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  }
}

module.exports = { getStatuses, getMyStatuses, createStatus, viewStatus };
