const express = require("express");
const RfqController = require("../controllers/RfqController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// RFQ routes
router.post("/", RfqController.createRfq);
router.get("/", RfqController.getAllRfqs);
router.get("/closed", RfqController.getClosedRfqs);
router.get("/project/:project_id", RfqController.getRfqsByProjectId);
router.get(
  "/project/:project_id/closed",
  RfqController.getClosedRfqsByProjectId
); // Add this line
router.get("/:id", RfqController.getRfqById);
router.put("/:id", RfqController.updateRfq);
router.delete("/:id", RfqController.deleteRfq);

module.exports = router;
