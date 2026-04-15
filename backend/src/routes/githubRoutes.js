app.use(cors());

const express = require("express");
const router = express.Router();

const { analyzeRepo } = require("../controllers/githubController");

// router.post("/analyze", analyzeRepo);

router.post("/analyze", (req, res) => {
  res.json({
    ok: true,
    message: "Backend route is working"
  });
});

module.exports = router;