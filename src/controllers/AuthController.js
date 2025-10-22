const AuthService = require("../services/AuthService");
const User = require("../models/User");
const crypto = require("crypto");

class AuthController {
  static async register(req, res) {
    try {
      const {
        name,
        email,
        password,
        role,
        company_name,
        contact_person,
        phone,
        address,
        gst_number,
      } = req.body;

      // Validate required fields
      if (!name || name.trim() === "") {
        return res.status(400).json({
          message: "Name is required",
        });
      }

      if (!email || email.trim() === "") {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      if (!password || password.trim() === "") {
        return res.status(400).json({
          message: "Password is required",
        });
      }

      if (!role || role.trim() === "") {
        return res.status(400).json({
          message: "Role is required",
        });
      }

      // Validate role
      const validRoles = ["project_owner", "vendor", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Must be one of: project_owner, vendor, admin",
        });
      }

      // Validate business details (now required for all users)
      if (!company_name || company_name.trim() === "") {
        return res.status(400).json({
          message: "Company name is required",
        });
      }

      if (!contact_person || contact_person.trim() === "") {
        return res.status(400).json({
          message: "Contact person is required",
        });
      }

      if (!gst_number || gst_number.trim() === "") {
        return res.status(400).json({
          message: "GST number is required",
        });
      }

      const result = await AuthService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        company_name: company_name.trim(),
        contact_person: contact_person.trim(),
        phone: phone ? phone.trim() : undefined,
        address: address ? address.trim() : undefined,
        gst_number: gst_number.trim(),
      });

      res.status(201).json({
        message: "User registered successfully",
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({
        message: error.message,
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const result = await AuthService.login(email, password);

      res.json({
        message: "Login successful",
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({
        message: error.message,
      });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        // For security reasons, we don't reveal if the email exists
        return res.status(200).json({
          message:
            "If your email exists in our system, you will receive a password reset link shortly.",
        });
      }

      // Generate reset token (in a real app, you would send an email)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

      // Save token and expiry to user (in a real app, you would save this to a separate table)
      await User.update(user.id, {
        reset_token: resetToken,
        reset_token_expiry: new Date(resetTokenExpiry),
      });

      // In a real application, you would send an email with the reset link
      // For now, we'll just return the token in the response for testing
      res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link shortly.",
        resetToken: resetToken, // Remove this in production
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "An error occurred while processing your request",
      });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          message: "Token and new password are required",
        });
      }

      // Find user with this reset token
      const user = await User.findByResetToken(token);

      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired reset token",
        });
      }

      // Check if token is expired
      if (user.reset_token_expiry < new Date()) {
        return res.status(400).json({
          message: "Reset token has expired",
        });
      }

      // Update password
      await User.updatePassword(user.id, newPassword);

      // Clear reset token
      await User.update(user.id, {
        reset_token: null,
        reset_token_expiry: null,
      });

      res.status(200).json({
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        message: "An error occurred while resetting your password",
      });
    }
  }
}

module.exports = AuthController;
