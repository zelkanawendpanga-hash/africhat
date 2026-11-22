const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getConversation,
  getGroupConversation,
  getConversations,
  getMedia,
  uploadMedia,
  uploadMediaFile,
} = require("../controllers/messageController");

router.get("/", protect, getConversations);
router.get("/group/:groupId", protect, getGroupConversation);
router.post("/upload", protect, uploadMediaFile, uploadMedia);
router.get("/media/:mediaId", protect, getMedia);
router.get("/:contactId", protect, getConversation);

module.exports = router;
