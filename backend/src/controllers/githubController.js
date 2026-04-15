const { getRepoData, getRepoContents } = require("../services/githubService");
const { analyzeStructure } = require("../services/analyzerService");
const { generateAIReview } = require("../services/aiService");

async function analyzeRepo(req, res) {
    try {
        const { repoUrl } = req.body;

        if (!repoUrl) {
            return res.status(400).json({
                error: "repoUrl is required"
            });
        }

        // Step 1: Get repo info
        const repoData = await getRepoData(repoUrl);

        // Step 2: Extract owner/repo
        const [owner, repo] = repoData.full_name.split("/");

        // Step 3: Get repo structure
        const files = await getRepoContents(owner, repo);

        // Step 4: Analyze structure
        const analysis = analyzeStructure(files);

// 🔥 Generate AI Review
const aiReview = await generateAIReview(
    {
        repo: repoData.full_name,
        stars: repoData.stargazers_count,
        language: repoData.language
    },
    analysis
);

        res.json({
    repo: repoData.full_name,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    language: repoData.language,
    ...analysis,
    aiReview
});

    } catch (error) {
    console.log("ERROR OCCURRED:", error);

    return res.status(500).json({
        error: error.message,
        stack: error.stack
    });

    }
}

module.exports = {
    analyzeRepo
};