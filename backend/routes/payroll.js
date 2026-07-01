import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { PayrollService } from '../services/payrollService.js';
import { enqueuePayrollJob } from '../queues/payrollQueue.js';

const router = express.Router();

// Get payroll slips history (All for HR/Finance, Personal for Employees)
router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  try {
    const { payrolls, meta } = await PayrollService.getHistory({
      userRole: req.user.role,
      userEmployeeId: req.user.employeeId,
      page,
      limit
    });
    successResponse(res, { payrolls, pagination: meta });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Run monthly payroll (Enqueues a background job)
router.post('/run', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'FINANCE']), asyncHandler(async (req, res) => {
  const { month } = req.body; // e.g. "July 2026"

  if (!month) {
    return errorResponse(res, 'Month specification is required (e.g., "July 2026")', 400);
  }

  const job = await enqueuePayrollJob({
    month,
    userId: req.user._id
  });
  
  res.status(202).json({
    success: true,
    message: `Payroll run for ${month} has been queued.`,
    jobId: job.id
  });
}));

export default router;
