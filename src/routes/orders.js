const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const {
  createOrder,
  getUserOrders,
  getOrderById,
} = require("../controllers/ordersController");

router.post("/", requireAuth, createOrder);
router.get("/", requireAuth, getUserOrders);
router.get("/:id", requireAuth, getOrderById);

module.exports = router;
