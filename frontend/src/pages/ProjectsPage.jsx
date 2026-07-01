import React from 'react';
import { Plus } from 'lucide-react';

export default function ProjectsPage({ 
  projects, showAddProj, setShowAddProj, newProjData, setNewProjData, handleCreateProj,
  tasks, showAddTask, setShowAddTask, newTaskData, setNewTaskData, handleCreateTask,
  employees
}) {
  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Project Portfolio & Task Tracking</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddTask(true)}>
            <Plus size={16} /> Assign Task
          </button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddProj(true)}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {showAddProj && (
        <form onSubmit={handleCreateProj} className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--border-glass-active)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input type="text" className="form-input" required onChange={e => setNewProjData({...newProjData, projectName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Manager (Emp ID)</label>
              <select className="form-input" required onChange={e => setNewProjData({...newProjData, manager: e.target.value})}>
                <option value="">Select Manager</option>
                {employees.map(emp => <option key={emp._id} value={emp.employeeId}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-input" required onChange={e => setNewProjData({...newProjData, deadline: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" required onChange={e => setNewProjData({...newProjData, description: e.target.value})}></textarea>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddProj(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Create Project</button>
          </div>
        </form>
      )}

      {showAddTask && (
        <form onSubmit={handleCreateTask} className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--border-glass-active)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Project</label>
              <select className="form-input" required onChange={e => setNewTaskData({...newTaskData, projectId: e.target.value})}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-input" required onChange={e => setNewTaskData({...newTaskData, assignedTo: e.target.value})}>
                <option value="">Select Employee</option>
                {employees.map(emp => <option key={emp._id} value={emp.employeeId}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" required onChange={e => setNewTaskData({...newTaskData, priority: e.target.value})}>
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-input" required onChange={e => setNewTaskData({...newTaskData, deadline: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Task Description</label>
              <input type="text" className="form-input" required onChange={e => setNewTaskData({...newTaskData, task: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddTask(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Assign Task</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4 style={{ marginBottom: '16px' }}>Active Projects</h4>
          {projects.map(proj => (
            <div key={proj._id} className="glass-card" style={{ marginBottom: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '15px' }}>{proj.projectName}</strong>
                <span className="badge badge-primary">{proj.status}</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{proj.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>Manager: {proj.manager}</span>
                <span>Due: {proj.deadline}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 style={{ marginBottom: '16px' }}>Task Board</h4>
          {tasks.map(tsk => (
            <div key={tsk._id} className="glass-card" style={{ marginBottom: '12px', padding: '16px', borderLeft: `3px solid ${tsk.priority === 'High' ? 'var(--danger)' : 'var(--primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px' }}>{tsk.task}</strong>
                <span className="badge badge-warning">{tsk.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Project: {tsk.project}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px' }}>
                <span>Assignee: {tsk.assignedTo}</span>
                <span style={{ color: tsk.priority === 'High' ? 'var(--danger)' : 'inherit' }}>{tsk.priority} Priority</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
