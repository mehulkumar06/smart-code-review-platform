const express = require("express");
const router = express.Router();

const { analyzeRepo, chatWithAI } = require("../controllers/githubController");
const { handleWebhook } = require("../controllers/webhookController");

router.post("/analyze", analyzeRepo);
router.post("/chat", chatWithAI);

// Raw body needed for webhook signature verification
router.post(
  "/webhooks/github",
  express.raw({ type: "application/json" }),
  handleWebhook
);

module.exports = router;