import { Worker } from 'bullmq';
import connection from '../config/redis.js';
import { PayrollService } from '../services/payrollService.js';
import mongoose from 'mongoose';
import config from '../config/index.js';

// Connect to MongoDB if not already connected
if (mongoose.connection.readyState === 0) {
  mongoose.connect(config.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('[Worker] Connected to MongoDB for Payroll Worker');
  }).catch(err => {
    console.error('[Worker] MongoDB Connection Error:', err);
  });
}

const worker = new Worker('payroll', async (job) => {
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

export default worker;
