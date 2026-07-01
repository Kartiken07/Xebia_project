import React from 'react';
import { Plus } from 'lucide-react';

export default function EmployeesPage({
  userRole, employees, departments, showAddEmp, setShowAddEmp, 
  newEmpData, setNewEmpData, handleCreateEmp
}) {
  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Active Workforce Profile Catalog</h3>
        {['SUPER_ADMIN', 'HR'].includes(userRole) && (
          <button 
            className="btn btn-primary" 
            style={{ width: 'auto' }} 
            onClick={() => setShowAddEmp(true)}
            aria-label="Register Employee"
            aria-expanded={showAddEmp}
          >
            <Plus size={16} aria-hidden="true" /> Register Employee
          </button>
        )}
      </div>

      {showAddEmp && (
        <form onSubmit={handleCreateEmp} className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--border-glass-active)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" required onChange={e => setNewEmpData({...newEmpData, firstName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" required onChange={e => setNewEmpData({...newEmpData, lastName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required onChange={e => setNewEmpData({...newEmpData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" onChange={e => setNewEmpData({...newEmpData, department: e.target.value})}>
                <option value="">Select Dept</option>
                {departments.map(d => <option key={d._id} value={d.departmentName}>{d.departmentName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input type="text" className="form-input" required onChange={e => setNewEmpData({...newEmpData, designation: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input type="date" className="form-input" required onChange={e => setNewEmpData({...newEmpData, joiningDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Basic Monthly Salary (Rs.)</label>
              <input type="number" className="form-input" required onChange={e => setNewEmpData({...newEmpData, basicSalary: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">HRA Allowance (Rs.)</label>
              <input type="number" className="form-input" required onChange={e => setNewEmpData({...newEmpData, hra: parseFloat(e.target.value)})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddEmp(false)} aria-label="Cancel Registration">Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} aria-label="Submit Registration">Submit Registration</button>
          </div>
        </form>
      )}

      <div className="table-container" role="region" aria-label="Employees Table" tabIndex="0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Salary Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp._id}>
                <td><code>{emp.employeeId}</code></td>
                <td>{emp.firstName} {emp.lastName}</td>
                <td>{emp.email}</td>
                <td>{emp.department}</td>
                <td>{emp.designation}</td>
                <td>{emp.salaryGrade}</td>
                <td><span className="badge badge-success">{emp.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
