import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';

export default function TicketsPage({
  tickets, showAddTicket, setShowAddTicket,
  newTicketData, setNewTicketData, handleCreateTicket
}) {
  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>IT Help Desk & Support Tickets</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddTicket(true)}>
          <Plus size={16} /> Raise Ticket
        </button>
      </div>

      {showAddTicket && (
        <form onSubmit={handleCreateTicket} className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--border-glass-active)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Subject</label>
              <input type="text" className="form-input" required onChange={e => setNewTicketData({...newTicketData, title: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" required onChange={e => setNewTicketData({...newTicketData, description: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" required onChange={e => setNewTicketData({...newTicketData, priority: e.target.value})}>
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddTicket(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Submit Ticket</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {tickets.map(tkt => (
          <div key={tkt._id} className="glass-card" style={{ borderLeft: `4px solid ${tkt.priority === 'Critical' ? 'var(--danger)' : (tkt.priority === 'High' ? 'var(--warning)' : 'var(--primary)')}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tkt.priority === 'Critical' && <AlertCircle size={14} color="var(--danger)" />}
                {tkt.title}
              </h4>
              <span className={`badge badge-${tkt.status === 'Open' ? 'warning' : 'success'}`}>{tkt.status}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{tkt.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>ID: {tkt._id.substring(0,8)}</span>
              <span>Priority: {tkt.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
