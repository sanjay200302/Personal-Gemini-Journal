const express = require("express");
const cors = require("cors");
const journalRoutes = require("./routes/journal");
const { errorHandler } = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use("/journal", journalRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
