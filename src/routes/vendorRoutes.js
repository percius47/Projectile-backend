const express = require("express");
const VendorController = require("../controllers/VendorController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Vendor routes
router.post("/", VendorController.createVendor);
router.get("/", authorizeRoles(["admin"]), VendorController.getAllVendors);
router.get("/:id", VendorController.getVendorById);
router.get("/user/:user_id", VendorController.getVendorByUserId);
router.put("/:id", authorizeRoles(["admin"]), VendorController.updateVendor);
router.delete("/:id", authorizeRoles(["admin"]), VendorController.deleteVendor);

module.exports = router;
