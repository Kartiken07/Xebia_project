/**
 * Payroll Queue — uses BullMQ + Redis when available,
 * falls back to synchronous execution on Vercel serverless.
 */

let payrollQueue = null;

async function initQueue() {
  if (payrollQueue) return payrollQueue;
  if (process.env.VERCEL) return null;

  try {
    const { Queue } = await import('bullmq');
    const { getRedisConnection } = await import('../config/redis.js');
    const conn = getRedisConnection();
    if (!conn) return null;
    payrollQueue = new Queue('payroll', { connection: conn });
    return payrollQueue;
  } catch {
    return null;
  }
}

export const enqueuePayrollJob = async (jobData) => {
  const queue = await initQueue();
  if (queue) {
    return queue.add('generate-payroll', jobData, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
  // Fallback: run synchronously (no Redis available)
  console.log('[Payroll] No Redis — running synchronously for:', jobData.month);
  return { id: `sync-${Date.now()}`, data: jobData };
};

