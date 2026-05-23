const { Queue, Worker, QueueEvents } = require("bullmq");

const connection = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
};

// ── Create the PR Review Queue ───────────────────────────────────
const prReviewQueue = new Queue("pr-review", {
    connection,
    defaultJobOptions: {
        attempts:  3,        // retry 3 times if fails
        backoff: {
            type:  "exponential",
            delay: 5000,     // wait 5s, then 10s, then 20s
        },
        removeOnComplete: 100,  // keep last 100 completed jobs
        removeOnFail:     200,  // keep last 200 failed jobs
    },
});

// ── Queue Events (for logging) ───────────────────────────────────
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

// ── Add a PR Review Job to Queue ─────────────────────────────────
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

// Support both REDIS_URL (Railway) and host/port (local)
function getRedisConnection() {
    if (process.env.REDIS_URL) {
        return { url: process.env.REDIS_URL };
    }
    return {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
    };
}

const connection = getRedisConnection();

module.exports = { prReviewQueue, addPRReviewJob };