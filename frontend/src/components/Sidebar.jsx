import React from 'react';
import { 
  Globe, BarChart3, Users, Briefcase, Clock, Calendar, 
  DollarSign, Award, Laptop, HelpCircle, LogOut 
} from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({
  userRole,
  userName,
  handleLogout
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract path from location to act as currentTab
  const currentTab = location.pathname === '/' ? 'overview' : location.pathname.substring(1).split('/')[0];

  const handleNav = (tab) => {
    navigate(tab === 'overview' ? '/' : `/${tab}`);
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Globe className="text-primary" size={24} />
        <span>WORKFORCE</span>
      </div>
      
      <nav className="sidebar-menu">
        <div className={`sidebar-item ${currentTab === 'overview' ? 'active' : ''}`} onClick={() => handleNav('overview')}>
          <BarChart3 size={18} /> Overview
        </div>
        
        {/* RBAC Sidebar display limits */}
        {['SUPER_ADMIN', 'HR'].includes(userRole) && (
          <div className={`sidebar-item ${currentTab === 'employees' ? 'active' : ''}`} onClick={() => handleNav('employees')}>
            <Users size={18} /> Employee Directory
          </div>
        )}

        {['SUPER_ADMIN', 'HR', 'MANAGER'].includes(userRole) && (
          <div className={`sidebar-item ${currentTab === 'recruitment' ? 'active' : ''}`} onClick={() => handleNav('recruitment')}>
            <Briefcase size={18} /> Recruitment Hub
          </div>
        )}

        <div className={`sidebar-item ${currentTab === 'attendance' ? 'active' : ''}`} onClick={() => handleNav('attendance')}>
          <Clock size={18} /> Attendance Logs
        </div>

        <div className={`sidebar-item ${currentTab === 'leaves' ? 'active' : ''}`} onClick={() => handleNav('leaves')}>
          <Calendar size={18} /> Leave Center
        </div>

        <div className={`sidebar-item ${currentTab === 'payroll' ? 'active' : ''}`} onClick={() => handleNav('payroll')}>
          <DollarSign size={18} /> Payroll Slips
        </div>

        <div className={`sidebar-item ${currentTab === 'projects' ? 'active' : ''}`} onClick={() => handleNav('projects')}>
          <Award size={18} /> Projects & Tasks
        </div>

        <div className={`sidebar-item ${currentTab === 'assets' ? 'active' : ''}`} onClick={() => handleNav('assets')}>
          <Laptop size={18} /> IT Assets
        </div>

        <div className={`sidebar-item ${currentTab === 'tickets' ? 'active' : ''}`} onClick={() => handleNav('tickets')}>
          <HelpCircle size={18} /> Help Desk
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">{userName ? userName[0] : 'U'}</div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">{userRole.replace('_', ' ')}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Log Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
