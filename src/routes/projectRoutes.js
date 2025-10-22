const express = require("express");
const ProjectController = require("../controllers/ProjectController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Project routes
router.post("/", ProjectController.createProject);
router.get("/", ProjectController.getProjects);
router.get("/:id", ProjectController.getProjectById);
router.put("/:id", ProjectController.updateProject);
router.delete("/:id", ProjectController.deleteProject);

module.exports = router;
