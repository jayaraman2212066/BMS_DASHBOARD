from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import asyncio
import json
from datetime import datetime, timedelta
import random
import logging
import webbrowser
import threading
import time
from typing import List

from database import engine, SessionLocal, Base
from models import User, Device, Telemetry, Alert, Log, Command
from schemas import *
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from utils import simulate_device_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Initialize default data
def init_default_data(db: Session):
    # Create default users if they don't exist
    if not db.query(User).filter(User.email == "admin@voltas.com").first():
        admin_user = User(
            name="Admin User",
            email="admin@voltas.com",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
    
    if not db.query(User).filter(User.email == "operator@voltas.com").first():
        operator_user = User(
            name="Operator User",
            email="operator@voltas.com",
            password_hash=get_password_hash("operator123"),
            role="operator"
        )
        db.add(operator_user)
    
    if not db.query(User).filter(User.email == "guest@voltas.com").first():
        guest_user = User(
            name="Guest User",
            email="guest@voltas.com",
            password_hash=get_password_hash("guest123"),
            role="guest"
        )
        db.add(guest_user)
    
    # Create default devices if they don't exist
    if db.query(Device).count() == 0:
        devices = [
            Device(device_id="HVAC_001", name="Main HVAC Unit 1", protocol="Modbus", ip="192.168.1.101", port=502, location="Building A - Floor 1", is_active=True),
            Device(device_id="HVAC_002", name="Main HVAC Unit 2", protocol="BACnet", ip="192.168.1.102", port=47808, location="Building A - Floor 2", is_active=True),
            Device(device_id="HVAC_003", name="Conference Room AC", protocol="Modbus", ip="192.168.1.103", port=502, location="Building B - Conference", is_active=True),
            Device(device_id="HVAC_004", name="Server Room Cooling", protocol="BACnet", ip="192.168.1.104", port=47808, location="Building B - Server Room", is_active=True),
            Device(device_id="HVAC_005", name="Lobby Climate Control", protocol="Modbus", ip="192.168.1.105", port=502, location="Building A - Lobby", is_active=True),
        ]
        for device in devices:
            db.add(device)
    
    db.commit()

# Simulation task
async def simulation_task():
    while True:
        try:
            db = SessionLocal()
            devices = db.query(Device).filter(Device.is_active == True).all()
            
            for device in devices:
                # Generate telemetry data
                telemetry_data = simulate_device_data(device.device_id)
                
                for metric_name, value in telemetry_data.items():
                    telemetry = Telemetry(
                        device_id=device.id,
                        metric_name=metric_name,
                        metric_value=value,
                        timestamp=datetime.utcnow()
                    )
                    db.add(telemetry)
                
                # Check for alerts
                if telemetry_data.get('temperature', 0) > 45:
                    alert = Alert(
                        device_id=device.id,
                        rule_json=json.dumps({"metric": "temperature", "threshold": 45, "operator": ">"}),
                        status="active",
                        triggered_at=datetime.utcnow()
                    )
                    db.add(alert)
                
                if telemetry_data.get('co2_ppm', 0) > 1000:
                    alert = Alert(
                        device_id=device.id,
                        rule_json=json.dumps({"metric": "co2_ppm", "threshold": 1000, "operator": ">"}),
                        status="active",
                        triggered_at=datetime.utcnow()
                    )
                    db.add(alert)
            
            db.commit()
            
            # Broadcast updates via WebSocket
            await manager.broadcast(json.dumps({
                "type": "telemetry_update",
                "timestamp": datetime.utcnow().isoformat()
            }))
            
            db.close()
            await asyncio.sleep(10)  # Update every 10 seconds
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            await asyncio.sleep(10)

def open_browser():
    import os
    port = int(os.environ.get("PORT", 7000))
    time.sleep(2)
    webbrowser.open(f'http://localhost:{port}')

app = FastAPI(
    title="Voltas BMS Automation API",
    description="Building Management System API for device monitoring and control",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        init_default_data(db)
        # Start simulation task
        asyncio.create_task(simulation_task())
        # Open browser in a separate thread
        threading.Thread(target=open_browser, daemon=True).start()
    finally:
        db.close()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve the main page
@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Authentication endpoints
@app.post("/api/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
    }

# Device endpoints
@app.get("/api/devices", response_model=List[DeviceResponse])
async def get_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    devices = db.query(Device).all()
    result = []
    
    for device in devices:
        # Get latest telemetry
        latest_telemetry = db.query(Telemetry).filter(
            Telemetry.device_id == device.id
        ).order_by(Telemetry.timestamp.desc()).limit(5).all()
        
        telemetry_dict = {}
        for t in latest_telemetry:
            telemetry_dict[t.metric_name] = t.metric_value
        
        # Check if device is online (last update within 1 minute)
        last_update = db.query(Telemetry).filter(
            Telemetry.device_id == device.id
        ).order_by(Telemetry.timestamp.desc()).first()
        
        is_online = False
        if last_update:
            is_online = (datetime.utcnow() - last_update.timestamp).seconds < 60
        
        result.append(DeviceResponse(
            id=device.id,
            device_id=device.device_id,
            name=device.name,
            protocol=device.protocol,
            ip=device.ip,
            port=device.port,
            location=device.location,
            is_active=device.is_active,
            is_online=is_online,
            last_heartbeat=last_update.timestamp if last_update else None,
            telemetry=telemetry_dict,
            created_at=device.created_at
        ))
    
    return result

@app.post("/api/devices", response_model=DeviceResponse)
async def create_device(device: DeviceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db_device = Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    
    return DeviceResponse(
        id=db_device.id,
        device_id=db_device.device_id,
        name=db_device.name,
        protocol=db_device.protocol,
        ip=db_device.ip,
        port=db_device.port,
        location=db_device.location,
        is_active=db_device.is_active,
        is_online=False,
        telemetry={},
        created_at=db_device.created_at
    )

@app.get("/api/alerts")
async def get_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).join(Device).all()
    return [{
        "id": alert.id,
        "device_id": alert.device_id,
        "device_name": alert.device.name,
        "rule_json": alert.rule_json,
        "status": alert.status,
        "triggered_at": alert.triggered_at
    } for alert in alerts]

@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "acknowledged"
    alert.acknowledged_by = current_user.id
    alert.ack_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Alert acknowledged"}

@app.post("/api/commands")
async def send_command(command: CommandCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db_command = Command(
        device_id=command.device_id,
        command_type=command.command_type,
        payload=command.payload,
        status="executed",
        issued_by=current_user.id
    )
    db.add(db_command)
    db.commit()
    
    return {"message": "Command executed"}

@app.get("/api/logs")
async def get_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(Log).order_by(Log.timestamp.desc()).limit(50).all()
    return [{
        "id": log.id,
        "event_type": log.event_type,
        "message": log.message,
        "timestamp": log.timestamp
    } for log in logs]

@app.get("/api/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_devices = db.query(Device).count()
    active_devices = db.query(Device).filter(Device.is_active == True).count()
    active_alerts = db.query(Alert).filter(Alert.status == "active").count()
    
    # Get online devices (last telemetry within 1 minute)
    one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
    online_devices_count = db.query(Telemetry.device_id).filter(
        Telemetry.timestamp >= one_minute_ago
    ).distinct().count()
    
    # Get average CO2
    avg_co2_query = db.query(Telemetry).filter(
        Telemetry.metric_name == "co2_ppm",
        Telemetry.timestamp >= one_minute_ago
    ).all()
    
    avg_co2 = sum(t.metric_value for t in avg_co2_query) / len(avg_co2_query) if avg_co2_query else 0
    
    return {
        "total_devices": total_devices,
        "active_devices": active_devices,
        "online_devices": online_devices_count,
        "active_alerts": active_alerts,
        "avg_co2_ppm": round(avg_co2, 1)
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 7000))
    uvicorn.run(app, host="0.0.0.0", port=port)