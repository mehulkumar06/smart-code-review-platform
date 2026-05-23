require("dotenv").config();
const { Worker } = require("bullmq");
const { processPullRequest } = require("./services/prReviewService");

const connection = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
};

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
        concurrency: 3,   // process up to 3 PRs simultaneously
    }
);

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} done`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
});

worker.on("error", (err) => {
    console.error("Worker error:", err);
});

console.log("✅ Worker ready — listening for PR review jobs");