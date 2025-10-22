const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const { sendOTP } = require('./services/emailService');
const { otpLimiter } = require('./middleware/rateLimiter');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bms_dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const User = mongoose.model('User', {
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'operator', 'guest'], default: 'guest' }
});

const Device = mongoose.model('Device', {
  deviceId: { type: String, unique: true },
  name: String,
  protocol: String,
  ip: String,
  port: Number,
  location: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Telemetry = mongoose.model('Telemetry', {
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  metricName: String,
  metricValue: Number,
  timestamp: { type: Date, default: Date.now }
});

const Alert = mongoose.model('Alert', {
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  message: String,
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['active', 'acknowledged', 'resolved'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const OTP = mongoose.model('OTP', {
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['signup', 'login'], required: true },
  expiresAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes
  verified: { type: Boolean, default: false }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for signup
app.post('/api/auth/send-signup-otp', otpLimiter, async (req, res) => {
  try {
    const { email, name, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Admin role requires special admin key
    if (role === 'admin' && req.body.adminKey !== 'BMS_ADMIN_2024') {
      return res.status(403).json({ success: false, message: 'Invalid admin key' });
    }
    
    const otp = generateOTP();
    
    // Save OTP
    await OTP.deleteMany({ email, type: 'signup' }); // Remove old OTPs
    const otpDoc = new OTP({ email, otp, type: 'signup' });
    await otpDoc.save();
    
    // Send email
    const emailResult = await sendOTP(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
    
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP and complete signup
app.post('/api/auth/verify-signup', async (req, res) => {
  try {
    const { email, otp, name, password, role } = req.body;
    
    // Verify OTP
    const otpDoc = await OTP.findOne({ email, otp, type: 'signup', verified: false });
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'guest'
    });
    await user.save();
    
    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();
    
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, 
                           process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send OTP for login
app.post('/api/auth/send-login-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const otp = generateOTP();
    
    // Save OTP
    await OTP.deleteMany({ email, type: 'login' }); // Remove old OTPs
    const otpDoc = new OTP({ email, otp, type: 'login' });
    await otpDoc.save();
    
    // Send email
    const emailResult = await sendOTP(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
    
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP and login
app.post('/api/auth/verify-login', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Verify OTP
    const otpDoc = await OTP.findOne({ email, otp, type: 'login', verified: false });
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();
    
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, 
                           process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/devices', authenticateToken, async (req, res) => {
  try {
    const devices = await Device.find();
    const devicesWithTelemetry = await Promise.all(devices.map(async (device) => {
      const latestTelemetry = await Telemetry.find({ deviceId: device._id })
        .sort({ timestamp: -1 }).limit(4);
      
      const telemetryData = {};
      latestTelemetry.forEach(t => {
        telemetryData[t.metricName] = t.metricValue;
      });
      
      return {
        ...device.toObject(),
        telemetry: telemetryData,
        isOnline: latestTelemetry.length > 0 && 
                 (Date.now() - latestTelemetry[0].timestamp) < 60000
      };
    }));
    
    res.json(devicesWithTelemetry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/devices', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const device = new Device(req.body);
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await Alert.find().populate('deviceId').sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/telemetry/:deviceId', authenticateToken, async (req, res) => {
  try {
    const telemetry = await Telemetry.find({ deviceId: req.params.deviceId })
      .sort({ timestamp: -1 }).limit(100);
    res.json(telemetry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize default data
const initializeData = async () => {
  try {
    // Create default users
    // Create demo admin user only
    const adminExists = await User.findOne({ email: 'admin@voltas.com' });
    if (!adminExists) {
      const adminUser = new User({
        name: 'Demo Admin',
        email: 'admin@voltas.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      });
      await adminUser.save();
    }
    
    // Create default devices
    const deviceCount = await Device.countDocuments();
    if (deviceCount === 0) {
      const devices = [
        { deviceId: 'HVAC_001', name: 'Main HVAC Unit 1', protocol: 'Modbus', ip: '192.168.1.101', port: 502, location: 'Building A - Floor 1' },
        { deviceId: 'HVAC_002', name: 'Main HVAC Unit 2', protocol: 'BACnet', ip: '192.168.1.102', port: 47808, location: 'Building A - Floor 2' },
        { deviceId: 'HVAC_003', name: 'Conference Room AC', protocol: 'Modbus', ip: '192.168.1.103', port: 502, location: 'Building B - Conference' },
        { deviceId: 'HVAC_004', name: 'Server Room Cooling', protocol: 'BACnet', ip: '192.168.1.104', port: 47808, location: 'Building B - Server Room' },
        { deviceId: 'HVAC_005', name: 'Lobby Climate Control', protocol: 'Modbus', ip: '192.168.1.105', port: 502, location: 'Building A - Lobby' }
      ];
      await Device.insertMany(devices);
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Simulate telemetry data
const simulateTelemetry = async () => {
  try {
    const devices = await Device.find({ isActive: true });
    
    for (const device of devices) {
      const telemetryData = [
        { metricName: 'temperature', metricValue: Math.round((20 + Math.random() * 10) * 10) / 10 },
        { metricName: 'co2_ppm', metricValue: Math.round(350 + Math.random() * 200) },
        { metricName: 'humidity', metricValue: Math.round(40 + Math.random() * 40) },
        { metricName: 'power_kw', metricValue: Math.round((2 + Math.random() * 5) * 10) / 10 }
      ];
      
      for (const data of telemetryData) {
        const telemetry = new Telemetry({
          deviceId: device._id,
          ...data
        });
        await telemetry.save();
      }
      
      // Check for alerts
      const tempData = telemetryData.find(t => t.metricName === 'temperature');
      if (tempData.metricValue > 28) {
        const existingAlert = await Alert.findOne({ 
          deviceId: device._id, 
          message: 'High temperature detected',
          status: 'active'
        });
        
        if (!existingAlert) {
          const alert = new Alert({
            deviceId: device._id,
            message: 'High temperature detected',
            severity: 'high'
          });
          await alert.save();
          io.emit('newAlert', alert);
        }
      }
    }
    
    io.emit('telemetryUpdate', { timestamp: new Date() });
  } catch (error) {
    console.error('Error simulating telemetry:', error);
  }
};

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeData();
  
  // Start telemetry simulation
  setInterval(simulateTelemetry, 10000);
});