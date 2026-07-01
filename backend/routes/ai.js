import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Context-aware workforce AI assistant
router.post('/chat', authenticateToken, async (req, res) => {
  const { message, customApiKey } = req.body;
  const user = req.user;
  const msg = message.toLowerCase();

  // 1. Gather employee data contexts for personalization
  let employee = null;
  let leaves = [];
  let attendance = [];
  let payroll = [];
  let performance = [];

  if (user.employeeId) {
    employee = await db.employees.findOne({ employeeId: user.employeeId });
    leaves = await db.leaves.find({ employeeId: user.employeeId });
    attendance = await db.attendance.find({ employeeId: user.employeeId });
    payroll = await db.payroll.find({ employeeId: user.employeeId });
    
    if (employee && employee.performanceReviews) {
      performance = employee.performanceReviews;
    }
  }

  // 2. Define standard company policy rules for reference
  const policies = `
  COMPANY POLICIES DOCUMENT:
  1. Office Timings: Core hours are 09:00 AM to 06:00 PM. Clock-ins after 09:15 AM are flagged as "Late Arrival".
  2. Leave Allowances: Annual allowances are 12 Casual Leaves, 10 Sick Leaves, and 15 Earned Leaves.
  3. Work From Home: Remote attendance is allowed subject to team lead approval and location coordinates reporting.
  4. Asset Return: All corporate assets (laptops, peripherals) must be returned to IT within 5 working days of exit.
  5. Help Desk SLA: Critical issues resolved in 4 hours, general issues in 24 hours.
  `;

  // 3. Fallback/Local AI engine with rich context calculations
  let responseText = "";

  if (msg.includes('leave') || msg.includes('holiday') || msg.includes('vacation')) {
    // Leave status calculations
    const casualUsed = leaves.filter(l => l.leaveType === 'Casual Leave' && l.status === 'Approved').length;
    const sickUsed = leaves.filter(l => l.leaveType === 'Sick Leave' && l.status === 'Approved').length;
    const earnedUsed = leaves.filter(l => l.leaveType === 'Earned Leave' && l.status === 'Approved').length;

    responseText = `### 📋 Your Leave Balances:
- **Casual Leave**: You have used **${casualUsed}** of **12** days. (Remaining: **${12 - casualUsed}** days)
- **Sick Leave**: You have used **${sickUsed}** of **10** days. (Remaining: **${10 - sickUsed}** days)
- **Earned Leave**: You have used **${earnedUsed}** of **15** days. (Remaining: **${15 - earnedUsed}** days)

**Note**: To apply for new leaves, navigate to the **Leave Dashboard** and submit a request. All requests require reporting manager approval.`;

  } else if (msg.includes('salary') || msg.includes('pay') || msg.includes('payslip') || msg.includes('finance')) {
    if (payroll.length === 0) {
      responseText = `I couldn't locate any generated payroll slips in your history. If you joined recently, please note that payroll is generated on the last day of each month by the Finance team.`;
    } else {
      const latestSlip = payroll[payroll.length - 1];
      responseText = `### 💰 Salary Explainer (${latestSlip.month}):
Here is the breakdown of your latest take-home salary of **Rs. ${latestSlip.netSalary}**:

- **Earnings**:
  - Basic Salary: Rs. ${latestSlip.basicSalary}
  - House Rent Allowance (HRA): Rs. ${latestSlip.hra}
  - Performance Bonus: Rs. ${latestSlip.bonus}
  - Overtime Payout: Rs. ${latestSlip.overtime} (${latestSlip.overtimeHours || 0} hrs worked)

- **Deductions**:
  - Provident Fund (PF): Rs. ${latestSlip.pf || Math.round(latestSlip.basicSalary * 0.12)}
  - Professional Tax: Rs. ${latestSlip.professionalTax || 200}
  - Attendance/Absent Deductions: Rs. ${latestSlip.deductions - (latestSlip.pf || 0) - (latestSlip.professionalTax || 200)}

*This payslip was processed on ${latestSlip.processedDate} and is marked as **Paid**.*`;
    }

  } else if (msg.includes('performance') || msg.includes('review') || msg.includes('kpi') || msg.includes('goals')) {
    if (performance.length === 0) {
      responseText = `### 📈 Performance Summary:
No performance reviews or Goal ratings have been posted for your profile in the current cycle yet. Performance reviews are run quarterly by department managers.`;
    } else {
      const latestReview = performance[performance.length - 1];
      responseText = `### 📈 Performance Summary (${latestReview.quarter}):
- **Manager Rating**: \`${latestReview.managerRating}/5\` (**${latestReview.overall}**)
- **KPI Delivery Score**: \`${latestReview.kpiScore}%\`
- **Feedback**: *"${latestReview.feedback}"*

*Review posted on ${latestReview.date || 'recently'}. Keep up the great work!*`;
    }

  } else if (msg.includes('attendance') || msg.includes('clock') || msg.includes('working hours') || msg.includes('overtime')) {
    const presentDays = attendance.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
    const lateDays = attendance.filter(a => a.status === 'Late').length;
    const totalHours = attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);

    responseText = `### ⏱️ Attendance Insights:
In the current tracking cycle, your attendance details are as follows:
- **Total Tracked Days**: ${attendance.length} days
- **Days Present / WFH**: ${presentDays} days
- **Late Arrivals**: ${lateDays} days (Flagged as check-ins after 09:15 AM)
- **Total Working Hours**: ${totalHours.toFixed(1)} hours

**Policy Reminder**: Standard check-in starts at **09:00 AM**. If you miss a clock-in, you can raise an **Attendance Correction Request** from the dashboard.`;

  } else if (msg.includes('policy') || msg.includes('office') || msg.includes('guidelines') || msg.includes('asset') || msg.includes('laptop')) {
    responseText = `### 🏢 Corporate Policies:
Here are the official organizational guidelines for your reference:

1. **Office Timings**: Standard office shift is **09:00 AM to 06:00 PM**. Late check-in grace period is up to **09:15 AM**.
2. **Work From Home (WFH)**: Remote check-in requires enabling GPS location. Long-term WFH requires Manager and HR approval.
3. **IT Asset Return Policy**: Employees exiting the organization must return all assigned gear (Laptops, Chargers, Accessories) to the IT department within **5 working days** of their final working day to clear exit approvals.
4. **IT Help Desk Escalations**: Standard support ticket resolution SLA is **24 hours**. Urgent system lockouts are resolved within **4 hours**.`;

  } else if (msg.includes('summarize') && msg.includes('note')) {
    responseText = `### 📝 Meeting Notes Summarizer:
I can help summarize meeting transcripts or notes! Please paste your meeting text, and I will extract the key agenda, decisions made, and actionable assignees.`;
  } else {
    // Default reply
    responseText = `### 👋 Hello ${user.name}! 
I am your **AI Operations Assistant**. I can help you with:
1. **Leave Balances**: Ask me *"How many leaves do I have left?"*
2. **Salary Slips**: Ask me *"Explain my salary"*
3. **Performance Reviews**: Ask me *"What is my manager rating?"*
4. **Attendance Stats**: Ask me *"Show my attendance details"*
5. **Corporate Policies**: Ask me *"What is the laptop return policy?"*

How can I assist you today?`;
  }

  // 4. Real Gemini Integration if API key is provided
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      // 4.1 Filter and limit context to recent data only (Phase 8.1)
      const recentLeaves = leaves.slice(-5);
      const recentAttendance = attendance.slice(-15);
      const recentPayroll = payroll.slice(-3);
      const recentPerformance = performance.slice(-2);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // 4.2 Use systemInstruction to isolate trusted prompt from user input (Phase 8.2)
            systemInstruction: {
              parts: [{
                text: `You are an Enterprise Workforce AI Assistant. Respond in markdown.
User Role: ${user.role}
Employee Details: ${JSON.stringify(employee)}
Leaves Details: ${JSON.stringify(recentLeaves)}
Attendance Details: ${JSON.stringify(recentAttendance)}
Payroll Details: ${JSON.stringify(recentPayroll)}
Performance Reviews: ${JSON.stringify(recentPerformance)}
Company Policies: ${policies}`
              }]
            },
            contents: [{
              role: "user",
              parts: [{
                text: message
              }]
            }]
          })
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        responseText = data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn("External Gemini API call failed. Falling back to local intelligence engine.", err);
    }
  }

  res.json({
    success: true,
    response: responseText,
    roleContext: user.role
  });
});

export default router;
