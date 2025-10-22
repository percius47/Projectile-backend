const Vendor = require("../models/Vendor");
const User = require("../models/User");

class VendorController {
  static async createVendor(req, res) {
    try {
      const {
        user_id,
        company_name,
        contact_person,
        phone,
        email,
        address,
        gst_number,
      } = req.body;

      // Validate required fields
      if (!user_id || !company_name) {
        return res.status(400).json({
          message: "User ID and company name are required",
        });
      }

      // Check if user exists and has vendor role
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (user.role !== "vendor") {
        return res.status(400).json({
          message: "User must have vendor role",
        });
      }

      // Check if the authenticated user is allowed to create this vendor profile
      if (req.user.id !== user_id && req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Access denied. You can only create a vendor profile for yourself.",
        });
      }

      // Check if vendor already exists for this user
      const existingVendor = await Vendor.findByUserId(user_id);
      if (existingVendor) {
        return res.status(400).json({
          message: "Vendor profile already exists for this user",
        });
      }

      // Create vendor
      const vendor = await Vendor.create({
        user_id,
        company_name,
        contact_person,
        phone,
        email,
        address,
        gst_number,
      });

      res.status(201).json({
        message: "Vendor created successfully",
        vendor,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getVendorById(req, res) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findById(id);

      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found",
        });
      }

      res.json({
        vendor,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getVendorByUserId(req, res) {
    try {
      const { user_id } = req.params;
      const vendor = await Vendor.findByUserId(user_id);

      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found",
        });
      }

      res.json({
        vendor,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getAllVendors(req, res) {
    try {
      const vendors = await Vendor.findAll();
      res.json({
        vendors,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async updateVendor(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if vendor exists
      const existingVendor = await Vendor.findById(id);
      if (!existingVendor) {
        return res.status(404).json({
          message: "Vendor not found",
        });
      }

      // Update vendor
      const vendor = await Vendor.update(id, updateData);

      res.json({
        message: "Vendor updated successfully",
        vendor,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async deleteVendor(req, res) {
    try {
      const { id } = req.params;

      // Check if vendor exists
      const existingVendor = await Vendor.findById(id);
      if (!existingVendor) {
        return res.status(404).json({
          message: "Vendor not found",
        });
      }

      // Delete vendor
      const vendor = await Vendor.delete(id);

      res.json({
        message: "Vendor deleted successfully",
        vendor,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
}

module.exports = VendorController;
