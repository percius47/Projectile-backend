const Requirement = require("../models/Requirement");
const Project = require("../models/Project");

class RequirementController {
  static async addRequirement(req, res) {
    try {
      const {
        project_id,
        item_name,
        description,
        quantity,
        unit,
        rate,
        category,
      } = req.body;

      // Validate required fields
      if (!project_id || !item_name || !quantity || !unit) {
        return res.status(400).json({
          message: "Project ID, item name, quantity, and unit are required",
        });
      }

      // Check if project exists and user is the owner
      const project = await Project.findById(project_id);
      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (project.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      // Create requirement
      const requirement = await Requirement.create({
        project_id,
        item_name,
        description,
        quantity,
        unit,
        rate,
        category,
      });

      res.status(201).json({
        message: "Requirement added successfully",
        requirement,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getRequirements(req, res) {
    try {
      const { project_id } = req.params;

      // Check if project exists and user is the owner
      const project = await Project.findById(project_id);
      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (project.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      const requirements = await Requirement.findByProjectId(project_id);
      res.json({
        requirements,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async updateRequirement(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if requirement exists
      const existingRequirement = await Requirement.findById(id);
      if (!existingRequirement) {
        return res.status(404).json({
          message: "Requirement not found",
        });
      }

      // Check if user is the owner of the project
      const project = await Project.findById(existingRequirement.project_id);
      if (!project || project.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      // Update requirement
      const requirement = await Requirement.update(id, updateData);

      res.json({
        message: "Requirement updated successfully",
        requirement,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async deleteRequirement(req, res) {
    try {
      const { id } = req.params;

      // Check if requirement exists
      const existingRequirement = await Requirement.findById(id);
      if (!existingRequirement) {
        return res.status(404).json({
          message: "Requirement not found",
        });
      }

      // Check if user is the owner of the project
      const project = await Project.findById(existingRequirement.project_id);
      if (!project || project.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      // Delete requirement
      await Requirement.delete(id);

      res.json({
        message: "Requirement deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
}

module.exports = RequirementController;
