const Quote = require("../models/Quote");
const Rfq = require("../models/Rfq");
const User = require("../models/User");
const Project = require("../models/Project");

class QuoteController {
  static async createQuote(req, res) {
    try {
      const { rfq_id, vendor_id, total_amount, items } = req.body;

      // Validate required fields
      if (!rfq_id || !vendor_id || !total_amount) {
        return res.status(400).json({
          message: "RFQ ID, vendor ID, and total amount are required",
        });
      }

      // Check if RFQ exists
      const rfq = await Rfq.findById(rfq_id);
      if (!rfq) {
        return res.status(404).json({
          message: "RFQ not found",
        });
      }

      // For vendors, ensure the RFQ is open
      if (req.user.role === "vendor" && rfq.status !== "open") {
        return res.status(400).json({
          message: "Cannot submit quote for closed RFQ",
        });
      }

      // Check if user exists and has vendor role
      const user = await User.findById(vendor_id);
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

      // For vendors, check if they own this quote
      // For project owners, check if they own the RFQ
      if (req.user.role === "vendor" && user.id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this vendor account.",
        });
      }

      // Create quote
      const quote = await Quote.create({
        rfq_id,
        vendor_id,
        total_amount,
        status: "submitted",
      });

      // Get additional details for the response
      const rfqDetails = await Rfq.findById(rfq_id);
      const project = await Project.findById(rfqDetails.project_id);
      const vendor = await User.findById(vendor_id);

      // Create a detailed response
      const detailedQuote = {
        ...quote,
        project_details: project
          ? {
              id: project.id,
              custom_id: project.custom_id,
              name: project.name,
              description: project.description,
            }
          : null,
        rfq_details: rfqDetails
          ? {
              id: rfqDetails.id,
              custom_id: rfqDetails.custom_id,
              title: rfqDetails.title,
              description: rfqDetails.description,
            }
          : null,
        vendor_details: vendor
          ? {
              id: vendor.id,
              name: vendor.name,
              company_name: vendor.company_name,
              email: vendor.email,
              contact_person: vendor.contact_person,
              phone: vendor.phone,
              address: vendor.address,
              gst_number: vendor.gst_number,
            }
          : null,
      };

      res.status(201).json({
        message: "Quote created successfully",
        quote: detailedQuote,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getQuotesByRfqId(req, res) {
    try {
      const { rfq_id } = req.params;

      // Check if RFQ exists
      const rfq = await Rfq.findById(rfq_id);
      if (!rfq) {
        return res.status(404).json({
          message: "RFQ not found",
        });
      }

      // Check permissions based on user role
      const project = await Project.findById(rfq.project_id);

      // For vendors, check if they have submitted a quote for this RFQ
      if (req.user.role === "vendor") {
        const vendorQuotes = await Quote.findByRfqId(rfq_id);
        const hasQuote = vendorQuotes.some(
          (quote) => quote.vendor_id === req.user.id
        );

        if (!hasQuote) {
          return res.status(403).json({
            message:
              "Access denied. You have not submitted a quote for this RFQ.",
          });
        }
      }
      // For project owners, check if they own the project
      else if (req.user.role === "project_owner") {
        // If project doesn't exist or user is not the project owner, deny access
        if (!project || project.owner_id !== req.user.id) {
          return res.status(403).json({
            message: "Access denied. You do not own this project.",
          });
        }
      }
      // For others (including admins), allow access
      else if (req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Access denied. Only project owners, vendors who submitted quotes, and admins can view quotes.",
        });
      }

      const quotes = await Quote.findByRfqId(rfq_id);

      // Enhance quotes with vendor details
      const detailedQuotes = [];
      for (const quote of quotes) {
        const vendor = await User.findById(quote.vendor_id);
        detailedQuotes.push({
          ...quote,
          project_details: project
            ? {
                id: project.id,
                custom_id: project.custom_id,
                name: project.name,
                description: project.description,
              }
            : null,
          rfq_details: rfq
            ? {
                id: rfq.id,
                custom_id: rfq.custom_id,
                title: rfq.title,
                description: rfq.description,
              }
            : null,
          vendor_details: vendor
            ? {
                id: vendor.id,
                name: vendor.name,
                company_name: vendor.company_name,
                email: vendor.email,
                contact_person: vendor.contact_person,
                phone: vendor.phone,
                address: vendor.address,
                gst_number: vendor.gst_number,
              }
            : null,
        });
      }

      res.json({
        quotes: detailedQuotes,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getQuotesByVendorId(req, res) {
    try {
      const { vendor_id } = req.params;

      // Check if user exists and has vendor role
      const user = await User.findById(vendor_id);
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

      // Check if user is the owner of the vendor account or an admin
      if (req.user.role !== "admin" && user.id !== req.user.id) {
        return res.status(403).json({
          message: "Access denied. You do not own this vendor account.",
        });
      }

      const quotes = await Quote.findByVendorId(vendor_id);

      // Enhance quotes with project and RFQ details
      const detailedQuotes = [];
      for (const quote of quotes) {
        const rfq = await Rfq.findById(quote.rfq_id);
        const project = rfq ? await Project.findById(rfq.project_id) : null;
        detailedQuotes.push({
          ...quote,
          project_details: project
            ? {
                id: project.id,
                custom_id: project.custom_id,
                name: project.name,
                description: project.description,
              }
            : null,
          rfq_details: rfq
            ? {
                id: rfq.id,
                custom_id: rfq.custom_id,
                title: rfq.title,
                description: rfq.description,
              }
            : null,
          vendor_details: user
            ? {
                id: user.id,
                name: user.name,
                company_name: user.company_name,
                email: user.email,
                contact_person: user.contact_person,
                phone: user.phone,
                address: user.address,
                gst_number: user.gst_number,
              }
            : null,
        });
      }

      res.json({
        quotes: detailedQuotes,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getQuoteById(req, res) {
    try {
      const { id } = req.params;
      const quote = await Quote.findById(id);

      if (!quote) {
        return res.status(404).json({
          message: "Quote not found",
        });
      }

      // Get additional details
      const rfq = await Rfq.findById(quote.rfq_id);
      const project = rfq ? await Project.findById(rfq.project_id) : null;
      const vendor = await User.findById(quote.vendor_id);

      // Create detailed quote object
      const detailedQuote = {
        ...quote,
        project_details: project
          ? {
              id: project.id,
              custom_id: project.custom_id,
              name: project.name,
              description: project.description,
              owner_id: project.owner_id,
            }
          : null,
        rfq_details: rfq
          ? {
              id: rfq.id,
              custom_id: rfq.custom_id,
              title: rfq.title,
              description: rfq.description,
            }
          : null,
        vendor_details: vendor
          ? {
              id: vendor.id,
              name: vendor.name,
              company_name: vendor.company_name,
              email: vendor.email,
            }
          : null,
      };

      // Check permissions
      // Admins can access any quote
      if (req.user.role === "admin") {
        return res.json({ quote: detailedQuote });
      }

      // Vendors can access their own quotes
      if (req.user.role === "vendor" && quote.vendor_id === req.user.id) {
        return res.json({ quote: detailedQuote });
      }

      // Project owners can access quotes for their RFQs
      if (
        req.user.role === "project_owner" &&
        project &&
        project.owner_id === req.user.id
      ) {
        return res.json({ quote: detailedQuote });
      }

      return res.status(403).json({
        message:
          "Access denied. You do not have permission to view this quote.",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getAllQuotes(req, res) {
    try {
      // Only admins can get all quotes
      if (req.user.role !== "admin") {
        return res.status(403).json({
          message: "Access denied. Admin access required.",
        });
      }

      const quotes = await Quote.findAll();
      res.json({
        quotes,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async updateQuote(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if quote exists
      const existingQuote = await Quote.findById(id);
      if (!existingQuote) {
        return res.status(404).json({
          message: "Quote not found",
        });
      }

      // Check permissions
      // Admins can update any quote
      if (req.user.role !== "admin") {
        // Vendors can update their own quotes
        if (req.user.role === "vendor") {
          const user = await User.findById(existingQuote.vendor_id);
          if (!user || user.id !== req.user.id) {
            return res.status(403).json({
              message: "Access denied. You do not own this quote.",
            });
          }
        }
        // Project owners can update quotes for their RFQs
        else if (req.user.role === "project_owner") {
          // Get the RFQ for this quote
          const rfq = await Rfq.findById(existingQuote.rfq_id);
          if (!rfq) {
            return res.status(403).json({
              message: "Access denied. RFQ not found.",
            });
          }

          // Get the project for this RFQ
          const project = await Project.findById(rfq.project_id);
          if (!project || project.owner_id !== req.user.id) {
            return res.status(403).json({
              message: "Access denied. You do not own this project.",
            });
          }
        }
        // Other roles are not allowed
        else {
          return res.status(403).json({
            message:
              "Access denied. You do not have permission to update this quote.",
          });
        }
      }

      // Update quote
      const quote = await Quote.update(id, updateData);

      res.json({
        message: "Quote updated successfully",
        quote,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async deleteQuote(req, res) {
    try {
      const { id } = req.params;

      // Check if quote exists
      const existingQuote = await Quote.findById(id);
      if (!existingQuote) {
        return res.status(404).json({
          message: "Quote not found",
        });
      }

      // Check permissions
      // Admins can delete any quote
      if (req.user.role !== "admin") {
        // Vendors can delete their own quotes
        if (req.user.role === "vendor") {
          const user = await User.findById(existingQuote.vendor_id);
          if (!user || user.id !== req.user.id) {
            return res.status(403).json({
              message: "Access denied. You do not own this quote.",
            });
          }
        } else {
          return res.status(403).json({
            message:
              "Access denied. You do not have permission to delete this quote.",
          });
        }
      }

      // Delete quote
      await Quote.delete(id);

      res.json({
        message: "Quote deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
}

module.exports = QuoteController;
