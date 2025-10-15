from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="guest")  # admin, operator, guest
    created_at = Column(DateTime, default=datetime.utcnow)

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    protocol = Column(String(20), nullable=False)  # Modbus, BACnet
    ip = Column(String(15), nullable=False)
    port = Column(Integer, nullable=False)
    location = Column(String(200))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    telemetry = relationship("Telemetry", back_populates="device", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="device", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="device", cascade="all, delete-orphan")
    commands = relationship("Command", back_populates="device", cascade="all, delete-orphan")

class Telemetry(Base):
    __tablename__ = "telemetry"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    metric_name = Column(String(50), nullable=False)  # temperature, co2_ppm, humidity, power_kw, status
    metric_value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    device = relationship("Device", back_populates="telemetry")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    rule_json = Column(Text, nullable=False)  # JSON string with rule definition
    status = Column(String(20), nullable=False, default="active")  # active, acknowledged, resolved
    triggered_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    ack_at = Column(DateTime)
    
    # Relationships
    device = relationship("Device", back_populates="alerts")
    acknowledged_user = relationship("User")

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    event_type = Column(String(50), nullable=False)  # device_created, command_sent, alert_triggered, etc.
    message = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    device = relationship("Device", back_populates="logs")
    user = relationship("User")

class Command(Base):
    __tablename__ = "commands"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    command_type = Column(String(50), nullable=False)  # ON, OFF, SET_TEMPERATURE, etc.
    payload = Column(Text)  # JSON string with command parameters
    status = Column(String(20), nullable=False, default="pending")  # pending, executed, failed
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    device = relationship("Device", back_populates="commands")
    user = relationship("User")