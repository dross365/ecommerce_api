const express = require("express");
const passport = require("passport");
const router = express.Router();
const { registerUser } = require("../controllers/authController");

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Logged in successfully", user: req.user });
});

module.exports = router;
