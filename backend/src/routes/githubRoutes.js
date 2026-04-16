const express = require("express");
const router = express.Router();

const { analyzeRepo } = require("../controllers/githubController");

// router.post("/analyze", analyzeRepo);

router.post("/analyze", analyzeRepo);

module.exports = router;