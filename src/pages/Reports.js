import React from 'react';

const Reports = () => {
  return (
    <div className="page">
      <h1 className="page-title">Reports & Analytics</h1>
      <div className="content-card">
        <h3>📈 Generate Reports</h3>
        <p>Export device data, telemetry reports, and system analytics.</p>
        <div style={{marginTop: '1rem'}}>
          <button className="btn" style={{marginRight: '1rem'}}>📄 Export CSV</button>
          <button className="btn">📋 Export PDF</button>
        </div>
      </div>
    </div>
  );
};

export default Reports;