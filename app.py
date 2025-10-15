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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .header { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .logo { display: flex; align-items: center; gap: 0.5rem; font-size: 1.5rem; font-weight: bold; }
        .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
        .login-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
        .login-form { background: rgba(255,255,255,0.95); padding: 3rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 450px; width: 100%; backdrop-filter: blur(10px); }
        .login-title { text-align: center; margin-bottom: 2rem; color: #333; font-size: 2rem; font-weight: 300; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; }
        .form-group input { width: 100%; padding: 1rem; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; transition: all 0.3s ease; }
        .form-group input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; border: none; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: 600; width: 100%; transition: all 0.3s ease; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102,126,234,0.3); }
        .btn-logout { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem; }
        .dashboard { display: none; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-bottom: 3rem; }
        .stat-card { background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); backdrop-filter: blur(10px); transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .stat-number { font-size: 3rem; font-weight: bold; margin: 1rem 0; }
        .stat-label { color: #666; font-size: 1.1rem; font-weight: 500; }
        .devices-section h2 { color: white; margin-bottom: 2rem; font-size: 2rem; font-weight: 300; }
        .devices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
        .device-card { background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); backdrop-filter: blur(10px); transition: all 0.3s ease; }
        .device-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .device-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .device-name { font-size: 1.3rem; font-weight: 600; color: #333; }
        .device-status { padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; }
        .status-online { background: linear-gradient(135deg, #4ade80, #22c55e); color: white; }
        .status-offline { background: linear-gradient(135deg, #f87171, #ef4444); color: white; }
        .device-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .metric { text-align: center; padding: 1rem; background: rgba(102,126,234,0.1); border-radius: 10px; }
        .metric-value { font-size: 1.5rem; font-weight: bold; color: #667eea; }
        .metric-label { color: #666; font-size: 0.9rem; margin-top: 0.5rem; }
        .demo-info { background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 10px; margin-top: 2rem; color: white; }
        .demo-info h4 { margin-bottom: 1rem; }
        .demo-info p { margin-bottom: 0.5rem; font-size: 0.9rem; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .pulse { animation: pulse 2s infinite; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <span>🏭</span>
            <span>Voltas BMS Dashboard</span>
        </div>
        <button class="btn btn-logout" onclick="logout()" style="display: none;">Logout</button>
    </div>

    <div id="loginSection">
        <div class="login-container">
            <div class="login-form">
                <h2 class="login-title">Welcome Back</h2>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="email" value="admin@voltas.com" placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" value="admin123" placeholder="Enter your password">
                </div>
                <button class="btn" onclick="login()">Sign In</button>
                
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
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" style="color: #667eea;">5</div>
                    <div class="stat-label">Total Devices</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #22c55e;">5</div>
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

            <div class="devices-section">
                <h2>🌡️ Device Monitoring</h2>
                <div class="devices-grid" id="devicesList">
                    <!-- Devices will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <script>
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
                    document.getElementById('loginSection').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                    document.querySelector('.btn-logout').style.display = 'block';
                    loadDevices();
                } else {
                    alert('❌ Invalid credentials. Please try again.');
                }
            })
            .catch(err => {
                alert('❌ Connection error. Please try again.');
            });
        }

        function logout() {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
            document.querySelector('.btn-logout').style.display = 'none';
        }

        function loadDevices() {
            fetch('/api/devices')
            .then(res => res.json())
            .then(devices => {
                const html = devices.map(device => `
                    <div class="device-card">
                        <div class="device-header">
                            <div class="device-name">${device.name}</div>
                            <div class="device-status status-${device.status}">
                                ${device.status === 'online' ? '🟢' : '🔴'} ${device.status.toUpperCase()}
                            </div>
                        </div>
                        <div class="device-metrics">
                            <div class="metric">
                                <div class="metric-value">${device.temperature}°C</div>
                                <div class="metric-label">🌡️ Temperature</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${device.co2}</div>
                                <div class="metric-label">💨 CO2 (ppm)</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${Math.round(Math.random() * 40 + 40)}%</div>
                                <div class="metric-label">💧 Humidity</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${(Math.random() * 5 + 2).toFixed(1)}kW</div>
                                <div class="metric-label">⚡ Power</div>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #666; font-size: 0.9rem;">
                            <span>🕒 Last Update: ${new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                `).join('');
                document.getElementById('devicesList').innerHTML = html;
            })
            .catch(err => {
                console.error('Error loading devices:', err);
            });
        }

        // Auto-refresh devices every 30 seconds
        setInterval(() => {
            if (document.getElementById('dashboard').style.display !== 'none') {
                loadDevices();
            }
        }, 30000);

        // Add enter key support for login
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && document.getElementById('loginSection').style.display !== 'none') {
                login();
            }
        });
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
    return jsonify(devices)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)