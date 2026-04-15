const express = require("express");
const cors = require("cors");

const githubRoutes = require("./routes/githubRoutes");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://smart-code-review-platform.vercel.app"
  ]
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Smart Code Review Backend is running 🚀"
    });
});

app.use("/api/github", githubRoutes);

module.exports = app;