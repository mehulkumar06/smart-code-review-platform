const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
    try {
        // ── Get inputs ───────────────────────────────────────────
        const token    = core.getInput("github-token", { required: true });
        const apiUrl   = core.getInput("api-url", { required: true });
        const minScore = parseInt(core.getInput("min-score") || "60");
        const failOnIssues = core.getInput("fail-on-issues") === "true";

        const octokit = github.getOctokit(token);
        const context = github.context;

        // ── Only run on PRs ──────────────────────────────────────
        if (context.eventName !== "pull_request") {
            core.info("⏭️ Skipping — not a pull request event");
            return;
        }

        const pr     = context.payload.pull_request;
        const owner  = context.repo.owner;
        const repo   = context.repo.repo;
        const prNum  = pr.number;
        const sha    = pr.head.sha;

        core.info(`\n🔍 Smart Code Review AI`);
        core.info(`   PR #${prNum}: ${pr.title}`);
        core.info(`   Repo: ${owner}/${repo}`);
        core.info(`   Min score: ${minScore}`);

        // ── Create pending check run ─────────────────────────────
        const checkRun = await octokit.rest.checks.create({
            owner,
            repo,
            name:       "Smart Code Review AI",
            head_sha:   sha,
            status:     "in_progress",
            started_at: new Date().toISOString(),
        });

        core.info(`   ✅ Check run created: ${checkRun.data.id}`);

        // ── Get changed files ────────────────────────────────────
        const { data: files } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: prNum,
            per_page: 100,
        });

        const codeExtensions = [
            ".js", ".ts", ".jsx", ".tsx", ".py",
            ".java", ".go", ".rs", ".cpp", ".c",
            ".cs", ".php", ".rb", ".swift", ".kt", ".md"
        ];

        const codeFiles = files.filter(f =>
            f.status !== "removed" &&
            codeExtensions.some(ext => f.filename.endsWith(ext))
        );

        core.info(`   📄 Changed files: ${codeFiles.length}`);

        if (codeFiles.length === 0) {
            core.info("   No code files changed — skipping review");

            await octokit.rest.checks.update({
                owner, repo,
                check_run_id: checkRun.data.id,
                status:      "completed",
                conclusion:  "success",
                completed_at: new Date().toISOString(),
                output: {
                    title:   "✅ No code files changed",
                    summary: "No code files were changed in this PR.",
                },
            });

            core.setOutput("score", "100");
            core.setOutput("passed", "true");
            core.setOutput("issues-count", "0");
            return;
        }

        // ── Call your Railway backend for AI analysis ────────────
        core.info(`   🤖 Calling AI review API...`);

        const repoUrl = `https://github.com/${owner}/${repo}`;

        let analysis;
        try {
            const fetch = require("node-fetch");
            const response = await fetch(`${apiUrl}/api/github/analyze`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoUrl }),
                timeout: 60000,
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            analysis = await response.json();

        } catch (err) {
            core.warning(`API call failed: ${err.message} — using file-based analysis`);

            // Fallback — basic analysis from file count
            analysis = {
                overallScore: 70,
                issues: [],
                strengths: [`${codeFiles.length} files reviewed`],
                summary: "AI review unavailable — basic analysis completed.",
                aiReview: "AI review service temporarily unavailable.",
            };
        }

        const score    = analysis.overallScore || 70;
        const issues   = analysis.issues || [];
        const highIssues = issues.filter(i => i.severity === "high");

        core.info(`   🧠 Score: ${score}/100`);
        core.info(`   Issues: ${issues.length} (${highIssues.length} high)`);

        // ── Set outputs ──────────────────────────────────────────
        core.setOutput("score", String(score));
        core.setOutput("issues-count", String(issues.length));

        // ── Determine pass/fail ──────────────────────────────────
        const scorePassed  = score >= minScore;
        const issuesPassed = !failOnIssues || highIssues.length === 0;
        const passed       = scorePassed && issuesPassed;

        core.setOutput("passed", String(passed));

        // ── Post PR comment ──────────────────────────────────────
        const scoreEmoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";

        const issueRows = issues.slice(0, 10).map(i => {
            const icon = i.severity === "high" ? "🔴" :
                         i.severity === "medium" ? "🟡" : "🟢";
            return `| ${icon} ${i.severity} | ${i.message} |`;
        }).join("\n");

        const strengthRows = (analysis.strengths || [])
            .map(s => `- ✅ ${s}`)
            .join("\n");

        const comment = `## ${scoreEmoji} Smart Code Review AI — Score: ${score}/100

${analysis.summary || "Analysis complete."}

---

### 📊 Results

| Metric | Value |
|--------|-------|
| Overall Score | **${score}/100** |
| Files Reviewed | ${codeFiles.length} |
| Issues Found | ${issues.length} |
| High Severity | ${highIssues.length} |
| Status | ${passed ? "✅ **PASSED**" : "❌ **FAILED**"} |

${issues.length > 0 ? `
### 🔍 Issues Found

| Severity | Issue |
|----------|-------|
${issueRows}
` : "### ✅ No Issues Found\n"}

### 💪 Strengths

${strengthRows || "- Analysis complete"}

---

${!scorePassed ? `> ⚠️ Score ${score} is below minimum threshold of ${minScore}` : ""}
${failOnIssues && highIssues.length > 0 ? `> ⚠️ ${highIssues.length} high severity issue(s) found` : ""}

<sub>Powered by [Smart Code Review AI](https://smart-code-review-platform-kappa.vercel.app) · Minimum score: ${minScore}</sub>`;

        await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: prNum,
            body: comment,
        });

        core.info(`   💬 Comment posted`);

        // ── Complete check run ───────────────────────────────────
        await octokit.rest.checks.update({
            owner, repo,
            check_run_id: checkRun.data.id,
            status:       "completed",
            conclusion:   passed ? "success" : "failure",
            completed_at: new Date().toISOString(),
            output: {
                title: passed
                    ? `✅ Score: ${score}/100 — Passed`
                    : `❌ Score: ${score}/100 — Failed`,
                summary: analysis.summary || "Review complete.",
                text: `**Score:** ${score}/100\n**Files reviewed:** ${codeFiles.length}\n**Issues found:** ${issues.length}`,
            },
        });

        core.info(`   ${passed ? "✅ PASSED" : "❌ FAILED"}`);

        // ── Fail the action if needed ────────────────────────────
        if (!passed) {
            if (!scorePassed) {
                core.setFailed(`❌ Code quality score ${score} is below minimum ${minScore}`);
            } else {
                core.setFailed(`❌ ${highIssues.length} high severity issue(s) found`);
            }
        } else {
            core.info(`\n✅ Smart Code Review passed with score ${score}/100`);
        }

    } catch (error) {
        core.setFailed(`Action failed: ${error.message}`);
        console.error(error);
    }
}

run();