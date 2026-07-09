/**
 * Comprehensive API Tester — tests every endpoint against localhost:5005
 * Uses correct field names matching the actual route handlers
 */
const BASE = 'http://localhost:5005';

async function test(name, method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    const status = res.status;
    const ok = status >= 200 && status < 400;
    console.log(`${ok ? '✅' : '❌'} [${status}] ${method} ${path} — ${name}`);
    if (!ok) console.log(`   Response:`, JSON.stringify(data).slice(0, 300));
    return { ok, status, data };
  } catch (err) {
    console.log(`❌ [ERR] ${method} ${path} — ${name}: ${err.message}`);
    return { ok: false, status: 0, data: {} };
  }
}

async function run() {
  console.log('\n========== API TEST SUITE ==========\n');

  // 1. Health
  await test('Health Check', 'GET', '/api/health');

  // 2. Auth — Login (get token)
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie') || '';
  const match = cookies.match(/accessToken=([^;]+)/);
  const token = match ? match[1] : '';
  console.log(`${loginRes.ok ? '✅' : '❌'} [${loginRes.status}] POST /api/auth/login — Admin Login (token: ${token ? 'YES' : 'NO'})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `accessToken=${token}`,
  };

  async function authTest(name, method, path, body = null) {
    const opts = { method, headers: authHeaders };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(`${BASE}${path}`, opts);
      const data = await res.json().catch(() => ({}));
      const status = res.status;
      const ok = status >= 200 && status < 400;
      console.log(`${ok ? '✅' : '❌'} [${status}] ${method} ${path} — ${name}`);
      if (!ok) console.log(`   Response:`, JSON.stringify(data).slice(0, 300));
      return { ok, status, data };
    } catch (err) {
      console.log(`❌ [ERR] ${method} ${path} — ${name}: ${err.message}`);
      return { ok: false, status: 0, data: {} };
    }
  }

  // 3. Employees
  console.log('\n--- EMPLOYEES ---');
  await authTest('List Employees', 'GET', '/api/employees');
  const empRes = await authTest('Create Employee', 'POST', '/api/employees', {
    firstName: 'Jane',
    lastName: 'Doe',
    email: `jane.doe.${Date.now()}@company.com`,
    department: 'Engineering',
    designation: 'QA Engineer',
    joiningDate: '2026-02-01',
    basicSalary: 60000,
    hra: 12000,
  });

  // 4. Departments
  console.log('\n--- DEPARTMENTS ---');
  await authTest('List Departments', 'GET', '/api/organization/departments');
  await authTest('Create Department', 'POST', '/api/organization/departments', {
    departmentName: `Marketing-${Date.now()}`,
    departmentCode: `MKT-${Date.now()}`,
    manager: 'TBD',
  });

  // 5. Recruitment
  console.log('\n--- RECRUITMENT ---');
  await authTest('List Candidates', 'GET', '/api/recruitment/candidates');
  await authTest('Add Candidate', 'POST', '/api/recruitment/candidates', {
    candidateName: 'Bob Applicant',
    email: `bob.${Date.now()}@example.com`,
    experience: 3,
    skills: 'React, Node.js',
  });

  // 6. Attendance
  console.log('\n--- ATTENDANCE ---');
  await authTest('My Attendance', 'GET', '/api/attendance/my');
  await authTest('Clock In', 'POST', '/api/attendance/clock-in');

  // 7. Leaves
  console.log('\n--- LEAVES ---');
  await authTest('My Leaves', 'GET', '/api/leaves/my');
  await authTest('Pending Leaves', 'GET', '/api/leaves/pending');
  await authTest('Apply Leave', 'POST', '/api/leaves/apply', {
    leaveType: 'Sick Leave',
    startDate: '2026-07-15',
    endDate: '2026-07-16',
    reason: 'Not feeling well',
  });

  // 8. Payroll
  console.log('\n--- PAYROLL ---');
  await authTest('Payroll History', 'GET', '/api/payroll/history');

  // 9. Projects
  console.log('\n--- PROJECTS ---');
  await authTest('List Projects', 'GET', '/api/projects');
  const projRes = await authTest('Create Project', 'POST', '/api/projects', {
    projectName: 'Website Redesign',
    description: 'Redesign the company website with modern UI',
    manager: 'David Miller',
    deadline: '2026-12-31',
  });

  // 10. Tasks
  console.log('\n--- TASKS ---');
  await authTest('List Tasks', 'GET', '/api/projects/tasks');

  // 11. Assets
  console.log('\n--- ASSETS ---');
  await authTest('List Assets', 'GET', '/api/assets');
  await authTest('Create Asset', 'POST', '/api/assets', {
    assetName: 'MacBook Pro 16"',
    type: 'Laptop',
    serialNumber: `MBP-${Date.now()}`,
    status: 'Available',
  });

  // 12. Tickets
  console.log('\n--- TICKETS ---');
  await authTest('List Tickets', 'GET', '/api/tickets');
  await authTest('Create Ticket', 'POST', '/api/tickets', {
    title: 'VPN not connecting',
    description: 'Cannot connect to company VPN from home network',
    priority: 'Medium',
  });

  // 13. Audit Logs
  console.log('\n--- AUDIT LOGS ---');
  await authTest('Audit Logs', 'GET', '/api/organization/audit-logs');

  // 14. Auth Profile
  console.log('\n--- AUTH ---');
  await authTest('Get Profile', 'GET', '/api/auth/profile');
  await authTest('Forgot Password', 'POST', '/api/auth/forgot-password', {
    email: 'admin@company.com',
  });

  console.log('\n========== TEST COMPLETE ==========\n');
}

run();
