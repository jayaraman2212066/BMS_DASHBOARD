from flask import Flask, render_template_string, jsonify, request
import json
import random
from datetime import datetime

app = Flask(__name__)

# Sample data
devices = [
    {"id": 1, "name": "Main HVAC Unit 1", "status": "online", "temperature": 22.5, "co2": 400, "location": "Building A - Floor 1"},
    {"id": 2, "name": "Main HVAC Unit 2", "status": "online", "temperature": 23.1, "co2": 420, "location": "Building A - Floor 2"},
    {"id": 3, "name": "Conference Room AC", "status": "online", "temperature": 21.8, "co2": 380, "location": "Building B - Conference"},
    {"id": 4, "name": "Server Room Cooling", "status": "online", "temperature": 19.2, "co2": 350, "location": "Building B - Server Room"},
    {"id": 5, "name": "Lobby Climate Control", "status": "online", "temperature": 24.1, "co2": 450, "location": "Building A - Lobby"},
]

users = {
    "admin@voltas.com": {"password": "admin123", "role": "admin"},
    "operator@voltas.com": {"password": "operator123", "role": "operator"},
    "guest@voltas.com": {"password": "guest123", "role": "guest"}
}

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voltas BMS Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; }
        .header { background: #1e40af; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { display: flex; align-items: center; gap: 0.5rem; font-size: 1.5rem; font-weight: bold; }
        .user-info { display: flex; align-items: center; gap: 1rem; }
        .sidebar { position: fixed; left: 0; top: 70px; width: 250px; height: calc(100vh - 70px); background: white; box-shadow: 2px 0 10px rgba(0,0,0,0.1); z-index: 100; }
        .nav-item { display: block; padding: 1rem 1.5rem; color: #374151; text-decoration: none; border-bottom: 1px solid #e5e7eb; transition: all 0.3s; }
        .nav-item:hover, .nav-item.active { background: #3b82f6; color: white; }
        .main-content { margin-left: 250px; padding: 2rem; min-height: calc(100vh - 70px); }
        .login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .login-form { background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 450px; width: 100%; }
        .login-title { text-align: center; margin-bottom: 2rem; color: #333; font-size: 2rem; font-weight: 300; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; }
        .form-group input { width: 100%; padding: 1rem; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; }
        .form-group input:focus { outline: none; border-color: #3b82f6; }
        .btn { background: #3b82f6; color: white; padding: 1rem 2rem; border: none; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: 600; }
        .btn:hover { background: #2563eb; }
        .btn-logout { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; }
        .dashboard { display: none; }
        .page-section { display: none; }
        .page-section.active { display: block; }
        .page-title { font-size: 2rem; margin-bottom: 2rem; color: #1f2937; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .stat-label { color: #6b7280; font-size: 0.9rem; }
        .devices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .device-card { background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .device-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .device-name { font-size: 1.2rem; font-weight: 600; }
        .device-status { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
        .status-online { background: #10b981; color: white; }
        .status-offline { background: #ef4444; color: white; }
        .device-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }
        .metric { text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 8px; }
        .metric-value { font-size: 1.3rem; font-weight: bold; color: #3b82f6; }
        .metric-label { color: #6b7280; font-size: 0.8rem; margin-top: 0.25rem; }
        .table { width: 100%; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .table th, .table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .table th { background: #f9fafb; font-weight: 600; }
        .alert-item { background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #ef4444; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .log-item { background: white; padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .demo-info { background: #e0f2fe; padding: 1.5rem; border-radius: 10px; margin-top: 2rem; }
    </style>
</head>
<body>
    <div id="loginSection">
        <div class="login-container">
            <div class="login-form">
                <h2 class="login-title">🏭 Voltas BMS Login</h2>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="email" value="admin@voltas.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" value="admin123">
                </div>
                <button class="btn" onclick="login()" style="width: 100%;">Sign In</button>
                <div class="demo-info">
                    <h4>🔑 Demo Credentials</h4>
                    <p><strong>Admin:</strong> admin@voltas.com / admin123</p>
                    <p><strong>Operator:</strong> operator@voltas.com / operator123</p>
                    <p><strong>Guest:</strong> guest@voltas.com / guest123</p>
                </div>
            </div>
        </div>
    </div>

    <div id="dashboard" class="dashboard">
        <div class="header">
            <div class="logo">
                <span>🏭</span>
                <span>Voltas BMS Dashboard</span>
            </div>
            <div class="user-info">
                <span id="userRole">Admin</span>
                <button class="btn btn-logout" onclick="logout()">Logout</button>
            </div>
        </div>

        <div class="sidebar">
            <a href="#" class="nav-item active" onclick="showPage('home')">🏠 Dashboard</a>
            <a href="#" class="nav-item" onclick="showPage('devices')">🔧 Device Management</a>
            <a href="#" class="nav-item" onclick="showPage('telemetry')">📊 Telemetry & Charts</a>
            <a href="#" class="nav-item" onclick="showPage('alerts')">🚨 Active Alerts</a>
            <a href="#" class="nav-item" onclick="showPage('logs')">📋 System Logs</a>
            <a href="#" class="nav-item" onclick="showPage('reports')">📈 Reports</a>
            <a href="#" class="nav-item" onclick="showPage('settings')">⚙️ Settings</a>
        </div>

        <div class="main-content">
            <!-- Home Page -->
            <div id="home" class="page-section active">
                <h1 class="page-title">Dashboard Overview</h1>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" style="color: #3b82f6;">5</div>
                        <div class="stat-label">Total Devices</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" style="color: #10b981;">5</div>
                        <div class="stat-label">Online Devices</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" style="color: #ef4444;">0</div>
                        <div class="stat-label">Active Alerts</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" style="color: #f59e0b;">22.5°C</div>
                        <div class="stat-label">Avg Temperature</div>
                    </div>
                </div>
                <div class="devices-grid" id="homeDevicesList"></div>
            </div>

            <!-- Devices Page -->
            <div id="devices" class="page-section">
                <h1 class="page-title">Device Management</h1>
                <div class="devices-grid" id="devicesList"></div>
            </div>

            <!-- Telemetry Page -->
            <div id="telemetry" class="page-section">
                <h1 class="page-title">Telemetry & Charts</h1>
                <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>Real-time Metrics</h3>
                    <div id="telemetryData"></div>
                </div>
            </div>

            <!-- Alerts Page -->
            <div id="alerts" class="page-section">
                <h1 class="page-title">Active Alerts</h1>
                <div id="alertsList"></div>
            </div>

            <!-- Logs Page -->
            <div id="logs" class="page-section">
                <h1 class="page-title">System Logs</h1>
                <div id="logsList"></div>
            </div>

            <!-- Reports Page -->
            <div id="reports" class="page-section">
                <h1 class="page-title">Reports & Analytics</h1>
                <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>📊 Generate Reports</h3>
                    <p>Export device data, telemetry reports, and system analytics.</p>
                    <button class="btn" style="margin-top: 1rem;">📄 Export CSV</button>
                    <button class="btn" style="margin-top: 1rem; margin-left: 1rem;">📋 Export PDF</button>
                </div>
            </div>

            <!-- Settings Page -->
            <div id="settings" class="page-section">
                <h1 class="page-title">System Settings</h1>
                <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>⚙️ Configuration</h3>
                    <p>Manage system preferences, user settings, and device configurations.</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentUser = null;

        function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    currentUser = data;
                    document.getElementById('loginSection').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                    document.getElementById('userRole').textContent = data.role.charAt(0).toUpperCase() + data.role.slice(1);
                    loadDevices();
                    loadAlerts();
                    loadLogs();
                } else {
                    alert('❌ Invalid credentials');
                }
            });
        }

        function logout() {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
            currentUser = null;
        }

        function showPage(pageId) {
            document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            event.target.classList.add('active');
        }

        function loadDevices() {
            fetch('/api/devices')
            .then(res => res.json())
            .then(devices => {
                const html = devices.map(device => `
                    <div class="device-card">
                        <div class="device-header">
                            <div class="device-name">${device.name}</div>
                            <div class="device-status status-${device.status}">${device.status.toUpperCase()}</div>
                        </div>
                        <p style="color: #6b7280; margin-bottom: 1rem;">${device.location || 'Location not specified'}</p>
                        <div class="device-metrics">
                            <div class="metric">
                                <div class="metric-value">${device.temperature}°C</div>
                                <div class="metric-label">Temperature</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${device.co2}</div>
                                <div class="metric-label">CO2 (ppm)</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${Math.round(Math.random() * 40 + 40)}%</div>
                                <div class="metric-label">Humidity</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${(Math.random() * 5 + 2).toFixed(1)}kW</div>
                                <div class="metric-label">Power</div>
                            </div>
                        </div>
                    </div>
                `).join('');
                document.getElementById('devicesList').innerHTML = html;
                document.getElementById('homeDevicesList').innerHTML = html;
            });
        }

        function loadAlerts() {
            const alerts = [
                { id: 1, device: 'HVAC Unit 1', message: 'Temperature threshold exceeded', time: new Date().toLocaleString() },
                { id: 2, device: 'Server Room AC', message: 'CO2 levels high', time: new Date().toLocaleString() }
            ];
            
            const html = alerts.map(alert => `
                <div class="alert-item">
                    <h4>${alert.device}</h4>
                    <p>${alert.message}</p>
                    <small>🕒 ${alert.time}</small>
                </div>
            `).join('');
            document.getElementById('alertsList').innerHTML = html;
        }

        function loadLogs() {
            const logs = [
                { time: new Date().toLocaleString(), event: 'Device Connected', device: 'HVAC Unit 1' },
                { time: new Date().toLocaleString(), event: 'Alert Triggered', device: 'Server Room AC' },
                { time: new Date().toLocaleString(), event: 'User Login', device: 'System' }
            ];
            
            const html = logs.map(log => `
                <div class="log-item">
                    <strong>${log.event}</strong> - ${log.device}
                    <br><small>🕒 ${log.time}</small>
                </div>
            `).join('');
            document.getElementById('logsList').innerHTML = html;
        }

        // Auto-refresh
        setInterval(() => {
            if (currentUser) {
                loadDevices();
            }
        }, 30000);
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if email in users and users[email]['password'] == password:
        return jsonify({'success': True, 'role': users[email]['role']})
    return jsonify({'success': False})

@app.route('/api/devices')
def get_devices():
    # Simulate real-time data
    for device in devices:
        device['temperature'] = round(20 + random.uniform(0, 5), 1)
        device['co2'] = random.randint(350, 500)
        device['status'] = 'online'  # All devices online for demo
    return jsonify(devices)

@app.route('/api/alerts')
def get_alerts():
    alerts = [
        {'id': 1, 'device': 'HVAC Unit 1', 'message': 'Temperature threshold exceeded', 'severity': 'high'},
        {'id': 2, 'device': 'Server Room AC', 'message': 'CO2 levels elevated', 'severity': 'medium'}
    ]
    return jsonify(alerts)

@app.route('/api/logs')
def get_logs():
    logs = [
        {'timestamp': datetime.now().isoformat(), 'event': 'Device Connected', 'device': 'HVAC Unit 1'},
        {'timestamp': datetime.now().isoformat(), 'event': 'Alert Triggered', 'device': 'Server Room AC'},
        {'timestamp': datetime.now().isoformat(), 'event': 'User Login', 'device': 'System'}
    ]
    return jsonify(logs)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)