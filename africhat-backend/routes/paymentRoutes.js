const express = require("express");
const router = express.Router();
const {
  sendMoney,
  payMerchant,
  getTransactionHistory,
  getTransaction,
  cancelTransaction,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/send", protect, sendMoney);
router.post("/merchant", protect, payMerchant);
router.get("/history", protect, getTransactionHistory);
router.get("/:reference", protect, getTransaction);
router.post("/:reference/cancel", protect, cancelTransaction);

module.exports = router;
