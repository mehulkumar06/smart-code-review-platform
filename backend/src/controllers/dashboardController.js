const { prReviewQueue } = require("../services/queueService");

async function getPRHistory(req, res) {
    try {
        const completed = await prReviewQueue.getCompleted(0, 49);
        const failed    = await prReviewQueue.getFailed(0, 19);

        const history = completed.map(job => ({
            id:         job.id,
            repo:       job.data?.repository?.full_name || "unknown",
            prNumber:   job.data?.pull_request?.number || 0,
            score:      job.returnvalue?.score || 0,
            status:     "completed",
            finishedAt: new Date(job.finishedOn).toISOString(),
            issues:     job.returnvalue?.issues?.length || 0,
        }));

        const failedJobs = failed.map(job => ({
            id:         job.id,
            repo:       job.data?.repository?.full_name || "unknown",
            prNumber:   job.data?.pull_request?.number || 0,
            score:      0,
            status:     "failed",
            finishedAt: new Date(job.finishedOn).toISOString(),
            issues:     0,
        }));

        res.json({
            history: [...history, ...failedJobs].sort(
                (a, b) => new Date(b.finishedAt) - new Date(a.finishedAt)
            ),
            stats: {
                total:    completed.length + failed.length,
                passed:   completed.filter(j => (j.returnvalue?.score || 0) >= 60).length,
                failed:   failed.length,
                avgScore: completed.length > 0
                    ? Math.round(completed.reduce((sum, j) => sum + (j.returnvalue?.score || 0), 0) / completed.length)
                    : 0,
            },
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: error.message });
    }
}

async function getQueueStats(req, res) {
    try {
        const waiting   = await prReviewQueue.getWaitingCount();
        const active    = await prReviewQueue.getActiveCount();
        const completed = await prReviewQueue.getCompletedCount();
        const failed    = await prReviewQueue.getFailedCount();
        res.json({ waiting, active, completed, failed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { getPRHistory, getQueueStats };