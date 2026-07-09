/**
 * Payroll Worker — only runs when Redis is available (local dev / dedicated server).
 * Does NOT run on Vercel serverless.
 */

let worker = null;

export async function startPayrollWorker() {
  if (process.env.VERCEL) {
    console.log('[Worker] Skipping payroll worker on Vercel serverless.');
    return null;
  }

  try {
    const { Worker } = await import('bullmq');
    const { getRedisConnection } = await import('../config/redis.js');
    const { PayrollService } = await import('../services/payrollService.js');
    const connection = getRedisConnection();

    if (!connection) {
      console.log('[Worker] No Redis connection — payroll worker disabled.');
      return null;
    }

    worker = new Worker('payroll', async (job) => {
      const { month, userId } = job.data;
      console.log(`[Worker] Starting payroll run for ${month} initiated by user ${userId}`);

      try {
        const processedRecords = await PayrollService.runPayroll({ month, userId });
        console.log(`[Worker] Successfully completed payroll run for ${processedRecords.length} employees.`);
        return processedRecords.length;
      } catch (error) {
        console.error(`[Worker] Failed payroll run for ${month}:`, error);
        throw error;
      }
    }, { connection });

    worker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
    });

    console.log('[Worker] Payroll worker started successfully.');
    return worker;
  } catch (err) {
    console.warn('[Worker] Could not start payroll worker:', err.message);
    return null;
  }
}

export default worker;

