const nodemailer = require("nodemailer");
const https      = require("https");

// ── Email Transporter ────────────────────────────────────────────
function getTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

// ── Send Email Notification ──────────────────────────────────────
async function sendEmailNotification(reviewData) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("📧 Email not configured — skipping");
        return;
    }

    const {
        repo, prNumber, prTitle,
        score, issues, strengths,
        summary, passed
    } = reviewData;

    const scoreEmoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";
    const statusText = passed ? "✅ PASSED" : "❌ FAILED";

    const issueRows = (issues || []).slice(0, 5).map(i =>
        `<tr>
            <td style="padding:8px;color:${i.severity === "high" ? "#f43f5e" : i.severity === "medium" ? "#f59e0b" : "#10b981"}">${i.severity.toUpperCase()}</td>
            <td style="padding:8px">${i.file || "-"}</td>
            <td style="padding:8px">${i.message}</td>
        </tr>`
    ).join("");

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#f0f2f5;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">
            ${scoreEmoji} CodeReview AI
        </h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">
            PR Review Complete
        </p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">

        <!-- Repo + PR info -->
        <div style="margin-bottom:20px;">
            <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px;">
                ${repo} — PR #${prNumber}
            </div>
            <div style="font-size:13px;color:#64748b;">${prTitle || "No title"}</div>
        </div>

        <!-- Score -->
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
            <div style="font-size:48px;font-weight:800;color:${score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e"};">
                ${score}
            </div>
            <div style="font-size:13px;color:#64748b;margin-top:4px;">out of 100</div>
            <div style="margin-top:12px;font-size:14px;font-weight:600;color:${passed ? "#10b981" : "#f43f5e"};">
                ${statusText}
            </div>
        </div>

        <!-- Summary -->
        <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.8px;">Summary</div>
            <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">${summary || "Review complete."}</p>
        </div>

        <!-- Issues -->
        ${issues && issues.length > 0 ? `
        <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.8px;">
                Issues Found (${issues.length})
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th style="padding:8px;text-align:left;color:#64748b;">Severity</th>
                        <th style="padding:8px;text-align:left;color:#64748b;">File</th>
                        <th style="padding:8px;text-align:left;color:#64748b;">Issue</th>
                    </tr>
                </thead>
                <tbody>${issueRows}</tbody>
            </table>
        </div>
        ` : `<div style="color:#10b981;font-size:13px;margin-bottom:20px;">✓ No issues found</div>`}

        <!-- CTA -->
        <a href="https://smart-code-review-platform-kappa.vercel.app"
           style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0f766e);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
            View Dashboard →
        </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
        Powered by CodeReview AI · <a href="https://smart-code-review-platform-kappa.vercel.app" style="color:#0d9488;">Dashboard</a>
    </div>
</div>
</body>
</html>`;

    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from:    `"CodeReview AI" <${process.env.EMAIL_USER}>`,
            to:      process.env.EMAIL_TO || process.env.EMAIL_USER,
            subject: `${scoreEmoji} PR #${prNumber} — Score ${score}/100 — ${repo}`,
            html,
        });
        console.log(`   📧 Email sent to ${process.env.EMAIL_TO || process.env.EMAIL_USER}`);
    } catch (err) {
        console.error("   📧 Email failed:", err.message);
    }
}

// ── Send Slack Notification ──────────────────────────────────────
async function sendSlackNotification(reviewData) {
    if (!process.env.SLACK_WEBHOOK_URL) {
        console.log("💬 Slack not configured — skipping");
        return;
    }

    const {
        repo, prNumber, prTitle,
        score, issues, summary, passed
    } = reviewData;

    const scoreEmoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";
    const highIssues = (issues || []).filter(i => i.severity === "high").length;

    const payload = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `${scoreEmoji} CodeReview AI — PR #${prNumber}`,
                }
            },
            {
                type: "section",
                fields: [
                    { type: "mrkdwn", text: `*Repository*\n${repo}` },
                    { type: "mrkdwn", text: `*PR Title*\n${prTitle || "No title"}` },
                    { type: "mrkdwn", text: `*Score*\n*${score}/100*` },
                    { type: "mrkdwn", text: `*Status*\n${passed ? "✅ PASSED" : "❌ FAILED"}` },
                    { type: "mrkdwn", text: `*Issues Found*\n${(issues || []).length} (${highIssues} high)` },
                    { type: "mrkdwn", text: `*Threshold*\n60/100` },
                ],
            },
            {
                type: "section",
                text: { type: "mrkdwn", text: `*Summary*\n${summary || "Review complete."}` },
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: { type: "plain_text", text: "View Dashboard" },
                        url:  "https://smart-code-review-platform-kappa.vercel.app",
                        style: "primary",
                    },
                    {
                        type: "button",
                        text: { type: "plain_text", text: "View PR on GitHub" },
                        url:  `https://github.com/${repo}/pull/${prNumber}`,
                    },
                ],
            },
            { type: "divider" },
        ],
    };

    const body = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
        const url     = new URL(process.env.SLACK_WEBHOOK_URL);
        const options = {
            hostname: url.hostname,
            path:     url.pathname,
            method:   "POST",
            headers:  {
                "Content-Type":   "application/json",
                "Content-Length": Buffer.byteLength(body),
            },
        };

        const req = https.request(options, res => {
            let data = "";
            res.on("data", chunk => { data += chunk; });
            res.on("end", () => {
                if (res.statusCode === 200) {
                    console.log("   💬 Slack notification sent");
                    resolve();
                } else {
                    console.error("   💬 Slack failed:", data);
                    resolve(); // don't reject — non-critical
                }
            });
        });

        req.on("error", err => {
            console.error("   💬 Slack error:", err.message);
            resolve(); // non-critical
        });

        req.write(body);
        req.end();
    });
}

// ── Send All Notifications ───────────────────────────────────────
async function sendNotifications(reviewData) {
    await Promise.allSettled([
        sendEmailNotification(reviewData),
        sendSlackNotification(reviewData),
    ]);
}

module.exports = { sendNotifications };