const cors = require("cors");
const express = require("express");

const githubRoutes = require("./routes/githubRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://smart-code-review-platform.vercel.app",
  "https://smart-code-review-platform-55hglh2s9-mehulkumar06s-projects.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow Postman / server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true); // TEMP: allow all (debug mode)
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 🔥 IMPORTANT FIX (THIS IS THE KEY)
app.options("*", cors({
  origin: allowedOrigins
}));

app.get("/", (req, res) => {
  res.json({
    message: "Smart Code Review Backend is running 🚀"
  });
});

app.use("/api/github", githubRoutes);

module.exports = app;