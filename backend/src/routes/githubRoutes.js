const express = require("express");
const router = express.Router();

const { analyzeRepo, chatWithAI } = require("../controllers/githubController");

router.post("/analyze", analyzeRepo);
router.post("/chat", chatWithAI);

module.exports = router;