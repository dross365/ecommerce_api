const express = require("express");
const router = express.Router();

const {
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");

router.get("/:id", getUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

module.exports = router;
