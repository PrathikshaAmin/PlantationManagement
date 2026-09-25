require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const farmerRoutes = require("./routes/farmerRoutes");
const plantationRoutes = require("./routes/plantationRoutes");
const imageRoutes = require("./routes/imageRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Static file serving for uploaded plantation images
app.use("/uploads", express.static("uploads"));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/plantations", plantationRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 + error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
