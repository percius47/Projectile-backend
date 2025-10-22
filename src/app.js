const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Create Express app
const app = express();

// Configure CORS for production and development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3002",
      "http://192.168.0.101:3000",
      "http://192.168.0.101:3002",
      // Add your production frontend URL here
      process.env.FRONTEND_URL, // For Render deployment
    ];
    
    // Check if the origin is in our allowed list or if it's undefined
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE"],
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Cross-origin resource sharing
app.use(morgan("combined")); // Logging
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies with size limit

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const requirementRoutes = require("./routes/requirementRoutes");
app.use("/api/requirements", requirementRoutes);

const rfqRoutes = require("./routes/rfqRoutes");
app.use("/api/rfqs", rfqRoutes);

const quoteRoutes = require("./routes/quoteRoutes");
app.use("/api/quotes", quoteRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const documentRoutes = require("./routes/documentRoutes");
app.use("/api/documents", documentRoutes);

// Serve static files (for uploaded documents)
app.use("/uploads", express.static("src/uploads"));

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