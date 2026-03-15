import React from 'react';

function StatsCard({ title, value, icon, colorClass, change }) {
  const isPositive = change >= 0;
  return (
    <div className="col-xl-3 col-md-6 mb-4">
      <div className="dashboard-card p-4 h-100 border-0 shadow-sm rounded-3">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <p className="text-muted small mb-1">{title}</p>
            <h2 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{value}</h2>
          </div>
          <div className={`stat-icon-circle bg-${colorClass} bg-opacity-10 text-${colorClass} rounded-circle d-flex align-items-center justify-content-center`} style={{ width: 48, height: 48 }}>
            <i className={`bi ${icon} fs-4`} />
          </div>
        </div>
        <span className={`badge ${isPositive ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${isPositive ? 'success' : 'danger'} px-2 py-1`}>
          <i className={`bi bi-arrow-${isPositive ? 'up' : 'down'} me-1`} />
          {Math.abs(change)}% vs last month
        </span>
      </div>
    </div>
  );
}

export default StatsCard;
