const express = require("express");
const UserController = require("../controllers/UserController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// User routes
router.get("/:id", UserController.getUserById);
router.put("/:id", UserController.updateUser);

module.exports = router;
