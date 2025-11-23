const pool = require("../db/db");
const bcrypt = require("bcrypt");

// GET users/:id
const getUser = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// PUT users/:id
const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, password } = req.body;

    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), password = COALESCE($3, password) WHERE id = $4 RETURNING id, name, email`,
      [name, email, hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// DELETE users/:id
const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "user deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

module.exports = {
  getUser,
  updateUser,
  deleteUser,
};
