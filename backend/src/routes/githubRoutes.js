const express = require("express");
const router  = express.Router();

const { analyzeRepo, chatWithAI }        = require("../controllers/githubController");
const { handleWebhook }                  = require("../controllers/webhookController");
const { getPRHistory, getQueueStats }    = require("../controllers/dashboardController");

router.post("/analyze", analyzeRepo);
router.post("/chat",    chatWithAI);

router.get("/dashboard/history",     getPRHistory);
router.get("/dashboard/queue-stats", getQueueStats);

router.post(
    "/webhooks/github",
    express.raw({ type: "application/json" }),
    handleWebhook
);

module.exports = router;