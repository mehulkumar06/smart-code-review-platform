const crypto = require("crypto");
const { addPRReviewJob } = require("../services/queueService");

// ── Verify GitHub signature ──────────────────────────────────────
function verifySignature(rawBody, signature) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
        console.error("GITHUB_WEBHOOK_SECRET not set");
        return false;
    }

    const expectedSig =
        "sha256=" +
        crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSig)
        );
    } catch {
        return false;
    }
}

// ── Main webhook handler ─────────────────────────────────────────
async function handleWebhook(req, res) {
    const signature = req.headers["x-hub-signature-256"];
    const event     = req.headers["x-github-event"];
    const delivery  = req.headers["x-github-delivery"];

    console.log(`\n📦 Webhook received: ${event} [${delivery}]`);

    // 1. Verify signature
    if (!signature || !verifySignature(req.body, signature)) {
        console.error("❌ Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
    }

    // 2. Acknowledge immediately — GitHub expects fast response
    res.status(200).json({ received: true });

    // 3. Parse body
    let payload;
    try {
        payload = JSON.parse(req.body.toString());
    } catch (err) {
        console.error("Failed to parse webhook payload:", err);
        return;
    }

    // 4. Route to correct handler
    try {
        if (event === "pull_request") {
            const action = payload.action;
            console.log(`   PR action: ${action}`);

            // Only process when PR is opened or new commits pushed
            if (action === "opened" || action === "synchronize") {
    console.log(
        `   PR #${payload.pull_request.number}: ` +
        `${payload.repository.full_name}`
    );
    // Add to queue instead of processing directly
    addPRReviewJob(payload).catch(err =>
        console.error("Failed to queue job:", err)
    );
}

        } else if (event === "ping") {
            console.log("   ✅ Ping received — webhook connected!");

        } else {
            console.log(`   Skipping event: ${event}`);
        }

    } catch (err) {
        console.error("Webhook routing error:", err);
    }
}

module.exports = { handleWebhook };