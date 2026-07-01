import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { TicketService } from '../services/ticketService.js';

const router = express.Router();

// Get tickets (All for IT, Own for Employee)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  try {
    const { tickets, meta } = await TicketService.getTickets({
      userRole: req.user.role,
      userEmployeeId: req.user.employeeId,
      page,
      limit
    });
    successResponse(res, { tickets, pagination: meta });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Raise a ticket (Any employee)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { title, description, priority } = req.body;

  try {
    const newTicket = await TicketService.createTicket({
      employeeId: req.user.employeeId,
      title,
      description,
      priority
    });
    successResponse(res, { ticket: newTicket });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Update ticket status / assignee (IT Admin only)
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'IT']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo } = req.body;

  try {
    const updated = await TicketService.updateTicket(id, { status, assignedTo });
    successResponse(res, { ticket: updated });
  } catch (err) {
    if (err.message === 'Ticket not found.') {
      return errorResponse(res, err.message, 404);
    }
    errorResponse(res, err.message, 400);
  }
}));

export default router;
