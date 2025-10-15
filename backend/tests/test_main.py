import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json

from main import app, get_db
from database import Base
from models import User, Device
from auth import get_password_hash

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def test_user(client):
    db = TestingSessionLocal()
    user = User(
        name="Test User",
        email="test@voltas.com",
        password_hash=get_password_hash("testpass"),
        role="admin"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user

@pytest.fixture(scope="module")
def auth_headers(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "test@voltas.com",
        "password": "testpass"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_login(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "test@voltas.com",
        "password": "testpass"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@voltas.com"

def test_login_invalid_credentials(client):
    response = client.post("/api/auth/login", json={
        "email": "test@voltas.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401

def test_create_device(client, auth_headers):
    device_data = {
        "device_id": "TEST_001",
        "name": "Test Device",
        "protocol": "Modbus",
        "ip": "192.168.1.100",
        "port": 502,
        "location": "Test Location",
        "is_active": True
    }
    response = client.post("/api/devices", json=device_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["device_id"] == "TEST_001"
    assert data["name"] == "Test Device"

def test_get_devices(client, auth_headers):
    response = client.get("/api/devices", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_device_by_id(client, auth_headers):
    # First create a device
    device_data = {
        "device_id": "TEST_002",
        "name": "Test Device 2",
        "protocol": "BACnet",
        "ip": "192.168.1.101",
        "port": 47808,
        "is_active": True
    }
    create_response = client.post("/api/devices", json=device_data, headers=auth_headers)
    device_id = create_response.json()["id"]
    
    # Get the device
    response = client.get(f"/api/devices/{device_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["device_id"] == "TEST_002"

def test_update_device(client, auth_headers):
    # First create a device
    device_data = {
        "device_id": "TEST_003",
        "name": "Test Device 3",
        "protocol": "Modbus",
        "ip": "192.168.1.102",
        "port": 502,
        "is_active": True
    }
    create_response = client.post("/api/devices", json=device_data, headers=auth_headers)
    device_id = create_response.json()["id"]
    
    # Update the device
    update_data = {"name": "Updated Test Device 3"}
    response = client.put(f"/api/devices/{device_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Test Device 3"

def test_delete_device(client, auth_headers):
    # First create a device
    device_data = {
        "device_id": "TEST_004",
        "name": "Test Device 4",
        "protocol": "Modbus",
        "ip": "192.168.1.103",
        "port": 502,
        "is_active": True
    }
    create_response = client.post("/api/devices", json=device_data, headers=auth_headers)
    device_id = create_response.json()["id"]
    
    # Delete the device
    response = client.delete(f"/api/devices/{device_id}", headers=auth_headers)
    assert response.status_code == 200

def test_get_telemetry(client, auth_headers):
    response = client.get("/api/telemetry", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_alerts(client, auth_headers):
    response = client.get("/api/alerts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_logs(client, auth_headers):
    response = client.get("/api/logs", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_dashboard(client, auth_headers):
    response = client.get("/api/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_devices" in data
    assert "active_devices" in data
    assert "online_devices" in data
    assert "active_alerts" in data
    assert "avg_co2_ppm" in data

def test_unauthorized_access(client):
    response = client.get("/api/devices")
    assert response.status_code == 401