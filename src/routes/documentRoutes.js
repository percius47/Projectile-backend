const express = require("express");
const DocumentController = require("../controllers/DocumentController");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Document routes
// NOTE: Order matters! More specific routes should come before general ones
router.get("/download/:id", DocumentController.downloadDocument);
router.get("/:entity_type/:entity_id", DocumentController.getDocumentsByEntity);
router.post(
  "/upload",
  upload.single("file"),
  DocumentController.uploadDocument
);
router.delete("/:id", DocumentController.deleteDocument);

module.exports = router;
