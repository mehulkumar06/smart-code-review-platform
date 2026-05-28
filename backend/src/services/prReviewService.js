const { App } = require("@octokit/app");
const { Octokit } = require("@octokit/core");
const { restEndpointMethods } = require("@octokit/plugin-rest-endpoint-methods");

const MyOctokit = Octokit.plugin(restEndpointMethods);

function getGitHubApp() {
    const privateKey = process.env.GITHUB_PRIVATE_KEY
        ?.replace(/\\n/g, "\n");

    if (!process.env.GITHUB_APP_ID || !privateKey) {
        throw new Error("GITHUB_APP_ID or GITHUB_PRIVATE_KEY not set");
    }

    return new App({
        appId:      process.env.GITHUB_APP_ID,
        privateKey: privateKey,
        webhooks: {
            secret: process.env.GITHUB_WEBHOOK_SECRET
        },
        Octokit: MyOctokit,
    });
}

async function processPullRequest(payload) {
    const {
        pull_request: pr,
        repository:   repo,
        installation
    } = payload;

    const owner     = repo.owner.login;
    const repoName  = repo.name;
    const prNumber  = pr.number;
    const installId = installation.id;
    const headSha   = pr.head.sha;

    console.log(`\n🔍 Processing PR #${prNumber} in ${owner}/${repoName}`);

    const app     = getGitHubApp();
    const octokit = await app.getInstallationOctokit(installId);

    console.log("   Octokit keys:", Object.keys(octokit).join(", "));

    try {
        const checkRun = await createCheckRun(octokit, owner, repoName, headSha);
        console.log(`   ✅ Check run created: ${checkRun.data.id}`);

        const files = await getChangedFiles(octokit, owner, repoName, prNumber);
        console.log(`   📄 Changed files: ${files.length}`);

        if (files.length === 0) {
            await completeCheckRun(
                octokit, owner, repoName, checkRun.data.id,
                "success", 100, "No code files changed", "Nothing to review."
            );
            return { score: 100, issues: [], summary: "No code files changed.", passed: true };
        }

        const analysis = await analyzeChangedFiles(files, pr, repo);
        console.log(`   🧠 Score: ${analysis.score}`);

        await postPRComment(octokit, owner, repoName, prNumber, analysis);
        console.log(`   💬 Comment posted`);

        const passed = analysis.score >= 60;
        await completeCheckRun(
            octokit, owner, repoName, checkRun.data.id,
            passed ? "success" : "failure",
            analysis.score,
            passed
                ? `✅ Score: ${analysis.score}/100`
                : `❌ Score: ${analysis.score}/100 — below threshold`,
            analysis.summary
        );
        console.log(`   ${passed ? "✅ PASSED" : "❌ FAILED"}`);

        // ── Return for BullMQ job result storage ──────────────────
        return {
            score:    analysis.score,
            issues:   analysis.issues,
            summary:  analysis.summary,
            passed,
        };

    } catch (err) {
        console.error("PR review failed:", err.message);
        console.error(err.stack);
    }
}

async function createCheckRun(octokit, owner, repo, headSha) {
    const api = octokit.rest || octokit;
    return api.checks.create({
        owner,
        repo,
        name:       "CodeReview AI",
        head_sha:   headSha,
        status:     "in_progress",
        started_at: new Date().toISOString(),
    });
}

async function completeCheckRun(
    octokit, owner, repo, checkRunId,
    conclusion, score, title, summary
) {
    const api = octokit.rest || octokit;
    return api.checks.update({
        owner,
        repo,
        check_run_id: checkRunId,
        status:       "completed",
        conclusion,
        completed_at: new Date().toISOString(),
        output: { title, summary, text: `**Score:** ${score}/100\n\n${summary}` },
    });
}

async function getChangedFiles(octokit, owner, repo, prNumber) {
    const api = octokit.rest || octokit;
    const { data: files } = await api.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page:    100,
    });

    const codeExtensions = [
        ".js", ".ts", ".jsx", ".tsx", ".py",
        ".java", ".go", ".rs", ".cpp", ".c",
        ".cs", ".php", ".rb", ".swift", ".kt", ".md"
    ];

    return files.filter(f =>
        f.status !== "removed" &&
        codeExtensions.some(ext => f.filename.endsWith(ext))
    );
}

async function analyzeChangedFiles(files, pr, repo) {
    const apiKey = process.env.GROQ_API_KEY;

    const filesSummary = files
        .slice(0, 10)
        .map(f =>
            `File: ${f.filename}\n` +
            `Status: ${f.status}\n` +
            `Changes: +${f.additions} -${f.deletions}\n` +
            `Patch:\n${(f.patch || "").slice(0, 500)}`
        )
        .join("\n\n---\n\n");

    const prompt = `You are a senior code reviewer. Review this Pull Request.

PR Title: ${pr.title}
PR Description: ${pr.body || "No description"}
Repository: ${repo.full_name}
Files changed: ${files.length}

Changed files:
${filesSummary}

Respond ONLY with valid JSON, no extra text:
{
  "score": <0-100>,
  "summary": "<2-3 sentences>",
  "issues": [{"severity":"high|medium|low","file":"<name>","message":"<issue>","suggestion":"<fix>"}],
  "strengths": ["<strength>"],
  "recommendation": "approve|request_changes|comment"
}`;

    const body = JSON.stringify({
        model:    "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: "You are a senior software engineer. Always respond with valid JSON only." },
            { role: "user",   content: prompt }
        ],
        temperature: 0.3,
        max_tokens:  1000,
    });

    return new Promise((resolve, reject) => {
        const https = require("https");
        const options = {
            hostname: "api.groq.com",
            path:     "/openai/v1/chat/completions",
            method:   "POST",
            headers:  {
                "Content-Type":   "application/json",
                "Authorization":  `Bearer ${apiKey}`,
                "Content-Length": Buffer.byteLength(body),
            },
        };

        const req = https.request(options, res => {
            let data = "";
            res.on("data", chunk => { data += chunk; });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    const text   = parsed?.choices?.[0]?.message?.content;
                    const clean  = text.replace(/```json|```/g, "").trim();
                    resolve(JSON.parse(clean));
                } catch (e) {
                    console.error("Raw AI response:", data);
                    reject(new Error("Failed to parse AI response"));
                }
            });
        });

        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

async function postPRComment(octokit, owner, repo, prNumber, analysis) {
    const api = octokit.rest || octokit;

    const scoreEmoji =
        analysis.score >= 80 ? "🟢" :
        analysis.score >= 60 ? "🟡" : "🔴";

    const issueLines = (analysis.issues || [])
        .map(i => {
            const icon = i.severity === "high" ? "🔴" : i.severity === "medium" ? "🟡" : "🟢";
            return `| ${icon} ${i.severity} | \`${i.file}\` | ${i.message} | ${i.suggestion} |`;
        })
        .join("\n");

    const strengthLines = (analysis.strengths || [])
        .map(s => `- ✅ ${s}`)
        .join("\n");

    const body =
`## ${scoreEmoji} CodeReview AI — Score: ${analysis.score}/100

${analysis.summary}

---

### 🔍 Issues Found

| Severity | File | Issue | Suggestion |
|----------|------|-------|------------|
${issueLines || "| — | — | No issues found | — |"}

---

### 💪 Strengths

${strengthLines || "- No specific strengths noted"}

---

**Verdict:** ${
    analysis.recommendation === "approve"         ? "✅ Looks good to merge" :
    analysis.recommendation === "request_changes" ? "❌ Changes requested"   :
    "💬 Minor comments"
}

<sub>Powered by CodeReview AI · [Dashboard](https://smart-code-review-platform-kappa.vercel.app)</sub>`;

    await api.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
    });
}

module.exports = { processPullRequest };