const express = require("express");
const cors    = require("cors");

const githubRoutes = require("./routes/githubRoutes");

const app = express();

app.use(cors());

// Regular JSON parsing for all routes EXCEPT webhooks
// Webhooks need raw body for signature verification
app.use((req, res, next) => {
    if (req.path === "/api/github/webhooks/github") {
        next(); // skip — handled by raw parser in the route
    } else {
        express.json()(req, res, next);
    }
});

app.use("/api/github", githubRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

module.exports = app;
// dashboard score test
