import { db } from '../db.js';

const LEAVE_ALLOWANCES = {
  'Casual Leave': 12,
  'Sick Leave': 10,
  'Earned Leave': 15
};

export class LeaveService {
  static async getLeaveBalances(employeeId) {
    const approvedLeaves = await db.leaves.find({ employeeId, status: 'Approved' });
    
    const used = {
      'Casual Leave': 0,
      'Sick Leave': 0,
      'Earned Leave': 0
    };

    approvedLeaves.forEach(lv => {
      const start = new Date(lv.startDate);
      const end = new Date(lv.endDate);
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      if (used[lv.leaveType] !== undefined) {
        used[lv.leaveType] += days;
      }
    });

    return {
      allocated: LEAVE_ALLOWANCES,
      used,
      remaining: {
        'Casual Leave': LEAVE_ALLOWANCES['Casual Leave'] - used['Casual Leave'],
        'Sick Leave': LEAVE_ALLOWANCES['Sick Leave'] - used['Sick Leave'],
        'Earned Leave': LEAVE_ALLOWANCES['Earned Leave'] - used['Earned Leave']
      }
    };
  }

  static async getMyLeaves(employeeId, page = 1, limit = 50) {
    if (!employeeId) {
      throw new Error('User profile not linked to an employee.');
    }
    const { data: history, meta } = await db.leaves.findPaginated({ employeeId }, page, limit);
    const balances = await this.getLeaveBalances(employeeId);
    return { history, balances, meta };
  }

  static async getPendingLeaves({ userRole, userEmployeeId, page = 1, limit = 50 }) {
    let query = {};
    
    if (userRole === 'MANAGER') {
      const allEmployees = await db.employees.find({ reportingManager: userEmployeeId });
      const teamEmpIds = allEmployees.map(emp => emp.employeeId);
        
      query.employeeId = { $in: teamEmpIds };
    }

    const { data: targetLeaves, meta } = await db.leaves.findPaginated(query, page, limit);
    
    let employeeIdsToFetch = [...new Set(targetLeaves.map(lv => lv.employeeId))];

    const employees = await db.employees.find({ employeeId: { $in: employeeIdsToFetch } });
    const empMap = employees.reduce((acc, emp) => {
      acc[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
      return acc;
    }, {});

    const enrichedLeaves = targetLeaves.map(lv => ({
      ...lv,
      employeeName: empMap[lv.employeeId] || 'Unknown'
    }));
    
    return { leaves: enrichedLeaves, meta };
  }

  static async applyForLeave({ employeeId, leaveType, startDate, endDate, reason }) {
    if (!employeeId) {
      throw new Error('User profile not linked to an employee.');
    }
    if (!leaveType || !startDate || !endDate || !reason) {
      throw new Error('All fields are required.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (start < today) {
      throw new Error('Start date cannot be in the past.');
    }
    if (end < start) {
      throw new Error('End date cannot be earlier than start date.');
    }

    const timeDiff = end.getTime() - start.getTime();
    const requestedDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const balances = await this.getLeaveBalances(employeeId);
    const remaining = balances.remaining[leaveType];

    if (remaining === undefined) {
      throw new Error('Invalid Leave Type.');
    }
    if (requestedDays > remaining) {
      throw new Error(`Insufficient leave balance. You requested ${requestedDays} days, but only have ${remaining} days remaining.`);
    }

    return await db.leaves.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      approvedBy: ''
    });
  }

  static async reviewLeave(id, { action, userEmployeeId }) {
    const leave = await db.leaves.findById(id);
    if (!leave) {
      throw new Error('Leave application not found.');
    }
    if (leave.status !== 'Pending') {
      throw new Error('Leave application has already been processed.');
    }

    const updated = await db.leaves.findByIdAndUpdate(id, {
      status: action,
      approvedBy: userEmployeeId || 'SUPER_ADMIN'
    });

    if (action === 'Approved') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      
      await db.notifications.create({
        recipientId: leave.employeeId,
        message: `Your ${leave.leaveType} request for ${leave.startDate} to ${leave.endDate} has been Approved.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      const hrUsers = await db.users.find({ role: 'HR' });
      const hrNotifications = hrUsers.map(hr => ({
        recipientId: hr.employeeId || hr._id,
        message: `Leave application approved for Employee ${leave.employeeId} (${days} days of ${leave.leaveType})`,
        read: false,
        createdAt: new Date().toISOString()
      }));
      
      for (const notif of hrNotifications) {
        await db.notifications.create(notif);
      }
    } else {
      await db.notifications.create({
        recipientId: leave.employeeId,
        message: `Your ${leave.leaveType} request for ${leave.startDate} to ${leave.endDate} was Rejected.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return updated;
  }
}
