import { db, withTransaction } from '../db.js';

export class PayrollService {
  static async getHistory({ userRole, userEmployeeId, page = 1, limit = 50 }) {
    const isPrivileged = ['SUPER_ADMIN', 'HR', 'FINANCE'].includes(userRole);
    
    let query = {};
    if (!isPrivileged) {
      if (!userEmployeeId) {
        throw new Error('User is not linked to any employee record.');
      }
      query.employeeId = userEmployeeId;
    }

    const { data: allPayrolls, meta } = await db.payroll.findPaginated(query, page, limit);
    const employeeIds = [...new Set(allPayrolls.map(p => p.employeeId).filter(Boolean))];
    const employees = await db.employees.find({ employeeId: { $in: employeeIds } });
    
    const empMap = employees.reduce((acc, emp) => {
      acc[emp.employeeId] = emp;
      return acc;
    }, {});

    const enriched = allPayrolls.map(pay => {
      const emp = empMap[pay.employeeId];
      return {
        ...pay,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        department: emp ? emp.department : 'N/A'
      };
    });

    return { payrolls: enriched, meta };
  }

  static async runPayroll({ month, userId }) {
    const existingMonth = await db.payroll.findOne({ month });
    if (existingMonth) {
      throw new Error(`Payroll for ${month} has already been run.`);
    }

    const employees = await db.employees.find({ status: 'Active' });
    const employeeIds = employees.map(e => e.employeeId);
    
    // Pre-fetch all attendance logs for active employees (optimizes N+1)
    const allAttendanceLogs = await db.attendance.find({ employeeId: { $in: employeeIds } });
    const attendanceByEmp = allAttendanceLogs.reduce((acc, log) => {
      if (!acc[log.employeeId]) acc[log.employeeId] = [];
      // Ideally we would filter by month here, but attendance date parsing depends on the format.
      // Assuming we just use their entire attendance history for now as per original code logic.
      acc[log.employeeId].push(log);
      return acc;
    }, {});

    const results = [];

    await withTransaction(async (session) => {
      for (const emp of employees) {
        const attendanceLogs = attendanceByEmp[emp.employeeId] || [];
        const absentDaysCount = attendanceLogs.filter(att => att.status === 'Absent').length;

        const totalOvertimeHours = attendanceLogs.reduce((sum, att) => sum + (att.overtime || 0), 0);
        const overtimeRate = 500;
        const overtimePayout = totalOvertimeHours * overtimeRate;

        const dailyWage = Math.round(emp.basicSalary / 30);
        const leaveDeduction = absentDaysCount * dailyWage;

        const basic = emp.basicSalary || 50000;
        const hra = emp.hra || 10000;
        const bonus = 5000;
        const pf = Math.round(basic * 0.12);
        const professionalTax = 200;
        
        const grossSalary = basic + hra + bonus + overtimePayout;
        const totalDeductions = pf + professionalTax + leaveDeduction;
        const netSalary = grossSalary - totalDeductions;

        const payRecord = await db.payroll.create({
          employeeId: emp.employeeId,
          month,
          basicSalary: basic,
          hra,
          bonus,
          overtime: overtimePayout,
          deductions: totalDeductions,
          netSalary,
          pf,
          professionalTax,
          absentDays: absentDaysCount,
          overtimeHours: totalOvertimeHours,
          status: 'Paid',
          processedDate: new Date().toISOString().split('T')[0]
        }, { session });

        results.push(payRecord);

        await db.notifications.create({
          recipientId: emp.employeeId,
          message: `Your payslip for ${month} has been generated. Net Credit: Rs. ${netSalary}`,
          read: false,
          createdAt: new Date().toISOString()
        }, { session });
      }

      await db.auditLogs.create({
        userId,
        action: 'Run Payroll',
        details: `Successfully completed monthly payroll process for ${month}`,
        timestamp: new Date().toISOString()
      }, { session });
    });

    return results;
  }
}
