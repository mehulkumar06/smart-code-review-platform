const cors = require("cors");
const express = require("express");

const githubRoutes = require("./routes/githubRoutes");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://smart-code-review-platform.vercel.app",
    "https://smart-code-review-platform-55hglh2s9-mehulkumar06s-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.options("*", cors());

app.get("/", (req, res) => {
    res.json({
        message: "Smart Code Review Backend is running 🚀"
    });
});

app.use("/api/github", githubRoutes);

module.exports = app;