const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getStatuses,
  getMyStatuses,
  createStatus,
  viewStatus,
} = require("../controllers/statusController");

router.get("/", protect, getStatuses);
router.get("/my", protect, getMyStatuses);
router.post("/", protect, createStatus);
router.post("/:statusId/view", protect, viewStatus);

module.exports = router;
