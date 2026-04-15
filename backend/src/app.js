const cors = require("cors");
const express = require("express");

const githubRoutes = require("./routes/githubRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://smart-code-review-platform.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Smart Code Review Backend is running 🚀"
  });
});

app.use("/api/github", githubRoutes);

module.exports = app;