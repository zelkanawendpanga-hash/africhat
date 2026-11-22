const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createGroup,
  getUserGroups,
  getGroup,
  updateGroup,
  addMember,
  removeMember,
  leaveGroup,
  promoteToAdmin,
} = require("../controllers/groupController");

router.post("/", protect, createGroup);
router.get("/", protect, getUserGroups);
router.get("/:groupId", protect, getGroup);
router.put("/:groupId", protect, updateGroup);
router.post("/:groupId/members", protect, addMember);
router.delete("/:groupId/members/:userId", protect, removeMember);
router.post("/:groupId/leave", protect, leaveGroup);
router.post("/:groupId/admins/:userId", protect, promoteToAdmin);

module.exports = router;
