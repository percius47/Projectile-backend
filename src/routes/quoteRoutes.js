const express = require("express");
const QuoteController = require("../controllers/QuoteController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Quote routes
router.post("/", QuoteController.createQuote);
router.get("/", authorizeRoles(["admin"]), QuoteController.getAllQuotes);
router.get("/rfq/:rfq_id", QuoteController.getQuotesByRfqId);
router.get("/vendor/:vendor_id", QuoteController.getQuotesByVendorId);
router.get("/:id", QuoteController.getQuoteById);
router.put("/:id", QuoteController.updateQuote);
router.delete("/:id", QuoteController.deleteQuote);

module.exports = router;
