import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { LeaveService } from '../services/leaveService.js';

const router = express.Router();

// Get personal leave history & balances
router.get('/my', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  try {
    const { history, balances, meta } = await LeaveService.getMyLeaves(req.user.employeeId, page, limit);
    successResponse(res, { history, balances, pagination: meta });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Get all leave applications for approvals (Managers/HR)
router.get('/pending', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  try {
    const { leaves, meta } = await LeaveService.getPendingLeaves({
      userRole: req.user.role,
      userEmployeeId: req.user.employeeId,
      page,
      limit
    });
    successResponse(res, { leaves, pagination: meta });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Apply for leave (M-06)
router.post('/apply', authenticateToken, asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  try {
    const leaveRequest = await LeaveService.applyForLeave({
      employeeId: req.user.employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    });
    successResponse(res, { leaveRequest }, 'Leave application submitted successfully.');
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Review leave (Approve/Reject)
router.post('/review/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'Approved' or 'Rejected'

  try {
    await LeaveService.reviewLeave(id, {
      action,
      userEmployeeId: req.user.employeeId
    });
    successResponse(res, {}, `Leave application ${action.toLowerCase()} successfully.`);
  } catch (err) {
    if (err.message === 'Leave application not found.') {
      return errorResponse(res, err.message, 404);
    }
    errorResponse(res, err.message, 400);
  }
}));

export default router;
