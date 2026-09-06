const express = require("express");
const cors = require("cors");
const analyticsRoutes = require("./routes/analytics");
const { errorHandler } = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();
const allowedOrigins = [
	"http://localhost:5174",
	process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
			return callback(new Error("Origin is not allowed by CORS"));
		},
	})
);
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use("/analytics", analyticsRoutes);
app.use("/", analyticsRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
