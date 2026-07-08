import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Users, Settings, LogOut, Clock, Calendar, DollarSign, Award, 
  Briefcase, Laptop, HelpCircle, Send, Bot, Bell, Plus, Search, 
  Check, X, ChevronRight, BarChart3, AlertTriangle, FileText, 
  CheckCircle2, MapPin, QrCode, MessageSquare, Menu, Globe
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import AiAssistant from './components/AiAssistant';
import DashboardOverview from './components/DashboardOverview';

import { Routes, Route, useLocation } from 'react-router-dom';
import EmployeesPage from './pages/EmployeesPage';
import RecruitmentPage from './pages/RecruitmentPage';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';
import PayrollPage from './pages/PayrollPage';
import ProjectsPage from './pages/ProjectsPage';
import AssetsPage from './pages/AssetsPage';
import TicketsPage from './pages/TicketsPage';
import SettingsPage from './pages/SettingsPage';

const API_BASE = import.meta.env.VITE_API_URL || ''; // Uses env variable for prod, Vite proxy in dev

// Helper to format currency
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export default function App() {
  // Navigation & User State
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [empId, setEmpId] = useState(localStorage.getItem('employeeId') || '');
  const [userName, setUserName] = useState(localStorage.getItem('name') || '');
  
  const location = useLocation();
  const currentTab = location.pathname === '/' ? 'overview' : location.pathname.substring(1).split('/')[0];

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Authentication Forms
  const [loginEmail, setLoginEmail] = useState('admin@company.com');
  const [loginPassword, setLoginPassword] = useState('Admin@123');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');

  // Global Data States (Shared across dashboards)
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);

  // AI Assistant Chat Panel State
  const [showAi, setShowAi] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiHistory, setAiHistory] = useState([
    { role: 'assistant', content: "### 👋 Hello! \nI am your **AI Operations Assistant**. I can look up your leave balances, explain your payslip, detail your performance ratings, or answer company policy questions. Try asking me:\n- *\"How many leaves do I have left?\"*\n- *\"Explain my salary breakdown\"*\n- *\"What is my performance rating?\"*\n- *\"What is the laptop return policy?\"*" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const chatEndRef = useRef(null);

  // Modals & New Entry States
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmpData, setNewEmpData] = useState({
    firstName: '', lastName: '', email: '', mobile: '', address: '', gender: 'Male',
    bloodGroup: 'O+', dob: '', department: '', designation: '', joiningDate: '',
    reportingManager: '', employmentType: 'Permanent', salaryGrade: 'Grade-B',
    basicSalary: 60000, hra: 12000
  });

  const [showAddDep, setShowAddDep] = useState(false);
  const [newDepData, setNewDepData] = useState({ departmentName: '', departmentCode: '', manager: '' });

  const [showAddProj, setShowAddProj] = useState(false);
  const [newProjData, setNewProjData] = useState({ projectName: '', description: '', manager: '', deadline: '' });

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ projectId: '', task: '', assignedTo: '', priority: 'Medium', deadline: '' });

  const [showAddTicket, setShowAddTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({ title: '', description: '', priority: 'Medium' });

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAssetData, setNewAssetData] = useState({ assetName: '', serialNumber: '', type: 'Laptop', assignedTo: '' });

  const [showAddCand, setShowAddCand] = useState(false);
  const [newCandData, setNewCandData] = useState({ candidateName: '', email: '', experience: 0, skills: '' });

  const [gpsSimulated, setGpsSimulated] = useState(false);
  const [qrSimulated, setQrSimulated] = useState(false);

  // Profile management modals
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwData, setChangePwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Load App Data on Login
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Scroll AI Chat to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiHistory]);

  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include' // Crucial for HttpOnly cookies
    };
    try {
      const res = await fetch(`${API_BASE}${url}`, fetchOptions);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && url !== '/api/auth/login' && url !== '/api/auth/refresh') {
          // Attempt refresh
          try {
            const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
            if (refreshRes.ok) {
              // Retry original request
              const retryRes = await fetch(`${API_BASE}${url}`, fetchOptions);
              const retryData = await retryRes.json();
              if (!retryRes.ok) throw new Error(retryData.message || 'Something went wrong');
              return retryData;
            }
          } catch (e) {
            // Refresh failed, logout
            handleLogout();
            throw new Error('Session expired');
          }
        }
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error(`API Fetch Error [${url}]:`, err);
      throw err;
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [
        depRes, empRes, candRes, attRes, lvRes, payRes, projRes, tskRes, assetRes, tktRes
      ] = await Promise.allSettled([
        apiFetch('/api/organization/departments'),
        apiFetch('/api/employees'),
        apiFetch('/api/recruitment/candidates'),
        apiFetch('/api/attendance/my'),
        apiFetch('/api/leaves/my'),
        apiFetch('/api/payroll/history'),
        apiFetch('/api/projects'),
        apiFetch('/api/projects/tasks'),
        apiFetch('/api/assets'),
        apiFetch('/api/tickets')
      ]);

      if (depRes.status === 'fulfilled' && depRes.value.success) setDepartments(depRes.value.departments);
      if (empRes.status === 'fulfilled' && empRes.value.success) setEmployees(empRes.value.employees);
      if (candRes.status === 'fulfilled' && candRes.value.success) setCandidates(candRes.value.candidates);
      if (attRes.status === 'fulfilled' && attRes.value.success) setAttendance(attRes.value.attendance);
      if (lvRes.status === 'fulfilled' && lvRes.value.success) setLeaves(lvRes.value.history || []);
      if (payRes.status === 'fulfilled' && payRes.value.success) setPayroll(payRes.value.payrolls);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.projects);
      if (tskRes.status === 'fulfilled' && tskRes.value.success) setTasks(tskRes.value.tasks);
      if (assetRes.status === 'fulfilled' && assetRes.value.success) setAssets(assetRes.value.assets);
      if (tktRes.status === 'fulfilled' && tktRes.value.success) setTickets(tktRes.value.tickets);
    } catch (err) {
      console.warn("Failed to contact backend API. App running with mock simulation data.");
      loadFallbackMockData();
    }
  };

  const loadFallbackMockData = () => {
    // Basic Offline Sandbox fallbacks
    setDepartments([
      { _id: '1', departmentName: 'Engineering', departmentCode: 'ENG', manager: 'EMP002', employees: 82, status: 'Active' },
      { _id: '2', departmentName: 'HR', departmentCode: 'HR', manager: 'EMP001', employees: 5, status: 'Active' },
      { _id: '3', departmentName: 'Finance', departmentCode: 'FIN', manager: 'EMP004', employees: 3, status: 'Active' }
    ]);
    setEmployees([
      { _id: 'e1', employeeId: 'EMP001', firstName: 'Sarah', lastName: 'Jenkins', email: 'hr@company.com', mobile: '9876543210', department: 'HR', designation: 'HR Director', joiningDate: '2024-01-10', reportingManager: 'EMP002', status: 'Active', basicSalary: 80000 },
      { _id: 'e2', employeeId: 'EMP002', firstName: 'David', lastName: 'Miller', email: 'manager@company.com', mobile: '9876543211', department: 'Engineering', designation: 'Engineering Manager', joiningDate: '2023-06-01', status: 'Active', basicSalary: 120000 },
      { _id: 'e3', employeeId: 'EMP003', firstName: 'Rahul', lastName: 'Sharma', email: 'employee@company.com', mobile: '9876543212', department: 'Engineering', designation: 'Software Engineer', joiningDate: '2026-01-15', reportingManager: 'EMP002', status: 'Active', basicSalary: 60000, performanceReviews: [{ quarter: 'Q2', kpiScore: 88, managerRating: 4, overall: 'Excellent', feedback: 'Great team player. Delivers sprints on schedule.' }] }
    ]);
    setCandidates([
      { _id: 'c1', candidateName: 'Priya Singh', email: 'priya@gmail.com', experience: 2, skills: ['React', 'NodeJS', 'MongoDB'], status: 'Technical Interview', aiAnalysis: { score: '88%', matchedSkills: ['React', 'Node.js', 'MongoDB'], missingSkills: ['Docker', 'AWS'], summary: 'Solid frontend skillset matching our core product line.' } }
    ]);
    setAttendance([
      { _id: 'a1', date: '2026-07-01', clockIn: '08:58', clockOut: '18:02', workingHours: 9.07, status: 'Present', overtime: 1.07 }
    ]);
    setLeaves([
      { _id: 'l1', leaveType: 'Casual Leave', startDate: '2026-07-15', endDate: '2026-07-16', reason: 'Family trip', status: 'Approved' }
    ]);
    setPayroll([
      { _id: 'p1', month: 'June 2026', basicSalary: 60000, hra: 12000, bonus: 5000, overtime: 3000, deductions: 2500, netSalary: 77500, status: 'Paid', processedDate: '2026-06-30' }
    ]);
    setProjects([
      { _id: 'pr1', projectName: 'Employee Portal', description: 'Enterprise Workforce Management Tool', manager: 'EMP002', status: 'In Progress', deadline: '2026-09-30' }
    ]);
    setTasks([
      { _id: 't1', projectId: 'pr1', project: 'Employee Portal', task: 'Build Attendance Module', assignedTo: 'EMP003', priority: 'High', status: 'In Progress', deadline: '2026-08-15' }
    ]);
    setAssets([
      { _id: 'as1', assetName: 'MacBook Pro 16"', serialNumber: 'MBP-2026-X99', type: 'Laptop', assignedTo: 'EMP003', status: 'Assigned' }
    ]);
    setTickets([
      { _id: 'tk1', employeeId: 'EMP003', title: 'VPN Access Request', description: 'Need credentials for remote staging server.', priority: 'Medium', status: 'Open' }
    ]);
  };

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('employeeId', data.employeeId || '');
        localStorage.setItem('name', data.name);

        setIsAuthenticated(true);
        setUserRole(data.role);
        setUserId(data.userId);
        setEmpId(data.employeeId || '');
        setUserName(data.name);
        
        setAuthSuccess('Welcome back!');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed. Verify credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole('');
    setUserId('');
    setEmpId('');
    setUserName('');
    setCurrentTab('overview');
  };

  // Clock operations (FR-A01 / GPS simulation)
  const handleClockIn = async (isWfh) => {
    try {
      let lat = null, lon = null;
      if (gpsSimulated) {
        lat = '12.9716';
        lon = '77.5946'; // Bangalore coordinates
      }
      const data = await apiFetch('/api/attendance/clock-in', {
        method: 'POST',
        body: JSON.stringify({ latitude: lat, longitude: lon, isWfh, qrScanned: qrSimulated })
      });
      if (data.success) {
        alert(data.message);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const data = await apiFetch('/api/attendance/clock-out', { method: 'POST' });
      if (data.success) {
        alert(data.message);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // AI assistant chat logic
  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    const userMsg = aiMessage;
    setAiMessage('');
    setAiHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);

    try {
      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg, customApiKey })
      });
      if (data.success) {
        setAiHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) {
      setAiHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I couldn't reach the AI services server. Please ensure the backend is running. Fallback: Your profile code is linked to role **${userRole}**.` 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Action submit handlers (Forms CRUD)
  const handleCreateEmp = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(newEmpData)
      });
      if (data.success) {
        alert(`Employee registered! ID: ${data.employee.employeeId}. Password is ${data.generatedCredentials.password}`);
        setShowAddEmp(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateDep = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/organization/departments', {
        method: 'POST',
        body: JSON.stringify(newDepData)
      });
      if (data.success) {
        setShowAddDep(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCand = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/recruitment/candidates', {
        method: 'POST',
        body: JSON.stringify(newCandData)
      });
      if (data.success) {
        setShowAddCand(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResumeAnalysis = async (candidateId) => {
    try {
      const data = await apiFetch(`/api/recruitment/candidates/${candidateId}/analyze-resume`, { method: 'POST' });
      if (data.success) {
        alert(`Resume analysis complete! Candidate score: ${data.analysis.score}`);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateProj = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProjData)
      });
      if (data.success) {
        setShowAddProj(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/projects/tasks', {
        method: 'POST',
        body: JSON.stringify(newTaskData)
      });
      if (data.success) {
        setShowAddTask(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(newTicketData)
      });
      if (data.success) {
        setShowAddTicket(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/assets', {
        method: 'POST',
        body: JSON.stringify(newAssetData)
      });
      if (data.success) {
        setShowAddAsset(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Run monthly payroll runner
  const handleRunPayroll = async () => {
    const month = prompt("Enter Month (e.g., 'July 2026')");
    if (!month) return;
    try {
      const data = await apiFetch('/api/payroll/run', {
        method: 'POST',
        body: JSON.stringify({ month })
      });
      if (data.success) {
        alert(data.message);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Task Kanban column transitions
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const data = await apiFetch(`/api/projects/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Leave approval triggers
  const handleLeaveReview = async (leaveId, action) => {
    try {
      const data = await apiFetch(`/api/leaves/review/${leaveId}`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      if (data.success) {
        alert(`Leave application ${action} successfully.`);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Auth UI Rendering if not logged in
  if (!isAuthenticated) {
    return (
      <Auth 
        handleLogin={handleLogin}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        authError={authError}
        authSuccess={authSuccess}
      />
    );
  }

  // Dashboard Main Portal Interface
  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar 
        userRole={userRole}
        userName={userName}
        handleLogout={handleLogout}
      />

      {/* Main panel content */}
      <main className="main-wrapper">
        <header className="top-bar">
          <div>
            <h1 className="page-title">{currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Dashboard</h1>
            <p className="page-subtitle">Welcome back, {userName}. Managing operations smoothly.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Custom Dev API setting bar */}
            <div style={{ display: 'flex', gap: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
              <Bot size={13} style={{ color: 'var(--primary)' }} />
              <input 
                type="password" 
                placeholder="Optional Gemini Key" 
                style={{ background: 'transparent', border: 'none', color: 'white', width: '120px', fontSize: '11px', outline: 'none' }}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 12px', width: 'auto', borderRadius: '50%' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={16} />
              </button>
              {showNotifications && (
                <div className="glass-card" style={{ position: 'absolute', right: 0, top: '48px', width: '320px', zIndex: 1000, padding: '16px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-glass-active)' }}>
                  <h4 style={{ marginBottom: '12px' }}>Notifications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No new alerts.</p>
                    ) : (
                      notifications.map((not, idx) => (
                        <div key={idx} style={{ padding: '8px', borderBottom: '1px solid var(--border-glass)', fontSize: '12px' }}>
                          {not.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={
            <DashboardOverview 
              employees={employees} projects={projects} leaves={leaves}
              assets={assets} tasks={tasks} gpsSimulated={gpsSimulated}
              setGpsSimulated={setGpsSimulated} qrSimulated={qrSimulated}
              setQrSimulated={setQrSimulated} handleClockIn={handleClockIn}
              handleClockOut={handleClockOut}
            />
          } />
          
          <Route path="/employees" element={
            <EmployeesPage 
              userRole={userRole} employees={employees} departments={departments}
              showAddEmp={showAddEmp} setShowAddEmp={setShowAddEmp}
              newEmpData={newEmpData} setNewEmpData={setNewEmpData}
              handleCreateEmp={handleCreateEmp}
            />
          } />

          <Route path="/recruitment" element={
            <RecruitmentPage 
              candidates={candidates} showAddCand={showAddCand}
              setShowAddCand={setShowAddCand} newCandData={newCandData}
              setNewCandData={setNewCandData} handleCreateCand={handleCreateCand}
              handleResumeAnalysis={handleResumeAnalysis}
            />
          } />

          <Route path="/attendance" element={<AttendancePage attendance={attendance} />} />
          
          <Route path="/leaves" element={<LeavePage leaves={leaves} handleApplyLeave={handleApplyLeave} />} />
          
          <Route path="/payroll" element={<PayrollPage payroll={payroll} />} />
          
          <Route path="/projects" element={
            <ProjectsPage 
              projects={projects} showAddProj={showAddProj} setShowAddProj={setShowAddProj}
              newProjData={newProjData} setNewProjData={setNewProjData} handleCreateProj={handleCreateProj}
              tasks={tasks} showAddTask={showAddTask} setShowAddTask={setShowAddTask}
              newTaskData={newTaskData} setNewTaskData={setNewTaskData} handleCreateTask={handleCreateTask}
              employees={employees}
            />
          } />
          
          <Route path="/assets" element={
            <AssetsPage 
              userRole={userRole} assets={assets} showAddAsset={showAddAsset}
              setShowAddAsset={setShowAddAsset} newAssetData={newAssetData}
              setNewAssetData={setNewAssetData} handleCreateAsset={handleCreateAsset}
              employees={employees}
            />
          } />
          
          <Route path="/tickets" element={
            <TicketsPage 
              tickets={tickets} showAddTicket={showAddTicket} setShowAddTicket={setShowAddTicket}
              newTicketData={newTicketData} setNewTicketData={setNewTicketData} handleCreateTicket={handleCreateTicket}
            />
          } />
          
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      
      </main>

      <AiAssistant 
        showAi={showAi}
        setShowAi={setShowAi}
        aiHistory={aiHistory}
        aiLoading={aiLoading}
        chatEndRef={chatEndRef}
        handleSendAiMessage={handleSendAiMessage}
        aiMessage={aiMessage}
        setAiMessage={setAiMessage}
      />
    </div>
  );
}
