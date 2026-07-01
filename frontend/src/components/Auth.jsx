import React from 'react';
import { Globe, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Auth({
  handleLogin,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  authError,
  authSuccess
}) {
  return (
    <div className="auth-container">
      <div className="auth-box glass-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Globe className="text-primary" size={32} />
            <span>WORKFORCE</span>
          </div>
          <p className="page-subtitle">Enterprise Lifecycle Platform with Operations AI</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Corporate Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={loginEmail} 
              onChange={(e) => setLoginEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)} 
              required 
            />
          </div>

          {authError && <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '15px' }}><AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />{authError}</div>}
          {authSuccess && <div style={{ color: 'var(--secondary)', fontSize: '13px', marginBottom: '15px' }}><CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px' }} />{authSuccess}</div>}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Sign In</button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <p>Demo Logins (Password criteria: Uppercase, Lowercase, Special Char, Number):</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
            <code>SuperAdmin: admin@company.com / Admin@123</code>
            <code>HR Manager: hr@company.com / HrManager@123</code>
            <code>Team Lead/Manager: manager@company.com / Manager@123</code>
            <code>Employee: employee@company.com / Employee@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
