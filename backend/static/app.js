// Global variables
let authToken = null;
let currentUser = null;
let websocket = null;
let chart = null;

// API Base URL
const API_BASE = window.location.origin;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for existing auth
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showDashboard();
    } else {
        showLogin();
    }
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Add device form
    const addDeviceForm = document.getElementById('addDeviceForm');
    if (addDeviceForm) {
        addDeviceForm.addEventListener('submit', handleAddDevice);
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showDashboard();
        } else {
            showError('Invalid credentials');
        }
    } catch (error) {
        showError('Login failed. Please try again.');
    }
}

function fillCredentials(email, password) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    if (websocket) {
        websocket.close();
    }
    
    showLogin();
}

// UI Navigation
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'grid';
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    
    // Load initial data
    loadDashboardData();
    connectWebSocket();
    
    // Show overview by default
    showSection('overview');
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    // Remove active class from nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionName + 'Section').style.display = 'block';
    
    // Add active class to nav item
    event.target.closest('.nav-item').classList.add('active');
    
    // Load section-specific data
    switch(sectionName) {
        case 'overview':
            loadDashboardData();
            break;
        case 'devices':
            loadDevicesTable();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'alerts':
            loadAlerts();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// Data Loading Functions
async function loadDashboardData() {
    try {
        const [statsResponse, devicesResponse] = await Promise.all([
            fetch(`${API_BASE}/api/dashboard`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE}/api/devices`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);
        
        if (statsResponse.ok && devicesResponse.ok) {
            const stats = await statsResponse.json();
            const devices = await devicesResponse.json();
            
            updateStatsCards(stats);
            updateDevicesGrid(devices);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateStatsCards(stats) {
    document.getElementById('totalDevices').textContent = stats.total_devices;
    document.getElementById('onlineDevices').textContent = stats.online_devices;
    document.getElementById('activeAlerts').textContent = stats.active_alerts;
    document.getElementById('avgCO2').textContent = stats.avg_co2_ppm;
    
    // Update alert badge
    document.getElementById('alertBadge').textContent = stats.active_alerts;
}

function updateDevicesGrid(devices) {
    const grid = document.getElementById('devicesGrid');
    grid.innerHTML = '';
    
    devices.forEach(device => {
        const card = createDeviceCard(device);
        grid.appendChild(card);
    });
}

function createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card';
    
    const statusClass = device.is_online ? 
        (device.telemetry.status === 2 ? 'error' : 
         device.telemetry.status === 1 ? 'warning' : '') : 'offline';
    
    card.innerHTML = `
        <div class="device-header">
            <div class="device-info">
                <h4>${device.name}</h4>
                <p>${device.device_id} • ${device.protocol}</p>
            </div>
            <div class="device-status ${statusClass}"></div>
        </div>
        <div class="device-metrics">
            <div class="metric">
                <div class="metric-value">${device.telemetry.temperature || 0}°C</div>
                <div class="metric-label">Temperature</div>
            </div>
            <div class="metric">
                <div class="metric-value">${device.telemetry.co2_ppm || 0}</div>
                <div class="metric-label">CO₂ ppm</div>
            </div>
            <div class="metric">
                <div class="metric-value">${device.telemetry.humidity || 0}%</div>
                <div class="metric-label">Humidity</div>
            </div>
            <div class="metric">
                <div class="metric-value">${device.telemetry.power_kw || 0}kW</div>
                <div class="metric-label">Power</div>
            </div>
        </div>
        <div class="device-actions">
            <button class="btn-small btn-control" onclick="sendCommand(${device.id}, 'TOGGLE')">
                <i class="fas fa-power-off"></i> Toggle
            </button>
            <button class="btn-small btn-restart" onclick="sendCommand(${device.id}, 'RESTART')">
                <i class="fas fa-redo"></i> Restart
            </button>
        </div>
    `;
    
    return card;
}

async function loadDevicesTable() {
    try {
        const response = await fetch(`${API_BASE}/api/devices`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const devices = await response.json();
            updateDevicesTable(devices);
        }
    } catch (error) {
        console.error('Error loading devices table:', error);
    }
}

function updateDevicesTable(devices) {
    const tbody = document.getElementById('devicesTableBody');
    tbody.innerHTML = '';
    
    devices.forEach(device => {
        const row = document.createElement('tr');
        const statusClass = device.is_online ? 'status-online' : 'status-offline';
        const statusText = device.is_online ? 'Online' : 'Offline';
        
        row.innerHTML = `
            <td>${device.device_id}</td>
            <td>${device.name}</td>
            <td>${device.protocol}</td>
            <td>${device.location || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-small btn-control" onclick="editDevice(${device.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-small btn-restart" onclick="deleteDevice(${device.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

async function loadAlerts() {
    try {
        const response = await fetch(`${API_BASE}/api/alerts`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const alerts = await response.json();
            updateAlertsContainer(alerts);
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

function updateAlertsContainer(alerts) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';
    
    if (alerts.length === 0) {
        container.innerHTML = '<p>No active alerts</p>';
        return;
    }
    
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-item ${alert.status === 'active' ? 'error' : ''}`;
        
        alertDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${alert.device_name}</strong>
                    <p>${alert.rule_json}</p>
                    <small>${new Date(alert.triggered_at).toLocaleString()}</small>
                </div>
                ${alert.status === 'active' ? 
                    `<button class="btn-primary" onclick="acknowledgeAlert(${alert.id})">Acknowledge</button>` : 
                    '<span class="status-badge status-online">Acknowledged</span>'
                }
            </div>
        `;
        
        container.appendChild(alertDiv);
    });
}

async function loadLogs() {
    try {
        const response = await fetch(`${API_BASE}/api/logs`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const logs = await response.json();
            updateLogsContainer(logs);
        }
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

function updateLogsContainer(logs) {
    const container = document.getElementById('logsContainer');
    container.innerHTML = '';
    
    logs.forEach(log => {
        const logDiv = document.createElement('div');
        logDiv.className = 'log-item';
        
        logDiv.innerHTML = `
            <div>
                <strong>${log.event_type}</strong>
                <p>${log.message}</p>
                <small>${new Date(log.timestamp).toLocaleString()}</small>
            </div>
        `;
        
        container.appendChild(logDiv);
    });
}

// Device Management
async function sendCommand(deviceId, commandType) {
    try {
        const response = await fetch(`${API_BASE}/api/commands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                device_id: deviceId,
                command_type: commandType
            })
        });
        
        if (response.ok) {
            showSuccess(`Command ${commandType} sent successfully`);
            loadDashboardData(); // Refresh data
        }
    } catch (error) {
        showError('Failed to send command');
    }
}

async function acknowledgeAlert(alertId) {
    try {
        const response = await fetch(`${API_BASE}/api/alerts/${alertId}/acknowledge`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            showSuccess('Alert acknowledged');
            loadAlerts(); // Refresh alerts
            loadDashboardData(); // Refresh stats
        }
    } catch (error) {
        showError('Failed to acknowledge alert');
    }
}

// WebSocket Connection
function connectWebSocket() {
    const wsUrl = `ws://${window.location.host}/ws`;
    websocket = new WebSocket(wsUrl);
    
    websocket.onopen = function() {
        document.getElementById('connectionStatus').innerHTML = 
            '<i class="fas fa-wifi"></i><span>Connected</span>';
    };
    
    websocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'telemetry_update') {
            loadDashboardData(); // Refresh dashboard data
        }
    };
    
    websocket.onclose = function() {
        document.getElementById('connectionStatus').innerHTML = 
            '<i class="fas fa-wifi" style="color: #ef4444;"></i><span style="color: #ef4444;">Disconnected</span>';
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
}

// Utility Functions
function showError(message) {
    // Simple alert for now - could be replaced with a toast notification
    alert('Error: ' + message);
}

function showSuccess(message) {
    // Simple alert for now - could be replaced with a toast notification
    alert('Success: ' + message);
}

// Modal Functions
function showAddDeviceModal() {
    document.getElementById('addDeviceModal').style.display = 'flex';
}

function closeAddDeviceModal() {
    document.getElementById('addDeviceModal').style.display = 'none';
}

async function handleAddDevice(e) {
    e.preventDefault();
    
    const deviceData = {
        device_id: document.getElementById('deviceId').value,
        name: document.getElementById('deviceName').value,
        protocol: document.getElementById('deviceProtocol').value,
        ip: document.getElementById('deviceIP').value,
        port: parseInt(document.getElementById('devicePort').value),
        location: document.getElementById('deviceLocation').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(deviceData)
        });
        
        if (response.ok) {
            showSuccess('Device added successfully');
            closeAddDeviceModal();
            loadDevicesTable();
            loadDashboardData();
        } else {
            showError('Failed to add device');
        }
    } catch (error) {
        showError('Failed to add device');
    }
}