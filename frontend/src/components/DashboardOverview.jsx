import React from 'react';
import { Users, Briefcase, Calendar, Laptop, MapPin, Globe, LogOut } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function DashboardOverview({
  employees,
  projects,
  leaves,
  assets,
  tasks,
  gpsSimulated,
  setGpsSimulated,
  qrSimulated,
  setQrSimulated,
  handleClockIn,
  handleClockOut
}) {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div>
            <div className="metric-label">Active Employees</div>
            <div className="metric-val">{employees.length}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <Users size={20} />
          </div>
        </div>
        <div className="glass-card metric-card">
          <div>
            <div className="metric-label">Active Projects</div>
            <div className="metric-val">{projects.length}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'var(--secondary-glow)', color: 'var(--secondary)' }}>
            <Briefcase size={20} />
          </div>
        </div>
        <div className="glass-card metric-card">
          <div>
            <div className="metric-label">Leaves Taken</div>
            <div className="metric-val">{leaves.filter(l => l.status === 'Approved').length}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>
            <Calendar size={20} />
          </div>
        </div>
        <div className="glass-card metric-card">
          <div>
            <div className="metric-label">IT Assets Assigned</div>
            <div className="metric-val">{assets.filter(a => a.status === 'Assigned').length}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--info)' }}>
            <Laptop size={20} />
          </div>
        </div>
      </div>

      {/* Dashboard Graphs Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Organization Growth & Workloads</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={[
                { name: 'Jan', Employees: 10, Tasks: 15 },
                { name: 'Feb', Employees: 12, Tasks: 24 },
                { name: 'Mar', Employees: 15, Tasks: 32 },
                { name: 'Apr', Employees: 18, Tasks: 45 },
                { name: 'May', Employees: 22, Tasks: 50 },
                { name: 'Jun', Employees: employees.length || 24, Tasks: tasks.length || 65 }
              ]}>
                <defs>
                  <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTsk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-glass)' }} />
                <Area type="monotone" dataKey="Employees" stroke="var(--primary)" fillOpacity={1} fill="url(#colorEmp)" />
                <Area type="monotone" dataKey="Tasks" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorTsk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Quick Self Clock-In</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
              <span>Simulate GPS Mode</span>
              <button 
                className={`badge ${gpsSimulated ? 'badge-success' : 'badge-danger'}`}
                onClick={() => setGpsSimulated(!gpsSimulated)}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {gpsSimulated ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
              <span>Simulate Office QR Scan</span>
              <button 
                className={`badge ${qrSimulated ? 'badge-success' : 'badge-danger'}`}
                onClick={() => setQrSimulated(!qrSimulated)}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {qrSimulated ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-primary" onClick={() => handleClockIn(false)}>
                <MapPin size={16} /> Office Clock-In
              </button>
              <button className="btn btn-secondary" onClick={() => handleClockIn(true)}>
                <Globe size={16} /> WFH Clock-In
              </button>
            </div>
            <button className="btn btn-secondary" style={{ borderColor: 'var(--danger-glow)', color: 'var(--danger)' }} onClick={handleClockOut}>
              <LogOut size={16} /> Clock-Out Daily Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
