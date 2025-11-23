const pool = require("../db/db");

// GET /products?category={categoryId}
const getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;

    let result;

    if (category) {
      result = await pool.query(
        "SELECT * FROM products WHERE category_id = $1",
        [category]
      );
    } else {
      result = await pool.query("SELECT * FROM products");
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /products/:id

const getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("server error");
  }
};

// POST /products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    const result = await pool.query(
      "INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description, price, stock]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// PUT /products/:id
const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, price, stock } = req.body;

    const result = await pool.query(
      `UPDATE products SET name = $1, description = $2, price = $3, stock = $4
        WHERE id = $5 RETURNING *`,
      [name, description, price, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.json(500).send("server error");
  }
};

// DELETE /products/:id
const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
