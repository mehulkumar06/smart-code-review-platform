require("dotenv").config();
const { Worker } = require("bullmq");
const { processPullRequest } = require("./services/prReviewService");

// ── Use same Redis connection as queueService ──────────────────
function getRedisConnection() {
    if (process.env.REDIS_URL) {
        console.log("✅ Using REDIS_URL");
        return { url: process.env.REDIS_URL };
    }
    console.log("⚠️ Using local Redis host/port");
    return {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT) || 6379,
    };
}

const connection = getRedisConnection();

console.log("🔧 Worker starting...");

const worker = new Worker(
    "pr-review",
    async (job) => {
        console.log(`\n⚙️  Processing job: ${job.id}`);
        console.log(`   PR #${job.data.pull_request.number} in ${job.data.repository.full_name}`);
        await processPullRequest(job.data);
    },
    {
        connection,
        concurrency: 3,
    }
);

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} done`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
});

worker.on("error", (err) => {
    console.error("Worker error:", err.message);
});

console.log("✅ Worker ready — listening for PR review jobs");