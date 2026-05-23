const { Queue, QueueEvents } = require("bullmq");

// ── Redis Connection (supports Railway REDIS_URL and local host/port) ──
function getRedisConnection() {
    console.log("REDIS_URL:", process.env.REDIS_URL ? "SET" : "NOT SET");
    if (process.env.REDIS_URL) {
        return { url: process.env.REDIS_URL };
    }
    return {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT) || 6379,
    };
}

const connection = getRedisConnection();

// ── Create the PR Review Queue ────────────────────────────────────────
const prReviewQueue = new Queue("pr-review", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type:  "exponential",
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail:     200,
    },
});

// ── Queue Events (for logging) ────────────────────────────────────────
const queueEvents = new QueueEvents("pr-review", { connection });

queueEvents.on("completed", ({ jobId }) => {
    console.log(`✅ Job ${jobId} completed`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`❌ Job ${jobId} failed: ${failedReason}`);
});

queueEvents.on("active", ({ jobId }) => {
    console.log(`⚙️  Job ${jobId} started processing`);
});

// ── Add a PR Review Job to Queue ──────────────────────────────────────
async function addPRReviewJob(payload) {
    const job = await prReviewQueue.add(
        "review-pr",
        payload,
        {
            jobId: `pr-${payload.repository.full_name}-${payload.pull_request.number}-${payload.pull_request.head.sha}`,
        }
    );
    console.log(`📥 Job queued: ${job.id}`);
    return job;
}

module.exports = { prReviewQueue, addPRReviewJob };