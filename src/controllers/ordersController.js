const pool = require("../db/db");

async function createOrder(req, res) {
  try {
    const userId = req.user.id;

    //1. get user's cart
    const cart = await pool.query("SELECT * FROM carts WHERE user_id = $1", [
      userId,
    ]);

    if (cart.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const cartId = cart.rows[0].id;

    const items = await pool.query(
      "SELECT ci.product_id, ci.quantity, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = $1",
      [cartId]
    );

    if (items.rows.length === 0) {
      return res.status(400).json({ message: "cart has no items" });
    }

    // 2. calculate total
    let total = 0;
    items.rows.forEach((item) => {
      total += Number(item.price) * item.quantity;
    });

    total = Number(total.toFixed(2));

    // 3. insert into orders table
    const orderResult = await pool.query(
      "INSERT INTO orders (user_id, total, created_at) VALUES ($1, $2, NOW()) RETURNING *",
      [userId, total]
    );

    const order = orderResult.rows[0];

    // 4. insert each item into order_items table
    const insertItems = items.rows.map((item) =>
      pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.id, item.product_id, item.quantity, item.price]
      )
    );

    await Promise.all(insertItems);

    // 5. Clear user cart
    await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);

    return res.status(201).json({ message: "order created", order });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
}

async function getUserOrders(req, res) {
  try {
    const userId = req.user.id;

    // get all orders for user
    const ordersResult = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const orders = ordersResult.rows;

    // if no orders
    if (orders.length === 0) {
      return res.json([]);
    }

    // for each order, get all items
    const orderIds = orders.map((o) => o.id);

    const itemsResult = await pool.query(
      `SELECT order_id, product_id, quantity, price FROM order_items WHERE order_id = ANY($1)`,
      [orderIds]
    );

    const items = itemsResult.rows;

    // group items by order_id
    const orderMap = {};

    orders.forEach((order) => {
      orderMap[order.id] = {
        id: order.id,
        total: Number(order.total).toFixed(2),
        created_at: order.created_at,
        items: [],
      };
    });

    items.forEach((item) => {
      orderMap[item.order_id].items.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      });
    });

    // convert map into array
    const response = Object.values(orderMap);

    return res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
}

async function getOrderById(req, res) {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    // check if order exists and belongs to this user
    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "order not found" });
    }

    const order = orderResult.rows[0];

    // fetch items from this order
    const itemsResult = await pool.query(
      "SELECT product_id, quantity, price FROM order_items WHERE order_id = $1",
      [orderId]
    );

    const items = itemsResult.rows;

    // format total
    const formattedOrder = {
      id: order.id,
      total: Number(order.total),
      created_at: order.created_at,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    return res.json(formattedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
}

module.exports = { createOrder, getUserOrders, getOrderById };
