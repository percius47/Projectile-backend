const express = require("express");
const AuthController = require("../controllers/AuthController");

const router = express.Router();

// Register a new user
router.post("/register", AuthController.register);

// Login
router.post("/login", AuthController.login);

// Password reset request
router.post("/forgot-password", AuthController.forgotPassword);

// Password reset
router.post("/reset-password", AuthController.resetPassword);

module.exports = router;
