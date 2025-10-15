from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any

# User schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Device schemas
class DeviceBase(BaseModel):
    device_id: str
    name: str
    protocol: str
    ip: str
    port: int
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    protocol: Optional[str] = None
    ip: Optional[str] = None
    port: Optional[int] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DeviceResponse(DeviceBase):
    id: int
    is_online: bool
    last_heartbeat: Optional[datetime] = None
    telemetry: Dict[str, float] = {}
    created_at: datetime

    class Config:
        from_attributes = True

# Telemetry schemas
class TelemetryCreate(BaseModel):
    device_id: int
    metric_name: str
    metric_value: float

class TelemetryResponse(BaseModel):
    id: int
    device_id: int
    metric_name: str
    metric_value: float
    timestamp: datetime

    class Config:
        from_attributes = True

# Alert schemas
class AlertCreate(BaseModel):
    device_id: int
    rule_json: str

class AlertResponse(BaseModel):
    id: int
    device_id: int
    device_name: str
    rule_json: str
    status: str
    triggered_at: datetime
    acknowledged_by: Optional[int] = None
    ack_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Command schemas
class CommandCreate(BaseModel):
    device_id: int
    command_type: str
    payload: Optional[str] = None

class CommandResponse(BaseModel):
    id: int
    device_id: int
    command_type: str
    payload: Optional[str] = None
    status: str
    issued_by: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Log schemas
class LogResponse(BaseModel):
    id: int
    device_id: Optional[int] = None
    device_name: Optional[str] = None
    event_type: str
    message: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True