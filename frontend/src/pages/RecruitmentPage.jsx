import React from 'react';
import { Plus, Check, FileText } from 'lucide-react';

export default function RecruitmentPage({
  candidates, showAddCand, setShowAddCand, 
  newCandData, setNewCandData, handleCreateCand, handleResumeAnalysis
}) {
  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Hiring Pipeline & AI Resume Analyzer</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddCand(true)}>
          <Plus size={16} /> New Application
        </button>
      </div>

      {showAddCand && (
        <form onSubmit={handleCreateCand} className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--border-glass-active)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Applicant Name</label>
              <input type="text" className="form-input" required onChange={e => setNewCandData({...newCandData, candidateName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required onChange={e => setNewCandData({...newCandData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input type="number" className="form-input" required onChange={e => setNewCandData({...newCandData, experience: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Primary Skills (comma separated)</label>
              <input type="text" className="form-input" required placeholder="e.g. React, Node.js, MongoDB" onChange={e => setNewCandData({...newCandData, skills: e.target.value.split(',').map(s=>s.trim())})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Paste Resume Raw Text (For AI Analysis)</label>
              <textarea className="form-input" rows="4" onChange={e => setNewCandData({...newCandData, resumeText: e.target.value})} placeholder="Paste resume text here for automated shortlisting..."></textarea>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddCand(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Submit Application</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {candidates.map(cand => (
          <div key={cand._id} className="glass-card" style={{ borderLeft: '4px solid var(--primary)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{cand.candidateName}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{cand.email} • {cand.experience} YOE</p>
              </div>
              <span className="badge badge-warning">{cand.status}</span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {cand.skills.map((s, i) => <span key={i} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>{s}</span>)}
            </div>

            {cand.aiAnalysis && cand.aiAnalysis.score ? (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>AI Match Score:</strong>
                  <span style={{ color: 'var(--success)' }}>{cand.aiAnalysis.score}</span>
                </div>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>{cand.aiAnalysis.summary}</p>
                {cand.aiAnalysis.missingSkills && cand.aiAnalysis.missingSkills.length > 0 && (
                  <div><strong style={{ fontSize: '11px', color: 'var(--warning)' }}>Missing:</strong> <span style={{ fontSize: '11px' }}>{cand.aiAnalysis.missingSkills.join(', ')}</span></div>
                )}
              </div>
            ) : (
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                onClick={() => handleResumeAnalysis(cand._id)}
              >
                <FileText size={14} /> Run AI Resume Analysis
              </button>
            )}
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}><Check size={14} /> Shortlist</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
