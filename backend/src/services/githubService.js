const axios = require("axios");

// Extract owner and repo from GitHub URL
function parseGitHubUrl(url) {
    try {
        const cleaned = url.replace("https://github.com/", "");
        const [owner, repo] = cleaned.split("/");

        return { owner, repo };
    } catch (error) {
        return null;
    }
}

// Fetch repo details from GitHub API
async function getRepoData(url) {
    const parsed = parseGitHubUrl(url);

    if (!parsed) {
        throw new Error("Invalid GitHub URL");
    }

    const { owner, repo } = parsed;

    const repoResponse = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
        headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
        }
    }
);

    return repoResponse.data;
}

module.exports = {
    getRepoData,
    getRepoContents
};

async function getRepoContents(owner, repo, path = "") {

    let allFiles = [];

    try {

        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`
                }
            }
        );

        const files = response.data;

        for (const file of files) {

            if (file.type === "file") {

                allFiles.push({
                    name: file.name,
                    type: file.type,
                    path: file.path
                });

            }

            // 🔁 If folder → scan inside it

            if (file.type === "dir") {

                const nestedFiles =
                    await getRepoContents(
                        owner,
                        repo,
                        file.path
                    );

                allFiles = [
                    ...allFiles,
                    ...nestedFiles
                ];
            }
        }

    } catch (error) {

        console.log(
            "GitHub Fetch Error:",
            error.message
        );

    }

    return allFiles;
}