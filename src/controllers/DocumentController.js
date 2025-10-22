const Document = require("../models/Document");
const path = require("path");
const fs = require("fs");

class DocumentController {
  static async uploadDocument(req, res) {
    try {
      const { entity_type, entity_id } = req.body;

      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
        });
      }

      if (!entity_type || !entity_id) {
        return res.status(400).json({
          message: "Entity type and ID are required",
        });
      }

      // Validate entity type
      const validEntityTypes = ["project", "rfq", "requirement", "quote"];
      if (!validEntityTypes.includes(entity_type)) {
        return res.status(400).json({
          message: "Invalid entity type",
        });
      }

      // Create document record
      const document = await Document.create({
        entity_type,
        entity_id: parseInt(entity_id),
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
      });

      res.status(201).json({
        message: "Document uploaded successfully",
        document,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async getDocumentsByEntity(req, res) {
    try {
      const { entity_type, entity_id } = req.params;

      // Validate entity type
      const validEntityTypes = ["project", "rfq", "requirement", "quote"];
      if (!validEntityTypes.includes(entity_type)) {
        return res.status(400).json({
          message: "Invalid entity type",
        });
      }

      const documents = await Document.findByEntity(entity_type, entity_id);

      res.json({
        message: "Documents retrieved successfully",
        documents,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async deleteDocument(req, res) {
    try {
      const { id } = req.params;

      // Check if document exists
      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      // Delete file from filesystem
      if (fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }

      // Delete document record
      await Document.delete(id);

      res.json({
        message: "Document deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  static async downloadDocument(req, res) {
    try {
      const { id } = req.params;

      // Check if document exists
      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      // Check if file exists
      if (!fs.existsSync(document.file_path)) {
        return res.status(404).json({
          message: "File not found",
        });
      }

      // Set headers for download
      res.setHeader("Content-Type", document.mime_type);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.original_name}"`
      );

      // Send file
      res.sendFile(path.resolve(document.file_path));
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
}

module.exports = DocumentController;
