const https = require("https");

async function generateAIReview(repoData, analysis) {
    const prompt = `You are an expert software engineer reviewing a GitHub repository.

Repository Info:
- Name: ${repoData.repo}
- Stars: ${repoData.stars}
- Primary Language: ${repoData.language}

Static Analysis:
- Project Type: ${analysis.projectType}
- Issues Found: ${analysis.issues.map(i => i.message).join(", ") || "None"}
- Strengths: ${analysis.strengths.join(", ") || "None"}
- Documentation Score: ${analysis.documentationScore}
- Structure Score: ${analysis.structureScore}
- Overall Score: ${analysis.overallScore}

Write a professional review in this format:

Summary:
What type of project this is in 2-3 sentences.

Key Issues:
List and explain the major problems found.

Suggestions:
Give 3-4 practical improvements.

Final Verdict:
Overall quality judgement in 1-2 sentences.`;

    const apiKey = process.env.GROQ_API_KEY;
    console.log("Groq Key loaded:", apiKey ? "YES - " + apiKey.slice(0, 10) + "..." : "NO - KEY MISSING");

    if (!apiKey) {
        return getFallbackReview(analysis);
    }

    try {
        const body = JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful senior software engineer who reviews GitHub repositories."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const aiText = await new Promise((resolve, reject) => {
            const options = {
                hostname: "api.groq.com",
                path: "/openai/v1/chat/completions",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Length": Buffer.byteLength(body)
                }
            };

            const req = https.request(options, (res) => {
                let data = "";
                res.on("data", chunk => { data += chunk; });
                res.on("end", () => {
                    try {
                        const parsed = JSON.parse(data);
                        console.log("Groq response status:", res.statusCode);
                        const text = parsed?.choices?.[0]?.message?.content;
                        if (text) {
                            resolve(text);
                        } else {
                            console.log("Groq returned no text:", data);
                            resolve(null);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on("error", reject);
            req.write(body);
            req.end();
        });

        if (aiText) return aiText;
        return getFallbackReview(analysis);

    } catch (error) {
        console.log("Groq API Error:", error.message);
        return getFallbackReview(analysis);
    }
}

function getFallbackReview(analysis) {
    return `
Summary:
This repository appears to be a ${analysis.projectType}. The automated analysis has completed successfully.

Key Issues:
${analysis.issues.length > 0
    ? analysis.issues.map(i => `- ${i.message}`).join("\n")
    : "- No major structural issues detected."
}

Suggestions:
- Ensure clear documentation is present in the README file.
- Organize files into logical folders for better maintainability.
- Add inline comments to improve code readability.
- Include setup and usage instructions for new contributors.

Final Verdict:
Based on static analysis, this project scores ${analysis.overallScore}/100 and is considered: ${analysis.summary}.
`;
}

async function chatAboutRepo(question, repoContext) {
    const apiKey = process.env.GROQ_API_KEY;

    const prompt = `You are an expert code reviewer who has just analyzed this GitHub repository.

Repository: ${repoContext.repo}
Language: ${repoContext.language}
Stars: ${repoContext.stars}
Project Type: ${repoContext.projectType}
Overall Score: ${repoContext.overallScore}/100
Documentation Score: ${repoContext.documentationScore}
Structure Score: ${repoContext.structureScore}
Code Quality Score: ${repoContext.codeScore}

Issues Found: ${repoContext.issues.join(", ") || "None"}
Strengths: ${repoContext.strengths.join(", ") || "None"}

Your previous AI review:
${repoContext.aiReview}

Now the user is asking: "${question}"

Answer helpfully and concisely based on the repository analysis above.`;

    try {
        const body = JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a helpful senior software engineer who reviews GitHub repositories. Keep answers concise and practical." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const answer = await new Promise((resolve, reject) => {
            const https = require("https");
            const options = {
                hostname: "api.groq.com",
                path: "/openai/v1/chat/completions",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Length": Buffer.byteLength(body)
                }
            };

            const req = https.request(options, (res) => {
                let data = "";
                res.on("data", chunk => { data += chunk; });
                res.on("end", () => {
                    try {
                        const parsed = JSON.parse(data);
                        const text = parsed?.choices?.[0]?.message?.content;
                        resolve(text || "I couldn't generate an answer. Please try again.");
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on("error", reject);
            req.write(body);
            req.end();
        });

        return answer;

    } catch (error) {
        console.log("Chat API Error:", error.message);
        return "Sorry, I couldn't answer that right now. Please try again.";
    }
}

module.exports = { generateAIReview, chatAboutRepo };