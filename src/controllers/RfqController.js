const Rfq = require("../models/Rfq");
const Project = require("../models/Project");

class RfqController {
  static async createRfq(req, res) {
    try {
      const {
        project_id,
        title,
        description,
        deadline,
        contact_person,
        contact_email,
        contact_phone,
        special_requirements,
      } = req.body;

      // Validate required fields
      if (!project_id || !title || !deadline) {
        return res.status(400).json({
          message: "Project ID, title, and deadline are required",
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

      // Create RFQ
      const rfq = await Rfq.create({
        project_id,
        title,
        description,
        deadline,
        contact_person,
        contact_email,
        contact_phone,
        special_requirements,
      });

      res.status(201).json({
        message: "RFQ created successfully",
        rfq,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getRfqsByProjectId(req, res) {
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

      const rfqs = await Rfq.findByProjectId(project_id);
      res.json({
        rfqs,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getRfqById(req, res) {
    try {
      const { id } = req.params;
      const rfq = await Rfq.findById(id);

      if (!rfq) {
        return res.status(404).json({
          message: "RFQ not found",
        });
      }

      // Allow vendors to access any open RFQ
      if (req.user.role === "vendor" && rfq.status === "open") {
        return res.json({
          rfq,
        });
      }

      // Allow vendors to access any RFQ they have participated in (submitted a quote for)
      if (req.user.role === "vendor") {
        // Check if vendor has submitted a quote for this RFQ
        const Quote = require("../models/Quote");

        // Since vendor functionality is integrated into User model,
        // the user ID is the vendor ID
        const vendorId = req.user.id;

        const vendorQuotes = await Quote.findByRfqId(rfq.id);
        const hasQuote = vendorQuotes.some(
          (quote) => quote.vendor_id === vendorId
        );

        if (hasQuote) {
          return res.json({
            rfq,
          });
        }
      }

      // Allow admins to access any RFQ
      if (req.user.role === "admin") {
        return res.json({
          rfq,
        });
      }

      // Check if user is the owner of the project
      const project = await Project.findById(rfq.project_id);
      if (
        req.user.role === "project_owner" &&
        project &&
        project.owner_id === req.user.id
      ) {
        return res.json({
          rfq,
        });
      }

      return res.status(403).json({
        message: "Access denied. You do not have permission to view this RFQ.",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getAllRfqs(req, res) {
    try {
      // Admins can get all RFQs
      if (req.user.role === "admin") {
        const rfqs = await Rfq.findAll();
        return res.json({
          rfqs,
        });
      }

      // Vendors can see all open RFQs and RFQs they have participated in
      if (req.user.role === "vendor") {
        // Get all open RFQs
        const openRfqs = await Rfq.findOpenRfqs();

        // Get RFQs the vendor has submitted quotes for
        const Quote = require("../models/Quote");
        const vendorQuotes = await Quote.findByVendorId(req.user.id);
        const vendorRfqIds = vendorQuotes.map((quote) => quote.rfq_id);

        // Get the RFQ details for those RFQs
        const vendorRfqs = [];
        for (const rfqId of vendorRfqIds) {
          const rfq = await Rfq.findById(rfqId);
          if (rfq && !vendorRfqs.some((r) => r.id === rfq.id)) {
            vendorRfqs.push(rfq);
          }
        }

        // Combine open RFQs and vendor's RFQs, removing duplicates
        const allRfqs = [...openRfqs];
        vendorRfqs.forEach((vendorRfq) => {
          if (!allRfqs.some((rfq) => rfq.id === vendorRfq.id)) {
            allRfqs.push(vendorRfq);
          }
        });

        return res.json({
          rfqs: allRfqs,
        });
      }

      // Project owners don't have access to this endpoint
      return res.status(403).json({
        message:
          "Access denied. Only vendors and admins can access this endpoint.",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getClosedRfqs(req, res) {
    try {
      // Only vendors can access this endpoint
      if (req.user.role !== "vendor") {
        return res.status(403).json({
          message: "Access denied. Vendor access required.",
        });
      }

      // Get all closed RFQs
      const allClosedRfqs = await Rfq.findClosedRfqs();

      // Filter to only include RFQs the vendor has participated in
      const Quote = require("../models/Quote");
      const vendorQuotes = await Quote.findByVendorId(req.user.id);
      const vendorRfqIds = vendorQuotes.map((quote) => quote.rfq_id);

      const vendorClosedRfqs = allClosedRfqs.filter((rfq) =>
        vendorRfqIds.includes(rfq.id)
      );

      return res.json({
        rfqs: vendorClosedRfqs,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getClosedRfqsByProjectId(req, res) {
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

      // Get closed RFQs for this project
      const closedRfqs = await Rfq.findClosedRfqsByProjectId(project_id);

      return res.json({
        rfqs: closedRfqs,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async updateRfq(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if RFQ exists
      const existingRfq = await Rfq.findById(id);
      if (!existingRfq) {
        return res.status(404).json({
          message: "RFQ not found",
        });
      }

      // Check if user is the owner of the project
      const project = await Project.findById(existingRfq.project_id);
      if (!project || project.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      // Update RFQ
      const rfq = await Rfq.update(id, updateData);

      res.json({
        message: "RFQ updated successfully",
        rfq,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async deleteRfq(req, res) {
    try {
      const { id } = req.params;

      // Check if RFQ exists
      const existingRfq = await Rfq.findById(id);
      if (!existingRfq) {
        return res.status(404).json({
          message: "RFQ not found",
        });
      }

      // Check if user is the owner of the project
      const project = await Project.findById(existingRfq.project_id);
      if (!project || project.owner_id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this project.",
        });
      }

      // Delete RFQ
      await Rfq.delete(id);

      res.json({
        message: "RFQ deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
}

module.exports = RfqController;
