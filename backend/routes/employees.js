import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { cacheResponse, clearCache } from '../middleware/cacheMiddleware.js';
import validate from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../schemas/employee.schemas.js';

const router = express.Router();

// Helper to filter salary information based on roles (RBAC rule)
const stripSensitiveFields = (employee, reqUser) => {
  if (!employee) return null;
  
  const privilegedRoles = ['SUPER_ADMIN', 'HR', 'FINANCE'];
  const isSelf = reqUser.employeeId && reqUser.employeeId === employee.employeeId;

  if (privilegedRoles.includes(reqUser.role) || isSelf) {
    return employee;
  }

  // Strip basicSalary and hra
  const { basicSalary, hra, ...publicDetails } = employee;
  return publicDetails;
};

// Get all/search employees
router.get('/', authenticateToken, cacheResponse(300), asyncHandler(async (req, res) => {
  const { search, department, page = 1, limit = 100 } = req.query;
  
  const query = {};
  if (department) {
    query.department = department;
  }
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const { data, meta } = await db.employees.findPaginated(query, page, limit);

  // Filter sensitive fields for role restrictions
  const filteredList = data.map(emp => stripSensitiveFields(emp, req.user));

  successResponse(res, { employees: filteredList, pagination: meta });
}));

// Get employee by ID
router.get('/:id', authenticateToken, cacheResponse(300), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const emp = await db.employees.findById(id) || await db.employees.findOne({ employeeId: id });

  if (!emp) {
    return errorResponse(res, 'Employee not found', 404);
  }

  successResponse(res, { employee: stripSensitiveFields(emp, req.user) });
}));

// Add employee (Super Admin and HR only)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'HR']), validate(createEmployeeSchema), asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    mobile,
    address,
    gender,
    bloodGroup,
    dob,
    department,
    designation,
    joiningDate,
    reportingManager,
    employmentType,
    salaryGrade,
    basicSalary,
    hra
  } = req.body;

  // Validations
  if (!firstName || !lastName || !email || !joiningDate) {
    return errorResponse(res, 'First name, last name, email, and joining date are required.', 400);
  }

  // Email unique (BR-01)
  const existingEmail = await db.employees.findOne({ email }) || await db.users.findOne({ email });
  if (existingEmail) {
    return errorResponse(res, 'Email address already in use.', 400);
  }

  // Joining Date check
  const now = new Date();
  const join = new Date(joiningDate);
  if (join > now) {
    return errorResponse(res, 'Joining Date cannot be in the future.', 400);
  }

  // Auto-generate employee ID safely using atomic counter (Phase 2.1)
  const counter = await db.counters.model.findOneAndUpdate(
    { _id: 'employeeId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const nextNumber = 1000 + counter.seq;
  const employeeId = `EMP${nextNumber}`;

  // Create Employee
  const newEmp = await db.employees.create({
    employeeId,
    firstName,
    lastName,
    email,
    mobile: mobile || '',
    address: address || '',
    gender: gender || 'Male',
    bloodGroup: bloodGroup || 'O+',
    dob: dob || '',
    department: department || '',
    designation: designation || '',
    joiningDate,
    reportingManager: reportingManager || '',
    employmentType: employmentType || 'Permanent',
    salaryGrade: salaryGrade || 'Grade-B',
    basicSalary: parseFloat(basicSalary) || 50000,
    hra: parseFloat(hra) || 10000,
    status: 'Active'
  });

  // Automatically create a user login account (BR-05)
  // Default password will be EmployeeId@123 (e.g. EMP1005@123) which satisfies BR-03
  const defaultPassword = `${employeeId}@123`;
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  // Map employee role: default is EMPLOYEE
  // (If designating as Manager or specific role, HR can edit or default mapping applies)
  let initialRole = 'EMPLOYEE';
  if (designation.toLowerCase().includes('manager') || designation.toLowerCase().includes('director')) {
    initialRole = 'MANAGER';
  } else if (designation.toLowerCase().includes('finance')) {
    initialRole = 'FINANCE';
  } else if (designation.toLowerCase().includes('it admin') || designation.toLowerCase().includes('sysadmin')) {
    initialRole = 'IT';
  }

  await db.users.create({
    email,
    password: hashedPassword,
    role: initialRole,
    name: `${firstName} ${lastName}`,
    employeeId,
    failedLoginAttempts: 0,
    locked: false
  });

  // Update employee count in Department
  if (department) {
    const dep = await db.departments.findOne({ departmentName: department });
    if (dep) {
      await db.departments.findByIdAndUpdate(dep._id, { employees: (dep.employees || 0) + 1 });
    }
  }

  // Log audit
  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Employee Added',
    details: `Employee ${firstName} ${lastName} created with ID ${employeeId}`,
    timestamp: new Date().toISOString()
  });

  clearCache('/api/employees');

  successResponse(res, {
    employee: newEmp,
    generatedCredentials: {
      email,
      password: defaultPassword
    }
  });
}));

// Edit employee details
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), validate(updateEmployeeSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  const emp = await db.employees.findById(id) || await db.employees.findOne({ employeeId: id });
  if (!emp) {
    return errorResponse(res, 'Employee not found', 404);
  }

  // Restrict who can edit salary details
  const allowedSalaryEdit = ['SUPER_ADMIN', 'HR', 'FINANCE'].includes(req.user.role);
  if (!allowedSalaryEdit) {
    delete updateFields.basicSalary;
    delete updateFields.hra;
    delete updateFields.salaryGrade;
  }

  // Handle department count adjustments if department changes
  if (updateFields.department && updateFields.department !== emp.department) {
    // Decrement old
    if (emp.department) {
      const oldDep = await db.departments.findOne({ departmentName: emp.department });
      if (oldDep) {
        await db.departments.findByIdAndUpdate(oldDep._id, { employees: Math.max(0, (oldDep.employees || 0) - 1) });
      }
    }
    // Increment new
    const newDep = await db.departments.findOne({ departmentName: updateFields.department });
    if (newDep) {
      await db.departments.findByIdAndUpdate(newDep._id, { employees: (newDep.employees || 0) + 1 });
    }
  }

  const updated = await db.employees.findByIdAndUpdate(emp._id, updateFields);

  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Employee Updated',
    details: `Employee profile updated for ${emp.firstName} ${emp.lastName}`,
    timestamp: new Date().toISOString()
  });

  clearCache('/api/employees');

  successResponse(res, { employee: stripSensitiveFields(updated, req.user) });
}));

// Archive Employee (instead of hard delete)
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'HR']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const emp = await db.employees.findById(id) || await db.employees.findOne({ employeeId: id });

  if (!emp) {
    return errorResponse(res, 'Employee not found', 404);
  }

  // Archive
  await db.employees.findByIdAndUpdate(emp._id, { status: 'Archived' });
  
  // Disable user account
  const u = await db.users.findOne({ email: emp.email });
  if (u) {
    await db.users.findByIdAndUpdate(u._id, { locked: true });
  }

  // Adjust department count
  if (emp.department) {
    const dep = await db.departments.findOne({ departmentName: emp.department });
    if (dep) {
      await db.departments.findByIdAndUpdate(dep._id, { employees: Math.max(0, (dep.employees || 0) - 1) });
    }
  }

  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Employee Archived',
    details: `Employee ${emp.firstName} ${emp.lastName} marked as Archived/Terminated`,
    timestamp: new Date().toISOString()
  });

  clearCache('/api/employees');

  successResponse(res, {}, 'Employee successfully archived and account locked.');
}));

export default router;
