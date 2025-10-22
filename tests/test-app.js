const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin resource sharing
app.use(morgan("combined")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
const authRoutes = require("../src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const projectRoutes = require("../src/routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const requirementRoutes = require("../src/routes/requirementRoutes");
app.use("/api/requirements", requirementRoutes);

const vendorRoutes = require("../src/routes/vendorRoutes");
app.use("/api/vendors", vendorRoutes);

const rfqRoutes = require("../src/routes/rfqRoutes");
app.use("/api/rfqs", rfqRoutes);

const quoteRoutes = require("../src/routes/quoteRoutes");
app.use("/api/quotes", quoteRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Projectile API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
