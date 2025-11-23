const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} = require("../controllers/cartController");

router.get("/", requireAuth, getCart);
router.post("/items", requireAuth, addToCart);
router.put("/items/:id", requireAuth, updateCartItem);
router.delete("/items/:id", requireAuth, deleteCartItem);
router.delete("/", requireAuth, clearCart);

module.exports = router;
