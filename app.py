from flask import Flask, render_template_string, jsonify, request
import json
import random
from datetime import datetime

app = Flask(__name__)

# Sample data
devices = [
    {"id": 1, "name": "HVAC Unit 1", "status": "online", "temperature": 22.5, "co2": 400},
    {"id": 2, "name": "HVAC Unit 2", "status": "online", "temperature": 23.1, "co2": 420},
    {"id": 3, "name": "Conference AC", "status": "online", "temperature": 21.8, "co2": 380},
]

users = {
    "admin@voltas.com": {"password": "admin123", "role": "admin"},
    "operator@voltas.com": {"password": "operator123", "role": "operator"},
    "guest@voltas.com": {"password": "guest123", "role": "guest"}
}

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Voltas BMS Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .header { background: #2563eb; color: white; padding: 1rem; text-align: center; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
        .login-form { background: white; padding: 2rem; border-radius: 8px; max-width: 400px; margin: 2rem auto; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; }
        .form-group input { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        .btn { background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #1d4ed8; }
        .dashboard { display: none; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; text-align: center; }
        .devices { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .device-card { background: white; padding: 1.5rem; border-radius: 8px; }
        .device-status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
        .status-online { background: #10b981; color: white; }
        .logout { float: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏭 Voltas BMS Dashboard</h1>
        <button class="btn logout" onclick="logout()" style="display: none;">Logout</button>
    </div>

    <div id="loginSection">
        <div class="login-form">
            <h2>Login</h2>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" id="email" value="admin@voltas.com">
            </div>
            <div class="form-group">
                <label>Password:</label>
                <input type="password" id="password" value="admin123">
            </div>
            <button class="btn" onclick="login()">Login</button>
            <div style="margin-top: 1rem; font-size: 0.9rem;">
                <p><strong>Demo Credentials:</strong></p>
                <p>Admin: admin@voltas.com / admin123</p>
                <p>Operator: operator@voltas.com / operator123</p>
                <p>Guest: guest@voltas.com / guest123</p>
            </div>
        </div>
    </div>

    <div id="dashboard" class="dashboard">
        <div class="container">
            <div class="stats">
                <div class="stat-card">
                    <h3>Total Devices</h3>
                    <div style="font-size: 2rem; color: #2563eb;">3</div>
                </div>
                <div class="stat-card">
                    <h3>Online Devices</h3>
                    <div style="font-size: 2rem; color: #10b981;">3</div>
                </div>
                <div class="stat-card">
                    <h3>Active Alerts</h3>
                    <div style="font-size: 2rem; color: #ef4444;">0</div>
                </div>
                <div class="stat-card">
                    <h3>Avg Temperature</h3>
                    <div style="font-size: 2rem; color: #f59e0b;">22.5°C</div>
                </div>
            </div>

            <div class="devices" id="devicesList">
                <!-- Devices will be loaded here -->
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
                    document.querySelector('.logout').style.display = 'block';
                    loadDevices();
                } else {
                    alert('Invalid credentials');
                }
            });
        }

        function logout() {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
            document.querySelector('.logout').style.display = 'none';
        }

        function loadDevices() {
            fetch('/api/devices')
            .then(res => res.json())
            .then(devices => {
                const html = devices.map(device => `
                    <div class="device-card">
                        <h3>${device.name}</h3>
                        <span class="device-status status-${device.status}">${device.status.toUpperCase()}</span>
                        <div style="margin-top: 1rem;">
                            <p><strong>Temperature:</strong> ${device.temperature}°C</p>
                            <p><strong>CO2:</strong> ${device.co2} ppm</p>
                            <p><strong>Last Update:</strong> ${new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                `).join('');
                document.getElementById('devicesList').innerHTML = html;
            });
        }

        // Auto-refresh devices every 30 seconds
        setInterval(() => {
            if (document.getElementById('dashboard').style.display !== 'none') {
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
    return jsonify(devices)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)