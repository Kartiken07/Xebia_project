import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { AssetService } from '../services/assetService.js';

const router = express.Router();

// Get assets (All for IT/HR, Assigned for employee)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  try {
    const { assets, meta } = await AssetService.getAssets({
      userRole: req.user.role,
      userEmployeeId: req.user.employeeId,
      page,
      limit
    });
    successResponse(res, { assets, pagination: meta });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Add asset (IT Admin only)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'IT']), asyncHandler(async (req, res) => {
  const { assetName, serialNumber, type, assignedTo, status } = req.body;

  try {
    const newAsset = await AssetService.createAsset({
      assetName,
      serialNumber,
      type,
      assignedTo,
      status
    });
    successResponse(res, { asset: newAsset });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Update asset allocation/status
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'IT']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const updated = await AssetService.updateAsset(id, updateFields);
    successResponse(res, { asset: updated });
  } catch (err) {
    if (err.message === 'Asset not found.') {
      return errorResponse(res, err.message, 404);
    }
    errorResponse(res, err.message, 400);
  }
}));

export default router;
