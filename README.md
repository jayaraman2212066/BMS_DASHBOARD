# BMS_DASHBOARD

🏭 **Voltas BMS Automation Dashboard** - A modern, full-stack web application for monitoring and controlling Building Management System (BMS) devices.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jayaraman2212066/BMS_DASHBOARD)

## 🚀 Live Demo

**Access the live application:** [BMS Dashboard on Render](https://your-app-name.onrender.com)

**Demo Credentials:**
- **Admin**: admin@voltas.com / admin123
- **Operator**: operator@voltas.com / operator123
- **Guest**: guest@voltas.com / guest123

## Features

- Real-time device monitoring dashboard
- Historical data visualization with time-series charts
- Device management (CRUD operations)
- Simulated Modbus/BACnet device telemetry
- Alert system with configurable rules
- Role-based authentication (Admin, Operator, Guest)
- Export reports (PDF/CSV)
- WebSocket real-time updates

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: SQLite with SQLAlchemy ORM
- **Real-time**: WebSockets
- **Authentication**: JWT tokens
- **Containerization**: Docker + docker-compose

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### Run with Docker (Recommended)

```bash
# Clone and navigate to project
cd d:\voltas\webapp

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Default Login Credentials

- **Admin**: admin@voltas.com / admin123
- **Operator**: operator@voltas.com / operator123
- **Guest**: guest@voltas.com / guest123

## Local Development

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Documentation

Visit http://localhost:8000/docs for interactive API documentation.

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=sqlite:///./voltas_bms.db
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │   SQLite DB     │
│   (Port 3000)   │◄──►│   (Port 8000)   │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────WebSocket────────┘
```

## Demo Features

1. **Device Simulation**: Automatic generation of telemetry data
2. **Real-time Updates**: Live dashboard with WebSocket updates
3. **Alert System**: Configurable thresholds with notifications
4. **Historical Charts**: Time-series visualization
5. **Export Reports**: PDF and CSV generation
6. **Role-based Access**: Different permissions for user roles

## Deployment

The application is containerized and can be deployed to any Docker-compatible platform:

- Heroku
- AWS ECS
- Google Cloud Run
- Azure Container Instances

## Project Structure

```
voltas-webapp/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication
│   ├── database.py         # Database configuration
│   ├── utils.py            # Utility functions
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static files
│   ├── package.json        # Node dependencies
│   └── Dockerfile          # Frontend container
├── docker-compose.yml      # Multi-service deployment
├── deploy.bat              # Windows deployment script
├── stop.bat                # Stop services script
├── test-app.bat            # Test runner script
├── sample-devices.csv      # Sample data for import
└── README.md               # This file
```

## Testing

### Run All Tests
```bash
# Windows
test-app.bat

# Manual testing
cd backend && python -m pytest
cd frontend && npm test
```

### Manual Testing Checklist

1. **Authentication**
   - [ ] Login with admin credentials
   - [ ] Login with operator credentials
   - [ ] Login with guest credentials
   - [ ] Invalid login attempt
   - [ ] Logout functionality

2. **Dashboard**
   - [ ] View device statistics
   - [ ] Real-time device status updates
   - [ ] Device cards show telemetry data
   - [ ] WebSocket connection status

3. **Device Management**
   - [ ] View device list
   - [ ] Add new device (admin only)
   - [ ] Edit device (admin only)
   - [ ] Delete device (admin only)
   - [ ] Send control commands

4. **Telemetry & Charts**
   - [ ] View historical telemetry data
   - [ ] Switch between different metrics
   - [ ] Change time ranges
   - [ ] Real-time chart updates

5. **Alerts**
   - [ ] View active alerts
   - [ ] Acknowledge alerts
   - [ ] Alert history

6. **Reports**
   - [ ] Generate CSV reports
   - [ ] Generate PDF reports
   - [ ] Export device data

## Troubleshooting

### Common Issues

1. **Docker not starting**
   - Ensure Docker Desktop is installed and running
   - Check if ports 3000 and 8000 are available

2. **Database issues**
   - Delete `voltas_bms.db` file and restart
   - Check backend logs: `docker-compose logs backend`

3. **Frontend not loading**
   - Check if backend is running on port 8000
   - Verify CORS settings in backend
   - Check frontend logs: `docker-compose logs frontend`

4. **WebSocket connection issues**
   - Verify WebSocket URL in frontend environment
   - Check browser console for connection errors

### Development Mode

```bash
# Backend development
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Frontend development
cd frontend
npm install
npm start
```

## Production Deployment

### Docker Deployment
```bash
docker-compose up -d --build
```

### Cloud Deployment (Heroku)
```bash
# Backend
heroku create voltas-bms-api
heroku container:push web -a voltas-bms-api
heroku container:release web -a voltas-bms-api

# Frontend
heroku create voltas-bms-frontend
heroku buildpacks:set heroku/nodejs -a voltas-bms-frontend
git subtree push --prefix frontend heroku main
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Input validation and sanitization
- SQL injection prevention

## Performance Features

- Real-time WebSocket updates
- Efficient database queries
- Responsive UI design
- Docker containerization
- Optimized build processes

## License

MIT License - Voltas Limited