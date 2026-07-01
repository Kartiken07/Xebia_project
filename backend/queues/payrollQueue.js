import { Queue } from 'bullmq';
import connection from '../config/redis.js';

export const payrollQueue = new Queue('payroll', { connection });

export const enqueuePayrollJob = async (jobData) => {
  return await payrollQueue.add('generate-payroll', jobData, {
    removeOnComplete: true,
    removeOnFail: false
  });
};
