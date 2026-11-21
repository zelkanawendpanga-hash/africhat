const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getContacts, getUserById } = require("../controllers/userController");

router.get("/", protect, getContacts);
router.get("/:id", protect, getUserById);

module.exports = router;
