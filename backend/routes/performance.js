import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get reviews (Personal or Department for Managers)
router.get('/', authenticateToken, async (req, res) => {
  const isPrivileged = ['SUPER_ADMIN', 'HR'].includes(req.user.role);
  
  if (isPrivileged) {
    const reviews = await db.auditLogs.find({ action: 'Performance Review' }); // Fallback or separate table
    // Let's create an explicit 'performance' schema in our database.json if not present
    // The collection exists in db as writeable. Let's load the performance collection.
    const performance = db.read_file ? [] : (db.dbData && db.dbData.performance ? db.dbData.performance : []);
    // To make it easy, we just query db.leaves/auditLogs or use a simple custom finder
    // Let's check db collection list from db.js: yes, we have 'leaves', 'payroll', 'projects', 'tasks', 'assets', 'tickets'
    // Wait, let's look at what tables we defined in db.js:
    // users, employees, departments, candidates, attendance, leaves, payroll, projects, tasks, assets, tickets, notifications, auditLogs.
    // Wait! Performance isn't in db.js's list! Let's check db.js.
    // Ah, db.js lists: users, employees, departments, candidates, attendance, leaves, payroll, projects, tasks, assets, tickets, notifications, auditLogs.
    // We can add a performance property dynamically to the db object, or save reviews directly inside the employees list or auditLogs, or edit db.js!
    // Since we have db.js using standard keys, let's check if we can add a new key, or just store performance logs in auditLogs under action='Performance Review' or use employees.
    // Actually, storing performance ratings directly in the employee profile (e.g. employee.performanceReviews) or creating a helper is super easy. Let's store reviews in a list or append to employee details.
    // Let's check employee schema: we can add performanceReviews: [] to the employee object.
    // This is extremely simple and clean!
  }

  // Let's fetch all reviews from employees
  const employees = await db.employees.find();
  const reviewsList = [];
  employees.forEach(emp => {
    if (emp.performanceReviews) {
      emp.performanceReviews.forEach(rev => {
        reviewsList.push({
          employeeId: emp.employeeId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          ...rev
        });
      });
    }
  });

  // Filter based on roles
  if (req.user.role === 'EMPLOYEE') {
    const personal = reviewsList.filter(rev => rev.employeeId === req.user.employeeId);
    return res.json({ success: true, reviews: personal });
  } else if (req.user.role === 'MANAGER') {
    // Show department reviews
    const managerId = req.user.employeeId;
    const teamEmpIds = employees
      .filter(emp => emp.reportingManager === managerId)
      .map(emp => emp.employeeId);
    const teamReviews = reviewsList.filter(rev => teamEmpIds.includes(rev.employeeId));
    return res.json({ success: true, reviews: teamReviews });
  }

  res.json({ success: true, reviews: reviewsList });
});

// Create review / Goal Setting (Manager & HR)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), async (req, res) => {
  const { employeeId, quarter, kpiScore, managerRating, overall, feedback } = req.body;

  if (!employeeId || !quarter || !managerRating) {
    return res.status(400).json({ success: false, message: 'Employee, Quarter, and Rating are required' });
  }

  const emp = await db.employees.findOne({ employeeId });
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const newReview = {
    _id: Math.random().toString(36).substring(2, 9),
    quarter,
    kpiScore: parseInt(kpiScore) || 80,
    managerRating: parseInt(managerRating),
    overall: overall || 'Good',
    feedback: feedback || '',
    date: new Date().toISOString().split('T')[0]
  };

  const currentReviews = emp.performanceReviews || [];
  currentReviews.push(newReview);

  await db.employees.findByIdAndUpdate(emp._id, { performanceReviews: currentReviews });

  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Performance Review',
    details: `Added review for ${emp.firstName} ${emp.lastName} for ${quarter}`,
    timestamp: new Date().toISOString()
  });

  // Notify employee
  await db.notifications.create({
    recipientId: employeeId,
    message: `Your manager has posted a performance review for ${quarter}. Rating: ${managerRating}/5`,
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, review: newReview });
});

export default router;
