const express = require("express");
const RequirementController = require("../controllers/RequirementController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Requirement routes
router.post("/", RequirementController.addRequirement);
router.get("/project/:project_id", RequirementController.getRequirements);
router.put("/:id", RequirementController.updateRequirement);
router.delete("/:id", RequirementController.deleteRequirement);

module.exports = router;
