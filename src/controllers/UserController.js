const User = require("../models/User");

class UserController {
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      // Check if user is requesting their own profile or is admin
      if (req.user.id != id && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Access denied. You can only view your own profile.",
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.json({
        message: "User retrieved successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if user is updating their own profile or is admin
      if (req.user.id != id && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Access denied. You can only update your own profile.",
        });
      }

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Update user
      const user = await User.update(id, updateData);

      res.json({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
}

module.exports = UserController;
