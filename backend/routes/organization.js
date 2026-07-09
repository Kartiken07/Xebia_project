import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { cacheResponse, clearCache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Get all departments
router.get('/departments', authenticateToken, cacheResponse(3600), async (req, res) => {
  const departments = await db.departments.find();
  res.json({ success: true, departments });
});

// Create department (Admin and HR only)
router.post('/departments', authenticateToken, requireRole(['SUPER_ADMIN', 'HR']), async (req, res) => {
  const { departmentName, departmentCode, manager, status } = req.body;

  if (!departmentName) {
    return res.status(400).json({ success: false, message: 'Department Name is required' });
  }
  if (!departmentCode) {
    return res.status(400).json({ success: false, message: 'Department Code is required' });
  }

  // Check unique department code
  const existingCode = await db.departments.findOne({ departmentCode });
  if (existingCode) {
    return res.status(400).json({ success: false, message: `Department Code '${departmentCode}' already exists.` });
  }

  // Create department
  const newDep = await db.departments.create({
    departmentName,
    departmentCode,
    manager: manager || '',
    employees: 0,
    status: status || 'Active'
  });

  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Create Department',
    details: `Department ${departmentName} created`,
    timestamp: new Date().toISOString()
  });

  clearCache('/api/organization/departments');

  res.json({ success: true, department: newDep });
});

// Update department
router.put('/departments/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'HR']), async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  const currentDep = await db.departments.findById(id);
  if (!currentDep) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  // If changing department code, make sure it is unique
  if (updateFields.departmentCode && updateFields.departmentCode !== currentDep.departmentCode) {
    const existing = await db.departments.findOne({ departmentCode: updateFields.departmentCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Department Code already in use' });
    }
  }

  const updated = await db.departments.findByIdAndUpdate(id, updateFields);
  
  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Update Department',
    details: `Department ${currentDep.departmentName} updated`,
    timestamp: new Date().toISOString()
  });

  clearCache('/api/organization/departments');

  res.json({ success: true, department: updated });
});

// Archive department (Check if employees exist)
router.delete('/departments/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'HR']), async (req, res) => {
  const { id } = req.params;

  const dep = await db.departments.findById(id);
  if (!dep) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  // Check if active employees exist in this department
  const employeesInDep = await db.employees.find({ department: dep.departmentName, status: 'Active' });
  if (employeesInDep.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot archive/delete department because there are active employees (${employeesInDep.length}) assigned to it.`
    });
  }

  await db.departments.deleteOne({ _id: id });

  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Archive Department',
    details: `Department ${dep.departmentName} archived/deleted`,
    timestamp: new Date().toISOString()
  });

  clearCache('/api/organization/departments');

  res.json({ success: true, message: 'Department archived successfully.' });
});

// Get audit logs (Super Admin, HR, Manager)
router.get('/audit-logs', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const { data, meta } = await db.auditLogs.findPaginated({}, page, limit, { timestamp: -1 });
  res.json({ success: true, auditLogs: data, pagination: meta });
});

export default router;
