import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { ProjectService } from '../services/projectService.js';
import { cacheResponse, clearCache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, cacheResponse(300), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  try {
    const { projects, meta } = await ProjectService.getAllProjects({ page, limit });
    successResponse(res, { projects, pagination: meta });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Create project
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), asyncHandler(async (req, res) => {
  const { projectName, description, manager, deadline } = req.body;

  if (!projectName || !deadline) {
    return errorResponse(res, 'Project Name and Deadline are required.', 400);
  }

  const proj = await ProjectService.createProject({
    projectName,
    description,
    manager: manager || req.user.employeeId,
    deadline
  });

  clearCache('/api/projects');

  successResponse(res, { project: proj });
}));

// Get tasks (filtered by project or assigned user)
router.get('/tasks', authenticateToken, cacheResponse(300), asyncHandler(async (req, res) => {
  const { projectId, assignedTo, page = 1, limit = 50 } = req.query;

  try {
    const { tasks, meta } = await ProjectService.getTasks({
      projectId,
      assignedTo,
      userRole: req.user.role,
      userEmployeeId: req.user.employeeId,
      page,
      limit
    });
    
    successResponse(res, { tasks, pagination: meta });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

// Create task
router.post('/tasks', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), asyncHandler(async (req, res) => {
  const { projectId, task, assignedTo, priority, deadline } = req.body;

  if (!projectId || !task || !assignedTo || !deadline) {
    return errorResponse(res, 'Project, Task Name, Assignee and Deadline are required.', 400);
  }

  try {
    const newTask = await ProjectService.createTask({
      projectId,
      task,
      assignedTo,
      priority,
      deadline
    });
    clearCache('/api/projects');
    successResponse(res, { task: newTask });
  } catch (err) {
    errorResponse(res, err.message, 404);
  }
}));

// Update task status and details
router.put('/tasks/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comments, attachments } = req.body;

  try {
    const updated = await ProjectService.updateTaskStatus(id, {
      status,
      comments,
      attachments,
      userRole: req.user.role,
      userName: req.user.name
    });
    clearCache('/api/projects');
    successResponse(res, { task: updated });
  } catch (err) {
    errorResponse(res, err.message, 400);
  }
}));

export default router;
