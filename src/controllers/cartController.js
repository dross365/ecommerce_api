const pool = require("../db/db");

// Helper function: get or create user's cart
async function getOrCreateCart(userId) {
  let cart = await pool.query("SELECT * FROM carts WHERE user_id = $1", [
    userId,
  ]);

  if (cart.rows.length === 0) {
    cart = await pool.query(
      "INSERT INTO carts (user_id) VALUES ($1) RETURNING *",
      [userId]
    );
  }

  return cart.rows[0];
}

// GET /cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await getOrCreateCart(userId);

    const items = await pool.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE cart_id = $1`,
      [cart.id]
    );

    return res.json({
      cart_id: cart.id,
      items: items.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// POST /cart/items (add item)
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    const cart = await getOrCreateCart(userId);

    // check if product is already in cart
    const existing = await pool.query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cart.id, product_id]
    );

    if (existing.rows.length > 0) {
      // update quantity instead of inserting duplicate
      const updated = await pool.query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *",
        [quantity, existing.rows[0].id]
      );

      return res.json(updated.rows[0]);
    }

    const result = await pool.query(
      "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [cart.id, product_id, quantity]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// DELETE /cart (clear all items)
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);

    res.json({ message: "cart cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// PUT /cart/items/:id (update quantity)
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    const itemId = req.params.id;

    const cart = await getOrCreateCart(userId);

    const result = await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = $3 RETURNING *",
      [quantity, itemId, cart.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// DELETE /cart/items/:id
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const cart = await getOrCreateCart(userId);

    const result = await pool.query(
      "DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING *",
      [itemId, cart.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    return res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

module.exports = {
  getCart,
  addToCart,
  clearCart,
  updateCartItem,
  deleteCartItem,
};
