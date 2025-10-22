const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");

// Load environment variables
dotenv.config();

// Create Express app
const app = require("./src/app");

// Use PORT from environment variable or default to 3001
const PORT = process.env.PORT || 3001;

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server on all network interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
  console.log(
    `Access the API from network devices at http://YOUR_NETWORK_IP:${PORT}`
  );
  console.log(`Health check endpoint: http://localhost:${PORT}/health`);
});

module.exports = app;
