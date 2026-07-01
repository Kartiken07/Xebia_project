import React from 'react';
import { DollarSign } from 'lucide-react';

export default function PayrollPage({ payroll }) {
  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Payroll & Compensation Records</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }}>
          <DollarSign size={16} /> Run Payroll Cycle
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Basic Salary</th>
              <th>Allowances</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Disbursed On</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map(pay => (
              <tr key={pay._id}>
                <td><strong>{pay.month}</strong></td>
                <td>₹{pay.basicSalary.toLocaleString()}</td>
                <td style={{ color: 'var(--success)' }}>+₹{(pay.hra + pay.bonus + pay.overtime).toLocaleString()}</td>
                <td style={{ color: 'var(--danger)' }}>-₹{pay.deductions.toLocaleString()}</td>
                <td><strong>₹{pay.netSalary.toLocaleString()}</strong></td>
                <td><span className={`badge badge-${pay.status === 'Paid' ? 'success' : 'warning'}`}>{pay.status}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pay.processedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
