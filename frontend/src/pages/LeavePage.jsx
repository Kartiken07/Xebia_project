import React from 'react';
import { Calendar } from 'lucide-react';

export default function LeavePage({ leaves, handleApplyLeave }) {
  const [showApplyLeave, setShowApplyLeave] = React.useState(false);
  const [leaveForm, setLeaveForm] = React.useState({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });

  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Leave & Absence Management</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowApplyLeave(!showApplyLeave)}>
          <Calendar size={16} /> Apply Leave
        </button>
      </div>

      {showApplyLeave && (
        <form onSubmit={(e) => {
          e.preventDefault();
          handleApplyLeave(leaveForm);
          setShowApplyLeave(false);
        }} className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--border-glass-active)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select className="form-input" onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})}>
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Earned Leave</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '2' }}>
              <label className="form-label">Reason</label>
              <input type="text" className="form-input" required onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" required onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" required onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowApplyLeave(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Submit Application</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map(lv => (
              <tr key={lv._id}>
                <td>{lv.leaveType}</td>
                <td>{lv.startDate} to {lv.endDate}</td>
                <td>{lv.reason}</td>
                <td>
                  <span className={`badge badge-${lv.status === 'Approved' ? 'success' : (lv.status === 'Pending' ? 'warning' : 'danger')}`}>
                    {lv.status}
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
