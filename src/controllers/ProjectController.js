const Project = require("../models/Project");

class ProjectController {
  static async createProject(req, res) {
    try {
      const { name, description, location, deadline } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          message: "Project name is required",
        });
      }

      // Create project
      const project = await Project.create({
        name,
        description,
        location,
        deadline,
        owner_id: req.user.id,
      });

      res.status(201).json({
        message: "Project created successfully",
        project,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getProjects(req, res) {
    try {
      const projects = await Project.findByOwnerId(req.user.id);
      res.json({
        projects,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      // Check if user is the owner of the project
      if (project.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      res.json({
        project,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if project exists and user is the owner
      const existingProject = await Project.findById(id);
      if (!existingProject) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (existingProject.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      // Update project
      const project = await Project.update(id, updateData);

      res.json({
        message: "Project updated successfully",
        project,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async deleteProject(req, res) {
    try {
      const { id } = req.params;

      // Check if project exists and user is the owner
      const existingProject = await Project.findById(id);
      if (!existingProject) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (existingProject.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      // Delete project
      await Project.delete(id);

      res.json({
        message: "Project deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
}

module.exports = ProjectController;
