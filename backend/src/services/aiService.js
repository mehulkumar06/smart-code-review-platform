const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateAIReview(repoData, analysis) {
    const prompt = `
You are an expert software engineer and data analyst reviewing a GitHub repository.

Repository Info:
- Name: ${repoData.repo}
- Stars: ${repoData.stars}
- Primary Language: ${repoData.language}

Static Analysis:
- Score: ${analysis.score}
- Detected Project Type: ${analysis.projectType}
- Issues: ${analysis.issues
.map(i => i.message)
.join(", ")}
- Strengths: ${analysis.strengths.join(", ") || "None"}

Task:
Write a professional GitHub repository review.

Adapt your review depending on project type:
- If Python → focus on scripts and modularity
- If Data project → focus on datasets and workflow
- If Web app → focus on folder structure and dependencies

Output format:

Summary:
Explain what type of project this is.

Key Issues:
Explain major problems clearly.

Suggestions:
Give practical improvements.

Final Verdict:
Give an overall quality judgement.
`;

    let aiText;

try {

    const response =
        await openai.chat.completions.create({

        model: "gpt-4o-mini",

        messages: [
            {
                role: "system",
                content:
                "You are a helpful senior software engineer."
            },
            {
                role: "user",
                content: prompt
            }
        ],

        temperature: 0.7,
    });

    aiText =
        response.choices?.[0]?.message?.content;

} catch (error) {

    console.log("OpenAI Error:", error.message);

    // 🧠 Smart fallback review

    aiText = `
Summary:
This repository appears to be a ${analysis.projectType}.

Key Issues:
${
analysis.issues.length > 0
? analysis.issues.join(", ")
: "No major structural issues detected."
}

Suggestions:
- Ensure clear documentation in README
- Organize files into logical folders
- Add comments to improve readability
- Include setup or usage instructions

Final Verdict:
Based on static analysis, this project is considered:
${analysis.summary}.
`;
}

//catch (error) {

   // console.log("OpenAI Error:", error.message);

   // aiText =
      //  "AI review unavailable due to API limits.";

//} ADD THIS WHEN YOU HAVE OPENAI PREMIUM
return aiText;
}

module.exports = {
    generateAIReview
};