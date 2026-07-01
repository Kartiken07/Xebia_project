import React from 'react';
import { Plus, Monitor, AlertCircle } from 'lucide-react';

export default function AssetsPage({
  userRole, assets, showAddAsset, setShowAddAsset,
  newAssetData, setNewAssetData, handleCreateAsset, employees
}) {
  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>IT Asset Inventory</h3>
        {['SUPER_ADMIN', 'HR', 'IT'].includes(userRole) && (
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddAsset(true)}>
            <Plus size={16} /> Provision Asset
          </button>
        )}
      </div>

      {showAddAsset && (
        <form onSubmit={handleCreateAsset} className="glass-card" style={{ marginBottom: '24px', border: '1px solid var(--border-glass-active)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Asset Name / Model</label>
              <input type="text" className="form-input" required onChange={e => setNewAssetData({...newAssetData, assetName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input type="text" className="form-input" required onChange={e => setNewAssetData({...newAssetData, serialNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Category Type</label>
              <select className="form-input" required onChange={e => setNewAssetData({...newAssetData, type: e.target.value})}>
                <option value="">Select Type</option>
                <option>Laptop</option><option>Monitor</option><option>Mobile</option><option>Accessories</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-input" required onChange={e => setNewAssetData({...newAssetData, assignedTo: e.target.value})}>
                <option value="">Select Employee</option>
                {employees.map(emp => <option key={emp._id} value={emp.employeeId}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddAsset(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Provision Asset</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {assets.map(asset => (
          <div key={asset._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Monitor size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{asset.assetName}</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>SN: {asset.serialNumber}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>{asset.type}</span>
                <span className={`badge badge-${asset.status === 'Assigned' ? 'success' : 'warning'}`}>{asset.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
