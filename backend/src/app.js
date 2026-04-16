const express = require("express");
const cors = require("cors");   // ADD THIS

const githubRoutes = require("./routes/githubRoutes");

const app = express();

app.use(cors());                // ADD THIS
app.use(express.json());

app.use("/api/github", githubRoutes);

module.exports = app;