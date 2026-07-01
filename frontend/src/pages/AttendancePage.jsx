import React from 'react';
import { Clock, MapPin, CheckCircle } from 'lucide-react';

export default function AttendancePage({ attendance }) {
  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Biometric & Location Attendance Logs</h3>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Hours</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map(att => (
              <tr key={att._id}>
                <td>{att.date}</td>
                <td><Clock size={12} style={{marginRight:'4px'}}/> {att.clockIn}</td>
                <td>{att.clockOut ? <><Clock size={12} style={{marginRight:'4px'}}/> {att.clockOut}</> : '--:--'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ width: '60px' }}>
                      <div className="progress-fill" style={{ width: `${Math.min(100, (att.workingHours/8)*100)}%`, background: att.workingHours >= 8 ? 'var(--success)' : 'var(--warning)' }}></div>
                    </div>
                    <span>{att.workingHours}h</span>
                  </div>
                </td>
                <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <MapPin size={12} style={{marginRight:'4px'}}/> {att.location || 'Office (IP verified)'}
                </td>
                <td>
                  <span className={`badge badge-${att.status === 'Present' ? 'success' : (att.status === 'Late' ? 'warning' : 'primary')}`}>
                    {att.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
