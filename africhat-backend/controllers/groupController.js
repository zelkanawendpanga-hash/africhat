const Group = require("../models/Group");
const User = require("../models/User");
const crypto = require("crypto");

// @route  POST /api/groups
// Créer un nouveau groupe
const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, isPrivate } = req.body;
    const myId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Le nom du groupe est requis" });
    }

    // Créer les membres (créateur + membres sélectionnés)
    const members = [
      { user: myId, role: "admin" },
      ...(memberIds || []).map(id => ({ user: id, role: "member" }))
    ];

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim(),
      createdBy: myId,
      members,
      admins: [myId],
      isPrivate: isPrivate || false,
      inviteLink: crypto.randomBytes(16).toString("hex"),
    });

    // Populer les membres pour la réponse
    const populatedGroup = await Group.findById(group._id)
      .populate("members.user", "name phone isOnline")
      .populate("createdBy", "name");

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/groups
// Récupérer tous les groupes de l'utilisateur
const getUserGroups = async (req, res) => {
  try {
    const myId = req.user._id;

    const groups = await Group.find({
      "members.user": myId,
    })
      .populate("members.user", "name phone isOnline")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  GET /api/groups/:groupId
// Récupérer les détails d'un groupe
const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("members.user", "name phone isOnline")
      .populate("createdBy", "name")
      .populate("pinnedMessages");

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }

    // Vérifier que l'utilisateur est membre
    const isMember = group.members.some(m => m.user._id.equals(myId));
    if (!isMember) {
      return res.status(403).json({ message: "Vous n'êtes pas membre de ce groupe" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  PUT /api/groups/:groupId
// Mettre à jour un groupe
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatar } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = group.admins.some(admin => admin.equals(myId));
    if (!isAdmin) {
      return res.status(403).json({ message: "Seuls les admins peuvent modifier le groupe" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar) group.avatar = avatar;

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "name phone isOnline")
      .populate("createdBy", "name");

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/groups/:groupId/members
// Ajouter un membre au groupe
const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = group.admins.some(admin => admin.equals(myId));
    if (!isAdmin) {
      return res.status(403).json({ message: "Seuls les admins peuvent ajouter des membres" });
    }

    // Vérifier que le membre n'est pas déjà dans le groupe
    const isAlreadyMember = group.members.some(m => m.user.equals(userId));
    if (isAlreadyMember) {
      return res.status(400).json({ message: "Cet utilisateur est déjà membre" });
    }

    // Vérifier la limite de membres
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: "Le groupe a atteint sa limite de membres" });
    }

    group.members.push({ user: userId, role: "member" });
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "name phone isOnline")
      .populate("createdBy", "name");

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  DELETE /api/groups/:groupId/members/:userId
// Retirer un membre du groupe
const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }

    // Vérifier que l'utilisateur est admin ou qu'il se retire lui-même
    const isAdmin = group.admins.some(admin => admin.equals(myId));
    const isSelf = userId === myId.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    // Ne pas permettre de retirer le créateur
    if (group.createdBy.equals(userId) && !isSelf) {
      return res.status(400).json({ message: "Impossible de retirer le créateur du groupe" });
    }

    group.members = group.members.filter(m => !m.user.equals(userId));
    group.admins = group.admins.filter(admin => !admin.equals(userId));

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "name phone isOnline")
      .populate("createdBy", "name");

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/groups/:groupId/leave
// Quitter un groupe
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }

    // Le créateur ne peut pas quitter son propre groupe
    if (group.createdBy.equals(myId)) {
      return res.status(400).json({ message: "Le créateur ne peut pas quitter le groupe" });
    }

    group.members = group.members.filter(m => !m.user.equals(myId));
    group.admins = group.admins.filter(admin => !admin.equals(myId));

    await group.save();

    res.json({ message: "Vous avez quitté le groupe" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @route  POST /api/groups/:groupId/admins/:userId
// Promouvoir un membre en admin
const promoteToAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }

    // Seul le créateur peut promouvoir des admins
    if (!group.createdBy.equals(myId)) {
      return res.status(403).json({ message: "Seul le créateur peut promouvoir des admins" });
    }

    // Vérifier que l'utilisateur est membre
    const member = group.members.find(m => m.user.equals(userId));
    if (!member) {
      return res.status(404).json({ message: "Utilisateur non trouvé dans le groupe" });
    }

    // Ajouter aux admins s'il n'y est pas déjà
    if (!group.admins.some(admin => admin.equals(userId))) {
      group.admins.push(userId);
      member.role = "admin";
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "name phone isOnline")
      .populate("createdBy", "name");

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroup,
  updateGroup,
  addMember,
  removeMember,
  leaveGroup,
  promoteToAdmin,
};
