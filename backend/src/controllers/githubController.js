const { getRepoData, getRepoContents } = require("../services/githubService");
const { analyzeStructure } = require("../services/analyzerService");
const { generateAIReview, chatAboutRepo } = require("../services/aiService");

async function analyzeRepo(req, res) {
    try {
        const { repoUrl } = req.body;

        if (!repoUrl) {
            return res.status(400).json({ error: "repoUrl is required" });
        }

        const repoData = await getRepoData(repoUrl);
        const [owner, repo] = repoData.full_name.split("/");
        const files = await getRepoContents(owner, repo);
        const analysis = analyzeStructure(files);

        const aiReview = await generateAIReview(
            {
                repo: repoData.full_name,
                stars: repoData.stargazers_count,
                language: repoData.language,
            },
            analysis
        );

        res.json({
            repo: repoData.full_name,
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            language: repoData.language,
            ...analysis,
            aiReview,
        });

    } catch (error) {
        console.log("ERROR OCCURRED:", error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}

async function chatWithAI(req, res) {
    try {
        const { question, repoContext } = req.body;

        if (!question || !repoContext) {
            return res.status(400).json({ error: "question and repoContext are required" });
        }

        const answer = await chatAboutRepo(question, repoContext);
        res.json({ answer });

    } catch (error) {
        console.log("CHAT ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { analyzeRepo, chatWithAI };