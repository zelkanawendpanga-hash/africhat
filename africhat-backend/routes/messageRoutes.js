const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getConversation,
  getMedia,
  uploadMedia,
  uploadMediaFile,
} = require("../controllers/messageController");

router.post("/upload", protect, uploadMediaFile, uploadMedia);
router.get("/media/:mediaId", protect, getMedia);
router.get("/:contactId", protect, getConversation);

module.exports = router;
